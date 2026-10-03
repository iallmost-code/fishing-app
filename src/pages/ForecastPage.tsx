import { useState } from "react";
import { Wind, CloudRain, Sunrise, Sunset, ChevronDown } from "lucide-react";
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
  const scored = scoreForecast(weather),
    outlook = weather.daily
      .filter((d) => d.date >= today)
      .slice(0, 7)
      .map((d) => dailyOutlook(d, scored, weather.timezone));
  const date = outlook.some((d) => d.date === selectedDay)
      ? selectedDay
      : today,
    selected = outlook.find((d) => d.date === date);
  const hours = scored.filter(
      (h) => dateKey(h.time, weather.timezone) === date,
    ),
    picked = hours.find((h) => h.time === selectedHour);
  function choose(date: string) {
    setSelectedDay(date);
    setSelectedHour(null);
    document
      .getElementById("hourly-forecast")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                <span className="daily-score">
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
        <div className="table-scroll">
          <table className="forecast-table">
            <caption className="sr-only">
              Hourly fishing forecast for {date}. Select a time to see score
              contributors.
            </caption>
            <thead>
              <tr>
                <th scope="col">Time / score</th>
                <th scope="col">Temp</th>
                <th scope="col">Pressure</th>
                <th scope="col">Trend</th>
                <th scope="col">Wind</th>
                <th scope="col">Cloud</th>
                <th scope="col">Rain</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr
                  key={h.time}
                  className={picked?.time === h.time ? "selected" : ""}
                >
                  <th scope="row">
                    <button
                      onClick={() => setSelectedHour(h.time)}
                      aria-label={`Explain score at ${formatClock(h.time, weather.timezone)}`}
                    >
                      <span>{formatClock(h.time, weather.timezone, true)}</span>
                      <b className="score-pill">{h.score}</b>
                    </button>
                  </th>
                  <td>{formatNumber(h.temperature, 0, "°F")}</td>
                  <td>
                    {h.pressureHpa === null
                      ? "Unavailable"
                      : formatNumber(hpaToInHg(h.pressureHpa), 2, " inHg")}
                  </td>
                  <td>{h.result.pressure.label}</td>
                  <td>
                    {h.windMph === null
                      ? "Unavailable"
                      : `${formatNumber(h.windMph, 0, " mph")} ${degreesToCompass(h.windDirection)}`}
                  </td>
                  <td>{formatNumber(h.cloudCover, 0, "%")}</td>
                  <td>{formatNumber(h.precipitationChance, 0, "%")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!hours.length && <p>No hourly readings are available for this day.</p>}
        <p className="fine-print">
          {hours.length} available hourly readings for this day. Earlier hours
          may be outside the requested history. Scroll horizontally for all
          conditions. Select a time to see why it scored that way.
        </p>
      </section>
      {picked && <ScoreReasons result={picked.result} />}
    </div>
  );
}
