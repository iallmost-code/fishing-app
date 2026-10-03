import type {
  WeatherSnapshot,
  WeatherDay,
  WeatherHour,
} from "../services/weather";
import {
  calculateHourlyScore,
  scoreLabel,
  type ScoreResult,
} from "./fishingScore";
import { getFishingWindows } from "./fishingWindows";
import { dateKey } from "../utils/format";
export type ScoredHour = WeatherHour & { result: ScoreResult; score: number };
export function scoreForecast(weather: WeatherSnapshot): ScoredHour[] {
  return weather.hourly.map((hour) => {
    const result = calculateHourlyScore(
      hour,
      weather.hourly,
      weather.daily.find(
        (d) => d.date === dateKey(hour.time, weather.timezone),
      ),
    );
    return { ...hour, result, score: result.score };
  });
}
export function dailyOutlook(
  day: WeatherDay,
  hours: ScoredHour[],
  timezone: string,
) {
  const dayHours = hours.filter((h) => dateKey(h.time, timezone) === day.date);
  const score = dayHours.length
    ? Math.round(
        dayHours.reduce((sum, h) => sum + h.score, 0) / dayHours.length,
      )
    : null;
  return {
    ...day,
    hours: dayHours,
    score,
    label: score !== null ? scoreLabel(score) : "Unavailable",
    windows: getFishingWindows(dayHours),
  };
}
