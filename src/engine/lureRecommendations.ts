import type { WeatherSnapshot } from "../services/weather";
import type { PressureTrend } from "./fishingScore";

export type LureRecommendation = {
  name: string;
  color: string;
  retrieve: string;
  target: string;
  reason: string;
};

export function getLureRecommendations(
  weather: WeatherSnapshot,
  pressure: PressureTrend,
): LureRecommendation[] {
  const windy =
    weather.current.windMph !== null && weather.current.windMph >= 6;
  const cloudy =
    weather.current.cloudCover !== null && weather.current.cloudCover >= 50;
  const falling = pressure.label.includes("Falling");
  const lowLight = cloudy || falling;

  const picks: LureRecommendation[] = [];

  if (windy)
    picks.push({
      name: "Chatterbait",
      color: cloudy ? "White / chartreuse" : "Shad",
      retrieve: "Steady medium retrieve with occasional contact",
      target: "Wind-blown banks, grass edges and shallow cover",
      reason: "Wind adds chop and vibration helps fish locate the bait.",
    });

  if (lowLight)
    picks.push({
      name: "Topwater",
      color: cloudy ? "Bone / shad" : "Natural shad",
      retrieve: "Start steady; add pauses around cover",
      target: "Points, shade lines, shallow cover and bait activity",
      reason: cloudy
        ? "Cloud cover reduces light, making shallow cover worth exploring."
        : "A shallow-water option while pressure is falling. Look for surface activity before committing; pressure alone does not predict a bite.",
    });

  picks.push({
    name: "Swimbait",
    color: "Natural shad",
    retrieve: windy ? "Medium retrieve" : "Slow to medium retrieve",
    target: "Points, edges, docks and visible bait",
    reason:
      "A versatile moving bait that matches forage across changing conditions.",
  });

  if (!windy && weather.current.windMph !== null)
    picks.push({
      name: "Texas Rig",
      color: "Green pumpkin",
      retrieve: "Slow drag with pauses",
      target: "Wood, docks, grass holes and isolated cover",
      reason:
        "A slower presentation is useful when wind and surface activity are limited.",
    });

  return picks.slice(0, 3);
}
