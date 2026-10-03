import { useState } from "react";
import { Wind, CloudRain, Sunrise, Sunset, ChevronDown } from "lucide-react";
import type { WeatherSnapshot } from "../services/weather";
import { hpaToInHg, degreesToCompass } from "../services/weather";
import { dailyOutlook, scoreForecast } from "../engine/forecast";
import { getFishingWindows } from "../engine/fishingWindows";
import {
  dateKey,
  formatClock,
  formatNumber,
  weatherDescription,
} from "../utils/format";
import WeatherIcon from "../components/WeatherIcon";
import { band } from "./TodayPage";

const weekday = (value: string, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(
    new Date(value),
  );

export default function ForecastPage({
  weather,
}: {
  weather: WeatherSnapshot;
}) {
  const tz = weather.timezone,
    today = dateKey(weather.current.time, tz),
    [selectedDay, setSelectedDay] = useState(today),
    [openHour, setOpenHour] = useState<string | null>(null);
  const scored = scoreForecast(weather),
    outlook = weather.daily
      .filter((d) => d.date >= today)
      .slice(0, 7)
      .map((d) => dailyOutlook(d, scored, tz));
  const date = outlook.some((d) => d.date === selectedDay)
      ? selectedDay
      : today,
    day = outlook.find((d) => d.date === date);
  const nowHour =
    Math.floor(Date.parse(weather.current.time) / 3600000) * 3600000;
  const hours = scored.filter(
    (h) =>
      dateKey(h.time, tz) === date &&
      (date !== today || Date.parse(h.time) >= nowHour),
  );
  // Same rule as Today: only hours still ahead count toward today's window.
  const now = Date.parse(weather.current.time),
    best = getFishingWindows(
      hours.filter((h) => date !== today || Date.parse(h.time) >= now),
    )[0];
  return (
    <div className="content">
      <div className="day-chips" role="tablist" aria-label="Day">
        {outlook.map((d) => (
          <button
            key={d.date}
            role="tab"
            aria-selected={d.date === date}
            className={d.date === date ? "selected" : ""}
            onClick={() => {
              setSelectedDay(d.date);
              setOpenHour(null);
            }}
          >
            <span>{d.date === today ? "Today" : weekday(d.time, tz)}</span>
            <WeatherIcon code={d.weatherCode} size={20} />
            <b className={`mini-score ${band(d.score ?? 0)}`}>
              {d.score ?? "—"}
            </b>
          </button>
        ))}
      </div>

      {day && (
        <section className="card day-summary">
          <div className="day-top">
            <WeatherIcon code={day.weatherCode} size={34} />
            <div>
              <strong>{weatherDescription(day.weatherCode)}</strong>
              <span>
                {formatNumber(day.high, 0, "°")} /{" "}
                {formatNumber(day.low, 0, "°")}
              </span>
            </div>
          </div>
          <p className="best-line">
            Best bite{" "}
            <b>
              {best
                ? `${formatClock(best.start, tz)} – ${formatClock(best.end, tz)}`
                : "no strong window"}
            </b>
          </p>
          <div className="mini-stats">
            <span>
              <Wind size={15} />
              {formatNumber(day.windMph, 0, " mph")}
            </span>
            <span>
              <CloudRain size={15} />
              {formatNumber(day.precipitationChance, 0, "%")}
            </span>
            <span>
              <Sunrise size={15} />
              {formatClock(day.sunrise, tz)}
            </span>
            <span>
              <Sunset size={15} />
              {formatClock(day.sunset, tz)}
            </span>
          </div>
        </section>
      )}

      <section className="card hour-list">
        {hours.map((h) => {
          const open = openHour === h.time,
            best = h.result.reasons.filter((r) => r.impact !== 0);
          return (
            <div className={`hour-row ${open ? "open" : ""}`} key={h.time}>
              <button
                onClick={() => setOpenHour(open ? null : h.time)}
                aria-expanded={open}
              >
                <span className="t">{formatClock(h.time, tz, true)}</span>
                <b className={`mini-score ${band(h.score)}`}>{h.score}</b>
                <WeatherIcon code={h.weatherCode} size={20} />
                <span className="temp">
                  {formatNumber(h.temperature, 0, "°")}
                </span>
                <span className="wind">
                  {h.windMph === null
                    ? "—"
                    : `${formatNumber(h.windMph, 0)} ${degreesToCompass(h.windDirection)}`}
                </span>
                <ChevronDown size={16} className={open ? "flip" : ""} />
              </button>
              {open && (
                <div className="hour-detail">
                  <p>
                    Pressure{" "}
                    {h.pressureHpa === null
                      ? "—"
                      : formatNumber(hpaToInHg(h.pressureHpa), 2, " inHg")}{" "}
                    · {h.result.pressure.label} · Clouds{" "}
                    {formatNumber(h.cloudCover, 0, "%")} · Rain{" "}
                    {formatNumber(h.precipitationChance, 0, "%")}
                  </p>
                  {best.map((r) => (
                    <div className="reason" key={r.text}>
                      <span>{r.text}</span>
                      <strong
                        className={r.impact >= 0 ? "positive" : "negative"}
                      >
                        {r.impact >= 0 ? "+" : ""}
                        {r.impact}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!hours.length && <p className="muted">No hourly data for this day.</p>}
      </section>
    </div>
  );
}
