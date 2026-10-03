import type {
  WeatherSnapshot,
  WeatherHour,
  WeatherDay,
} from "../services/weather";
import { pressureAt, type PressureTrend } from "./pressureAnalysis";
export type { PressureTrend } from "./pressureAnalysis";
export type ScoreResult = {
  score: number;
  label: "Poor" | "Fair" | "Good" | "Very Good" | "Excellent";
  reasons: { text: string; impact: number }[];
  unavailable: string[];
  pressure: PressureTrend;
};
export const SCORE_WEIGHTS = {
  base: 48,
  hourlyBase: 46,
  falling: 14,
  rapidlyFalling: 8,
  stable: 6,
  rising: 1,
  rapidlyRising: -5,
  moderateWind: 10,
  strongWind: -10,
  breeze: 3,
  calm: 2,
  partialCloud: 9,
  heavyCloud: 5,
  clear: 1,
  sunriseSunset: 12,
  lightRain: 2,
  mildTemperature: 3,
  extremeTemperature: -6,
  recentTemperatureSwing: -4,
};
export function scoreLabel(score: number): ScoreResult["label"] {
  return score >= 85
    ? "Excellent"
    : score >= 70
      ? "Very Good"
      : score >= 50
        ? "Good"
        : score >= 30
          ? "Fair"
          : "Poor";
}
export function analyzePressure(weather: WeatherSnapshot): PressureTrend {
  return pressureAt(
    weather.hourly,
    weather.current.time,
    weather.current.pressureHpa,
  );
}
function timeProximityScore(time: string, sunrise?: string, sunset?: string) {
  const anchors = [sunrise, sunset].filter(
    (v): v is string => !!v && Number.isFinite(Date.parse(v)),
  );
  if (!anchors.length) return 0;
  const hours = Math.min(
    ...anchors.map((v) => Math.abs(Date.parse(v) - Date.parse(time)) / 3600000),
  );
  return hours <= 1
    ? SCORE_WEIGHTS.sunriseSunset
    : hours <= 2
      ? 8
      : hours <= 3
        ? 4
        : 0;
}
function evaluate(
  hour: WeatherHour,
  pressure: PressureTrend,
  day: Pick<WeatherDay, "sunrise" | "sunset"> | undefined,
  history: WeatherHour[],
  currentPrecipitation?: number | null,
): ScoreResult {
  const w = SCORE_WEIGHTS,
    reasons: ScoreResult["reasons"] = [],
    unavailable = [
      "Water temperature unavailable",
      "Solunar information unavailable",
    ];
  const add = (text: string, impact: number) => reasons.push({ text, impact });
  if (pressure.label === "Unavailable")
    unavailable.push("Pressure history unavailable");
  else
    add(
      `${pressure.label} pressure`,
      pressure.label === "Falling"
        ? w.falling
        : pressure.label === "Rapidly Falling"
          ? w.rapidlyFalling
          : pressure.label === "Stable"
            ? w.stable
            : pressure.label === "Rising"
              ? w.rising
              : w.rapidlyRising,
    );
  const wind = hour.windMph;
  if (wind === null) unavailable.push("Wind unavailable");
  else
    add(
      `${wind.toFixed(0)} mph wind`,
      wind >= 4 && wind <= 12
        ? w.moderateWind
        : wind > 20
          ? w.strongWind
          : wind > 12
            ? w.breeze
            : w.calm,
    );
  const clouds = hour.cloudCover;
  if (clouds === null) unavailable.push("Cloud cover unavailable");
  else
    add(
      `${clouds.toFixed(0)}% cloud cover`,
      clouds >= 45 && clouds <= 90
        ? w.partialCloud
        : clouds > 90
          ? w.heavyCloud
          : w.clear,
    );
  const light = timeProximityScore(hour.time, day?.sunrise, day?.sunset);
  if (day?.sunrise && day.sunset)
    add(
      light
        ? "Near a low-light feeding window"
        : "Away from sunrise and sunset",
      light,
    );
  else unavailable.push("Sunrise and sunset unavailable");
  if (currentPrecipitation !== undefined) {
    if (currentPrecipitation === null)
      unavailable.push("Precipitation unavailable");
    else
      add(
        currentPrecipitation > 0
          ? "Precipitation present"
          : "No current precipitation",
        currentPrecipitation > 0 ? w.lightRain : 0,
      );
  } else if (hour.precipitationChance === null)
    unavailable.push("Rain probability unavailable");
  else
    add(
      `${hour.precipitationChance.toFixed(0)}% rain chance`,
      hour.precipitationChance >= 20 && hour.precipitationChance <= 65
        ? 5
        : hour.precipitationChance > 80
          ? -3
          : 0,
    );
  if (hour.temperature === null)
    unavailable.push("Air temperature unavailable");
  else
    add(
      "Air temperature (water temperature unknown)",
      hour.temperature >= 55 && hour.temperature <= 85
        ? w.mildTemperature
        : hour.temperature < 35 || hour.temperature > 95
          ? w.extremeTemperature
          : 0,
    );
  const previous = history.find(
    (h) =>
      Math.abs(Date.parse(h.time) - (Date.parse(hour.time) - 6 * 3600000)) <=
      20 * 60000,
  );
  if (previous?.temperature != null && hour.temperature !== null) {
    const swing = Math.abs(hour.temperature - previous.temperature);
    add(
      swing > 12 ? "Recent temperature swing" : "Stable recent air temperature",
      swing > 12 ? w.recentTemperatureSwing : 0,
    );
  } else unavailable.push("Recent temperature history unavailable");
  const base = currentPrecipitation === undefined ? w.hourlyBase : w.base;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(base + reasons.reduce((sum, r) => sum + r.impact, 0)),
    ),
  );
  return {
    score,
    label: scoreLabel(score),
    reasons: reasons.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    unavailable,
    pressure,
  };
}
export function calculateFishingScore(weather: WeatherSnapshot): ScoreResult {
  return evaluate(
    {
      ...weather.current,
      precipitationChance: weather.current.precipitationChance,
    },
    analyzePressure(weather),
    { sunrise: weather.sunrise, sunset: weather.sunset },
    weather.hourly,
    weather.current.precipitation,
  );
}
export function calculateHourlyScore(
  hour: WeatherHour,
  hours: WeatherHour[],
  day?: WeatherDay,
): ScoreResult {
  return evaluate(
    hour,
    pressureAt(hours, hour.time, hour.pressureHpa),
    day,
    hours,
  );
}
// Kept for existing consumers; new forecasts use calculateHourlyScore for explanations and daylight.
export function hourlyFishingScore(hour: WeatherHour, pressureDelta: number) {
  let score = 46;
  if (Number.isFinite(pressureDelta))
    score += pressureDelta < -0.25 ? 12 : pressureDelta > 1 ? -5 : 5;
  if (hour.windMph !== null)
    score +=
      hour.windMph >= 4 && hour.windMph <= 12
        ? 10
        : hour.windMph > 20
          ? -10
          : 0;
  if (
    hour.cloudCover !== null &&
    hour.cloudCover >= 45 &&
    hour.cloudCover <= 90
  )
    score += 9;
  if (
    hour.precipitationChance !== null &&
    hour.precipitationChance >= 20 &&
    hour.precipitationChance <= 65
  )
    score += 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}
