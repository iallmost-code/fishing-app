import { useState } from "react";
import {
  Wind,
  CloudRain,
  Sunrise,
  Sunset,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import type { WeatherSnapshot } from "../services/weather";
import { hpaToInHg, degreesToCompass } from "../services/weather";
import { dailyOutlook, scoreForecast } from "../engine/forecast";
import { getFishingWindows } from "../engine/fishingWindows";
import {
  dateKey,
  formatClock,
  formatDay,
  formatNumber,
  weatherDescription,
} from "../utils/format";
import WeatherIcon from "../components/WeatherIcon";
import { scoreTone } from "../utils/presentation";
import { scrollToSection } from "../utils/scroll";
import FishingWindows from "../components/FishingWindows";
import ScoreReasons from "../components/ScoreReasons";
export default function ForecastPage({
  weather,
}: {
  weather: WeatherSnapshot;
}) {
  const today = dateKey(weather.current.time, weather.timezone),
    [selectedDay, setSelectedDay] = useState(today),
    [selectedHour, setSelectedHour] = useState<string | null>(null);
  const now = Date.parse(weather.current.time),
    nowHour = Math.floor(now / 3600000) * 3600000;
  const scored = scoreForecast(weather),
    outlook = weather.daily
      .filter((d) => d.date >= today)
      .slice(0, 7)
      .map((d) => {
        const day = dailyOutlook(d, scored, weather.timezone);
        return d.date === today
          ? {
              ...day,
              windows: getFishingWindows(
                scored.filter(
                  (h) =>
                    dateKey(h.time, weather.timezone) === today &&
                    Date.parse(h.time) >= now,
                ),
              ),
            }
          : day;
      });
  const date = outlook.some((d) => d.date === selectedDay)
      ? selectedDay
      : today,
    selected = outlook.find((d) => d.date === date);
  const hours = scored.filter(
      (h) =>
        dateKey(h.time, weather.timezone) === date &&
        (date !== today || Date.parse(h.time) >= nowHour),
    ),
    picked = hours.find((h) => h.time === selectedHour);
  function choose(date: string) {
    setSelectedDay(date);
    setSelectedHour(null);
    scrollToSection("hourly-forecast");
  }
  return (
    <div className="content">
      <section className="card">
        <div className="section-head">
          <div>
            <span className="kicker">PLAN AHEAD</span>
            <h3>7-day fishing outlook</h3>
          </div>
          <span className="forecast-zone">{weather.timezone}</span>
        </div>
        <p className="fine-print">
          Daily score = average of available hourly scores. Tap a day for its
          full breakdown.
        </p>
        <div className="daily-grid">
          {outlook.map((day) => (
            <button
              className={`day-card ${date === day.date ? "selected" : ""}`}
              key={day.date}
              onClick={() => choose(day.date)}
              aria-pressed={date === day.date}
            >
              <div className="day-title">
                <strong>
                  {day.date === today
                    ? "Today"
                    : formatDay(day.time, weather.timezone)}
                </strong>
                <span
                  className={`daily-score tone-${scoreTone(day.score ?? 0)}`}
                >
                  {day.score ?? "—"}
                  <small>{day.label}</small>
                </span>
              </div>
              <div className="day-weather">
                <WeatherIcon code={day.weatherCode} />
                <span>{weatherDescription(day.weatherCode)}</span>
                <b>
                  {formatNumber(day.high, 0, "°")} /{" "}
                  {formatNumber(day.low, 0, "°")}
                </b>
              </div>
              <div className="day-stats">
                <span>
                  <Wind size={14} />
                  {formatNumber(day.windMph, 0, " mph max")}
                </span>
                <span>
                  <CloudRain size={14} />
                  {formatNumber(day.precipitationChance, 0, "% max")}
                </span>
                <span>
                  <Sunrise size={14} />
                  {formatClock(day.sunrise, weather.timezone)}
                </span>
                <span>
                  <Sunset size={14} />
                  {formatClock(day.sunset, weather.timezone)}
                </span>
              </div>
              <div className="daily-window">
                <span>BEST WINDOW</span>
                <b>
                  {day.windows[0]
                    ? `${formatClock(day.windows[0].start, weather.timezone)} – ${formatClock(day.windows[0].end, weather.timezone)}`
                    : "No strong continuous window"}
                </b>
              </div>
              <span className="day-action">
                View hourly conditions
                <ChevronDown size={14} />
              </span>
            </button>
          ))}
        </div>
        {!outlook.length && (
          <p>
            Daily outlook unavailable. Available hourly data is shown below.
          </p>
        )}
      </section>
      <section className="card" id="hourly-forecast">
        <div className="section-head">
          <div>
            <span className="kicker">EVERY HOUR EXPLAINED</span>
            <h3>
              {date === today
                ? "Today"
                : selected
                  ? formatDay(selected.time, weather.timezone)
                  : date}{" "}
              · Hourly forecast
            </h3>
          </div>
        </div>
        <FishingWindows
          windows={getFishingWindows(
            hours.filter(
              (h) =>
                date !== today ||
                Date.parse(h.time) >= Date.parse(weather.current.time),
            ),
          )}
          timezone={weather.timezone}
        />
        <div className="forecast-hours">
          {hours.map((h) => (
            <details className="forecast-hour" key={h.time}>
              <summary>
                <span className="forecast-hour-icon">
                  <WeatherIcon code={h.weatherCode} size={23} />
                </span>
                <span className="forecast-hour-time">
                  <strong>{formatClock(h.time, weather.timezone, true)}</strong>
                  <small>{h.result.label}</small>
                </span>
                <span className="forecast-hour-temp">
                  {formatNumber(h.temperature, 0, "°")}
                </span>
                <span className={`score-pill tone-${scoreTone(h.score)}`}>
                  {h.score}
                </span>
                <ChevronDown size={15} />
              </summary>
              <div className="forecast-hour-details">
                <div className="hour-metrics">
                  <div>
                    <small>PRESSURE</small>
                    <strong>
                      {h.pressureHpa === null
                        ? "Unavailable"
                        : formatNumber(hpaToInHg(h.pressureHpa), 2, " inHg")}
                    </strong>
                  </div>
                  <div>
                    <small>TREND</small>
                    <strong>{h.result.pressure.label}</strong>
                  </div>
                  <div>
                    <small>WIND</small>
                    <strong>
                      {h.windMph === null
                        ? "Unavailable"
                        : `${formatNumber(h.windMph, 0, " mph")} ${degreesToCompass(h.windDirection)}`}
                    </strong>
                  </div>
                  <div>
                    <small>CLOUD COVER</small>
                    <strong>{formatNumber(h.cloudCover, 0, "%")}</strong>
                  </div>
                  <div>
                    <small>RAIN CHANCE</small>
                    <strong>
                      {formatNumber(h.precipitationChance, 0, "%")}
                    </strong>
                  </div>
                  <div>
                    <small>CONDITIONS</small>
                    <strong>{weatherDescription(h.weatherCode)}</strong>
                  </div>
                </div>
                <button
                  className="hour-explain-button"
                  onClick={() =>
                    setSelectedHour(selectedHour === h.time ? null : h.time)
                  }
                  aria-label={`Explain score at ${formatClock(h.time, weather.timezone)}`}
                  aria-expanded={picked?.time === h.time}
                >
                  Why this score?
                  <ArrowUpRight size={16} />
                </button>
                {picked?.time === h.time && (
                  <ScoreReasons result={picked.result} />
                )}
              </div>
            </details>
          ))}
        </div>
        {!hours.length && <p>No hourly readings are available for this day.</p>}
        <p className="fine-print">
          {hours.length} available hourly readings for this day. Today shows the
          hours still ahead. Tap an hour to explore its conditions and score.
        </p>
      </section>
    </div>
  );
}
