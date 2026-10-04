import { describe, expect, it } from "vitest";
import { getCurrentLurePicks } from "./currentLures";
import type { WeatherSnapshot } from "../services/weather";

const sunrise = "2026-10-04T11:30:00Z",
  sunset = "2026-10-04T23:15:00Z";
function weather(
  time: string,
  over: Partial<WeatherSnapshot["current"]> = {},
): WeatherSnapshot {
  return {
    latitude: 33.8,
    longitude: -83.7,
    timezone: "America/New_York",
    fetchedAt: time,
    current: {
      time,
      temperature: 72,
      apparentTemperature: 72,
      pressureHpa: 1015,
      windMph: 3,
      windDirection: 180,
      cloudCover: 20,
      precipitation: 0,
      precipitationChance: 10,
      weatherCode: 1,
      ...over,
    },
    hourly: [],
    daily: [
      {
        date: "2026-10-04",
        time: "2026-10-04T04:00:00Z",
        high: 80,
        low: 60,
        windMph: 6,
        weatherCode: 1,
        precipitationChance: 10,
        sunrise,
        sunset,
      },
    ],
    sunrise,
    sunset,
  };
}
describe("right-now lure choices", () => {
  it.each([
    ["2026-10-04T08:00:00Z", "Before dawn"],
    ["2026-10-04T12:00:00Z", "Early morning"],
    ["2026-10-04T16:00:00Z", "Midday"],
    ["2026-10-04T22:00:00Z", "Evening"],
    ["2026-10-05T02:00:00Z", "Night"],
  ])("shows exactly two distinct choices at %s", (time, period) => {
    const out = getCurrentLurePicks(weather(time));
    expect(out.period).toBe(period);
    expect(out.picks).toHaveLength(2);
    expect(new Set(out.picks.map((p) => p.name)).size).toBe(2);
    for (const p of out.picks)
      for (const value of Object.values(p))
        expect(value.length).toBeGreaterThan(0);
  });
  it("does not show nighttime colors or topwater at bright midday", () => {
    const out = getCurrentLurePicks(weather("2026-10-04T16:00:00Z"));
    expect(out.picks[0].name).toBe("Texas Rig");
    expect(out.picks.some((p) => /Topwater|Buzzbait/.test(p.name))).toBe(false);
    expect(out.picks.every((p) => !/Black/.test(p.color))).toBe(true);
  });
  it("uses black silhouettes before dawn, with a conditional surface backup", () => {
    const out = getCurrentLurePicks(weather("2026-10-04T08:00:00Z"));
    expect(out.picks.every((p) => p.color.includes("Black"))).toBe(true);
    expect(out.picks[1].when).toMatch(/only if fish are feeding/);
  });
  it("uses current wind and clouds instead of later forecast conditions", () => {
    const w = weather("2026-10-04T16:00:00Z", { windMph: 12, cloudCover: 80 });
    const out = getCurrentLurePicks(w);
    expect(out.picks[0].name).toBe("Chatterbait");
    expect(out.picks[0].color).toBe("White / chartreuse");
    expect(out.picks[0].reason).toContain("12 mph");
  });
  it("does not treat rain probability as actual rain or invent stained water", () => {
    const out = getCurrentLurePicks(
      weather("2026-10-04T16:00:00Z", { precipitationChance: 90 }),
    );
    expect(out.picks[0].name).not.toBe("Spinnerbait");
    expect(
      out.picks.every((p) => !/stain|muddy|cold water/i.test(p.reason)),
    ).toBe(true);
  });
  it("offers topwater at calm dawn, but not simply because midday is overcast", () => {
    expect(
      getCurrentLurePicks(weather("2026-10-04T12:00:00Z")).picks[0].name,
    ).toBe("Walking Topwater");
    expect(
      getCurrentLurePicks(weather("2026-10-04T16:00:00Z", { cloudCover: 100 }))
        .picks[0].name,
    ).toBe("Paddle-tail Swimbait");
  });
  it("ignores stale wind/rain and uses this moment's local period", () => {
    const w = weather("2026-10-04T12:00:00Z", {
      windMph: 20,
      precipitation: 1,
    });
    const out = getCurrentLurePicks(w, "2026-10-04T16:00:00Z");
    expect(out.period).toBe("Midday");
    expect(out.limitedWeather).toBe(true);
    expect(out.picks[0].name).toBe("Paddle-tail Swimbait");
  });
  it("works with missing readings and sun times without claiming calm weather", () => {
    const w = weather("2026-10-04T16:00:00Z", {
      windMph: null,
      cloudCover: null,
      temperature: null,
      precipitation: null,
    });
    w.daily = [];
    w.sunrise = undefined;
    w.sunset = undefined;
    const out = getCurrentLurePicks(w);
    expect(out.period).toBe("Midday");
    expect(out.limitedWeather).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/undefined|NaN|reported|mph/);
  });
  it("uses the selected location timezone instead of the device's", () => {
    const w = weather("2026-10-04T07:00:00Z");
    w.timezone = "Asia/Tokyo";
    w.daily = [];
    w.sunrise = undefined;
    w.sunset = undefined;
    expect(getCurrentLurePicks(w).period).toBe("Afternoon");
  });
  it("does not use yesterday's sun times across midnight", () => {
    const w = weather("2026-10-04T16:00:00Z");
    expect(getCurrentLurePicks(w, "2026-10-05T05:00:00Z").period).toBe(
      "Before dawn",
    );
  });
  it("keeps cover advice appropriate for rivers", () => {
    const out = getCurrentLurePicks(
      weather("2026-10-04T16:00:00Z"),
      undefined,
      "river",
    );
    expect(out.picks[0].target).toMatch(/current seams/);
  });
});
