import { describe, it, expect } from "vitest";
import { pressureAt, classifyPressure } from "./pressureAnalysis";
import { getFishingWindows } from "./fishingWindows";
import {
  calculateHourlyScore,
  calculateFishingScore,
  scoreLabel,
  SCORE_WEIGHTS,
} from "./fishingScore";
import { dailyOutlook, scoreForecast } from "./forecast";
import { normalizeWeather, type WeatherHour } from "../services/weather";
import { radiusPolygon } from "../services/maps/radius";
import { dateKey } from "../utils/format";
const start = Date.parse("2026-07-04T10:00:00Z");
const time = (i: number) => new Date(start + i * 3600000).toISOString();
const hour = (i: number, p: number | null = 1015 - i): WeatherHour => ({
  time: time(i),
  pressureHpa: p,
  temperature: 70,
  cloudCover: 65,
  windMph: 8,
  windDirection: 225,
  precipitationChance: 30,
  weatherCode: 3,
});
const hours = Array.from({ length: 24 }, (_, i) => hour(i));
describe("pressure", () => {
  it("uses real readings for 1/3/6 hour changes and rate", () => {
    const p = pressureAt(hours, time(6), 1009);
    expect(p).toEqual({
      oneHour: -1,
      threeHour: -3,
      sixHour: -6,
      rate: -1,
      label: "Falling",
    });
  });
  it("does not invent missing or distant historical readings", () => {
    const p = pressureAt([hour(0), hour(6)], time(6), 1009);
    expect(p.oneHour).toBeNull();
    expect(p.threeHour).toBeNull();
    expect(p.sixHour).toBe(-6);
    expect(p.label).toBe("Unavailable");
  });
  it("handles current observation within the hourly interval", () => {
    const p = pressureAt(
      hours,
      new Date(start + 6 * 3600000 + 15 * 60000).toISOString(),
      1009,
    );
    expect(p.threeHour).toBe(-3);
  });
  it("classifies all five trends", () => {
    expect([-1.2, -0.25, 0, 0.25, 1.2].map(classifyPressure)).toEqual([
      "Rapidly Falling",
      "Falling",
      "Stable",
      "Rising",
      "Rapidly Rising",
    ]);
  });
});
describe("windows", () => {
  it("ranks continuous groups rather than isolated peaks", () => {
    const values = [80, 84, 50, 78, 80, 50, 90];
    const w = getFishingWindows(
      values.map((score, i) => ({ time: time(i), score })),
    );
    expect(w).toHaveLength(1);
    expect(w[0]).toEqual({
      start: time(0),
      end: time(2),
      averageScore: 82,
      peakScore: 84,
      hours: 2,
    });
  });
  it("produces a secondary window when appropriate", () => {
    const values = [82, 86, 50, 80, 84];
    const w = getFishingWindows(
      values.map((score, i) => ({ time: time(i), score })),
    );
    expect(w.map((w) => w.averageScore)).toEqual([84, 82]);
  });
  it("never bridges a missing hour or emits weak windows", () => {
    expect(
      getFishingWindows([
        { time: time(0), score: 90 },
        { time: time(2), score: 90 },
      ]),
    ).toEqual([]);
    expect(
      getFishingWindows([40, 50].map((score, i) => ({ time: time(i), score }))),
    ).toEqual([]);
  });
});
describe("scores", () => {
  it("reconstructs every hourly score from its contributors", () => {
    const result = calculateHourlyScore(hour(6), hours, {
      date: "2026-07-04",
      time: time(0),
      high: 80,
      low: 60,
      windMph: 8,
      precipitationChance: 30,
      weatherCode: 3,
      sunrise: time(6),
      sunset: time(18),
    });
    expect(result.score).toBe(
      Math.min(
        100,
        Math.round(
          SCORE_WEIGHTS.hourlyBase +
            result.reasons.reduce((s, r) => s + r.impact, 0),
        ),
      ),
    );
  });
  it("stays finite when weather fields are unavailable", () => {
    const result = calculateHourlyScore(
      {
        ...hour(0),
        temperature: null,
        pressureHpa: null,
        windMph: null,
        cloudCover: null,
        precipitationChance: null,
      },
      [],
    );
    expect(result.score).toBe(46);
    expect(result.unavailable).toContain("Rain probability unavailable");
    expect(result.pressure.label).toBe("Unavailable");
  });
  it("matches the required score boundaries", () => {
    expect([29, 30, 49, 50, 69, 70, 84, 85].map(scoreLabel)).toEqual([
      "Poor",
      "Fair",
      "Fair",
      "Good",
      "Good",
      "Very Good",
      "Very Good",
      "Excellent",
    ]);
  });
});
describe("weather contracts and timezone", () => {
  const raw = {
    latitude: 33.8,
    longitude: -83.7,
    timezone: "America/New_York",
    current: { time: start / 1000, temperature_2m: 75, pressure_msl: 1015 },
    hourly: {
      time: [start / 1000],
      temperature_2m: [75],
      pressure_msl: [1015],
    },
    daily: {
      time: [start / 1000],
      sunrise: [start / 1000],
      sunset: [start / 1000 + 43200],
    },
  };
  it("keeps absent weather null rather than inventing zero rain", () => {
    const weather = normalizeWeather(raw);
    expect(weather.hourly[0].precipitationChance).toBeNull();
    expect(weather.current.precipitationChance).toBeNull();
    expect(weather.current.time).toBe(time(0));
    expect(Number.isFinite(calculateFishingScore(weather).score)).toBe(true);
  });
  it("rejects incomplete envelopes", () => {
    expect(() => normalizeWeather({})).toThrow("incomplete forecast");
  });
  it("groups days in the location timezone, not the browser timezone", () => {
    expect(dateKey("2026-07-05T02:00:00Z", "America/New_York")).toBe(
      "2026-07-04",
    );
    const weather = normalizeWeather(raw);
    const d = dailyOutlook(
      weather.daily[0],
      scoreForecast(weather),
      weather.timezone,
    );
    expect(d.hours).toHaveLength(1);
  });
});
describe("map radius", () => {
  it("returns a finite, closed real-world radius polygon", () => {
    const p = radiusPolygon(33.7948, -83.7132, 50);
    const c = p.geometry.coordinates[0];
    expect(c).toHaveLength(65);
    expect(c[0][0]).toBeCloseTo(c[64][0]);
    expect(c[0][1]).toBeCloseTo(c[64][1]);
    expect(c.flat().every(Number.isFinite)).toBe(true);
    expect(c[0][1]).toBeGreaterThan(34);
  });
});
