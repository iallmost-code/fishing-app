import type { WeatherSnapshot } from "../services/weather";
import type { LureRecommendation } from "./lureRecommendations";
import { periodFor, type Period, type PlanWater } from "./lurePlan";
import { dateKey } from "../utils/format";

export type CurrentLure = LureRecommendation & { when: string };
export type CurrentLurePicks = {
  period: Period;
  time: string;
  picks: [CurrentLure, CurrentLure];
  limitedWeather: boolean;
  outdatedWeather: boolean;
};
const MINUTE = 60000;
const make = (
  name: string,
  color: string,
  when: string,
  retrieve: string,
  target: string,
  reason: string,
): CurrentLure => ({ name, color, when, retrieve, target, reason });

/**
 * Two choices for the present, never future forecast stretches.
 * Light comes from this location's sun times, with local-clock fallback.
 * Weather older than 90 minutes is not used as current conditions. Air
 * temperature is not water temperature; rain probability is not observed rain;
 * pressure changes do not imply light, water clarity, or fish activity.
 */
export function getCurrentLurePicks(
  weather: WeatherSnapshot,
  time = weather.current.time,
  water?: PlanWater,
): CurrentLurePicks {
  const date = dateKey(time, weather.timezone);
  const day = weather.daily.find((d) => d.date === date);
  const sameDay = dateKey(weather.current.time, weather.timezone) === date;
  const sunrise = day?.sunrise ?? (sameDay ? weather.sunrise : undefined);
  const sunset = day?.sunset ?? (sameDay ? weather.sunset : undefined);
  const period = periodFor(time, weather.timezone, sunrise, sunset);
  const t = Date.parse(time),
    rise = Date.parse(sunrise ?? ""),
    set = Date.parse(sunset ?? "");
  const sunKnown = Number.isFinite(rise) && Number.isFinite(set);
  const dark = sunKnown
    ? t < rise - 30 * MINUTE || t >= set + 30 * MINUTE
    : period === "Before dawn" || period === "Night";
  const low = !dark && (period === "Early morning" || period === "Evening");
  const age = t - Date.parse(weather.current.time);
  const fresh = age >= -15 * MINUTE && age <= 90 * MINUTE;
  const c = weather.current;
  const windy = fresh && c.windMph !== null && c.windMph >= 8;
  const calm = fresh && c.windMph !== null && c.windMph < 8;
  const cloudy = fresh && c.cloudCover !== null && c.cloudCover >= 70;
  const bright = fresh && c.cloudCover !== null && c.cloudCover < 50;
  const raining = fresh && c.precipitation !== null && c.precipitation > 0;
  const cover =
    water === "river"
      ? "Slack water behind rocks, wood and current seams"
      : water === "pond"
        ? "Bank cover, weed pockets and the dam"
        : "Docks, wood and holes in the grass";
  const texas = (night = false) =>
    make(
      "Texas Rig",
      night ? "Black / blue" : "Green pumpkin",
      "Now, around cover or when bass won't chase a moving bait.",
      "Let it sink; drag slowly with pauses.",
      cover,
      night
        ? "A dark, slow presentation is an option in cover after dark."
        : "A slow presentation lets you work cover without depending on surface feeding.",
    );
  const swimmer = () =>
    make(
      "Paddle-tail Swimbait",
      "Natural shad",
      "Now, when you see baitfish or bass following without hitting the first lure.",
      "Slow, steady retrieve; pause beside cover.",
      "Points, grass edges and visible baitfish",
      cloudy
        ? "Heavy cloud cover makes a moving bait worth trying; match the baitfish you can see."
        : "A baitfish-shaped backup for searching edges and visible forage.",
    );
  let picks: [CurrentLure, CurrentLure];
  if (dark) {
    picks = [
      texas(true),
      windy
        ? make(
            "Spinnerbait",
            "Black",
            "Now, on banks with chop or where you can hear fish feeding.",
            "Slow roll, keeping the blades turning.",
            "Wind-blown banks and shallow cover near deeper water",
            "It is dark and wind is reported; blade vibration offers an alternative to a bottom bait.",
          )
        : make(
            "Buzzbait",
            "Black",
            "Now, only if fish are feeding at the surface; otherwise stay with the Texas rig.",
            "Steady retrieve, just fast enough to keep it on top.",
            "Shallow banks and grass edges",
            "In darkness, a surface bait offers sound and silhouette. Surface feeding is something to verify on the water.",
          ),
    ];
  } else if (raining || windy) {
    picks = [
      make(
        raining ? "Spinnerbait" : "Chatterbait",
        cloudy ? "White / chartreuse" : "White / shad",
        "Now, on banks with chop, grass edges or visible baitfish.",
        raining
          ? "Slow to medium retrieve; keep the blades turning."
          : "Steady medium retrieve, lightly ticking the grass.",
        "Wind-blown banks, grass edges and shallow cover",
        raining
          ? "Rain is reported now; vibration offers a search bait. Check runoff on the water before fishing it."
          : `${Math.round(c.windMph!)} mph wind is reported now; a vibrating moving bait is an option in the chop.`,
      ),
      texas(),
    ];
  } else if (low && calm) {
    picks = [
      make(
        "Walking Topwater",
        cloudy ? "Bone" : "Natural shad",
        `Now, during ${period.toLowerCase()}, if you see surface feeding.`,
        "Walk the dog; pause beside grass and cover.",
        "Shallow points, flats and grass edges",
        "Near sunrise or sunset, with light wind reported, a surface presentation is worth checking. Look for feeding fish first.",
      ),
      swimmer(),
    ];
  } else if (bright && !low) {
    picks = [
      make(
        "Texas Rig",
        "Green pumpkin",
        "Now, in shade or cover during daylight.",
        "Pitch to cover; let it fall, then drag slowly.",
        `Shade around ${cover.toLowerCase()}`,
        "Low cloud cover is reported during daylight; a slow bait lets you work shaded cover.",
      ),
      swimmer(),
    ];
  } else {
    picks = [swimmer(), texas()];
  }
  return {
    period,
    time,
    picks,
    outdatedWeather: !fresh,
    limitedWeather: !fresh || c.windMph === null || c.cloudCover === null,
  };
}
