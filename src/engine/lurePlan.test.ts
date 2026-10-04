import { describe, expect, it } from "vitest";
import {
  lurePlan,
  mergeSameBait,
  periodFor,
  pickLure,
  type Conditions,
  type LurePlanStop,
} from "./lurePlan";
import { scoreForecast } from "./forecast";
import type { WeatherSnapshot, WeatherHour } from "../services/weather";

const base: Conditions = {
  light: "bright",
  windMph: 4,
  cloudCover: 20,
  rainChance: 10,
  pressure: "Stable",
  temperature: 75,
  month: 7,
};

describe("pickLure", () => {
  it("goes shallow with topwater in low light", () => {
    const lure = pickLure({ ...base, light: "low" });
    expect(lure.name).toBe("Topwater");
    expect(lure.target).toMatch(/Shallow/);
  });
  it("follows shad into creeks in the fall", () => {
    expect(pickLure({ ...base, light: "low", month: 10 }).target).toMatch(
      /creeks/,
    );
  });
  it("fishes wind-blown banks when it's windy", () => {
    const lure = pickLure({ ...base, windMph: 14 });
    expect(lure.name).toBe("Chatterbait");
    expect(lure.target).toMatch(/Wind-blown/);
  });
  it("hides in shade under bright, calm skies", () => {
    expect(pickLure(base).target).toMatch(/Shade/);
  });
  it("uses a spinnerbait at runoff when rain is likely", () => {
    expect(pickLure({ ...base, rainChance: 80 }).name).toBe("Spinnerbait");
  });
  it("doesn't throw topwater all day just because it's overcast", () => {
    const lure = pickLure({ ...base, light: "bright", cloudCover: 100 });
    expect(lure.name).not.toBe("Topwater");
    expect(lure.name).toBe("Swimbait");
    // Dawn and dusk under cloud still get topwater.
    expect(pickLure({ ...base, light: "low", cloudCover: 100 }).name).toBe(
      "Topwater",
    );
  });
  it("goes dark at night", () => {
    expect(pickLure({ ...base, light: "dark" }).color).toMatch(/Black/);
  });
  it("adds river and pond advice to where", () => {
    expect(pickLure({ ...base, water: "river" }).target).toMatch(/eddies/);
    expect(pickLure({ ...base, water: "pond" }).target).toMatch(/bank/);
  });
});

describe("lurePlan", () => {
  // Atlanta-like day: sunrise 11:30Z (7:30 EDT), sunset 23:15Z (7:15 PM).
  const sunrise = "2026-10-03T11:30:00.000Z",
    sunset = "2026-10-03T23:15:00.000Z";
  const hour = (iso: string, over: Partial<WeatherHour> = {}): WeatherHour => ({
    time: iso,
    temperature: 75,
    pressureHpa: 1015,
    cloudCover: 20,
    windMph: 4,
    windDirection: 180,
    precipitationChance: 10,
    weatherCode: 1,
    ...over,
  });
  const hours = Array.from({ length: 16 }, (_, i) =>
    hour(
      new Date(Date.parse("2026-10-03T16:00:00Z") + i * 3600000).toISOString(),
    ),
  );
  const weather: WeatherSnapshot = {
    latitude: 33.8,
    longitude: -83.7,
    timezone: "America/New_York",
    fetchedAt: "2026-10-03T16:05:00.000Z",
    current: {
      time: "2026-10-03T16:00:00.000Z",
      temperature: 75,
      apparentTemperature: 75,
      pressureHpa: 1015,
      cloudCover: 20,
      windMph: 4,
      windDirection: 180,
      precipitation: 0,
      precipitationChance: 10,
      weatherCode: 1,
    },
    hourly: hours,
    daily: [
      {
        date: "2026-10-03",
        time: "2026-10-03T04:00:00.000Z",
        high: 80,
        low: 60,
        weatherCode: 1,
        windMph: 6,
        precipitationChance: 10,
        sunrise,
        sunset,
      },
    ],
    sunrise,
    sunset,
  };

  it("splits the rest of the day into stretches with a bait each", () => {
    const plan = lurePlan(weather, scoreForecast(weather));
    // Midday and afternoon want the same bait, so they share one stop.
    expect(plan.map((p) => p.period)).toEqual([
      "Midday – Afternoon",
      "Evening",
      "Night",
    ]);
    expect(plan[0].target).toMatch(/Shade/);
    expect(plan[1].name).toBe("Topwater");
    expect(plan[2].color).toMatch(/Black/);
    // Stretches are back to back.
    for (let i = 1; i < plan.length; i++)
      expect(plan[i].start).toBe(plan[i - 1].end);
  });

  it("labels periods around sunrise and sunset", () => {
    const tz = "America/New_York";
    expect(periodFor("2026-10-03T08:00:00Z", tz, sunrise, sunset)).toBe(
      "Before dawn",
    );
    expect(periodFor("2026-10-03T11:00:00Z", tz, sunrise, sunset)).toBe(
      "Early morning",
    );
    expect(periodFor("2026-10-03T22:00:00Z", tz, sunrise, sunset)).toBe(
      "Evening",
    );
    expect(periodFor("2026-10-04T02:00:00Z", tz, sunrise, sunset)).toBe(
      "Night",
    );
  });
});

describe("mergeSameBait", () => {
  const stop = (
    period: string,
    start: number,
    end: number,
    name = "Topwater",
    prime = false,
    score = 70,
  ): LurePlanStop => ({
    name,
    color: "Bone",
    retrieve: "Walk the dog",
    target: "Shallow points",
    reason: "x",
    period,
    start: new Date(start * 3600000).toISOString(),
    end: new Date(end * 3600000).toISOString(),
    prime,
    score,
  });
  it("merges neighbours with the same bait and keeps different ones apart", () => {
    const out = mergeSameBait([
      stop("Early morning", 0, 2),
      stop("Morning", 2, 5, "Topwater", true, 80),
      stop("Midday", 5, 8, "Texas Rig"),
      stop("Afternoon", 8, 10, "Topwater"),
    ]);
    expect(out.map((s) => s.name)).toEqual([
      "Topwater",
      "Texas Rig",
      "Topwater",
    ]);
    expect(out[0].period).toBe("Early morning – Morning");
    expect(out[0].prime).toBe(true);
    expect(out[0].score).toBe(76); // (70×2 + 80×3) / 5
    expect(out[0].end).toBe(new Date(5 * 3600000).toISOString());
  });
});
