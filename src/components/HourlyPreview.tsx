import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import type { ScoredHour } from "../engine/forecast";
import { formatClock, formatNumber } from "../utils/format";
import { scoreTone } from "../utils/presentation";
import WeatherIcon from "./WeatherIcon";
export default function HourlyPreview({
  hours,
  timezone,
  onForecast,
}: {
  hours: ScoredHour[];
  timezone: string;
  onForecast: () => void;
}) {
  const best = hours.length ? Math.max(...hours.map((h) => h.score)) : null;
  return (
    <section className="card hourly-card">
      <div className="section-head">
        <div>
          <span className="kicker">TIMING IS EVERYTHING</span>
          <h3>The next few casts.</h3>
        </div>
        <button className="text-button" onClick={onForecast}>
          Forecast
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="hour-strip">
        {hours.map((hour, i) => (
          <button
            className={`hour tone-${scoreTone(hour.score)} ${hour.score === best ? "peak-hour" : ""}`}
            key={hour.time}
            onClick={onForecast}
            aria-label={`${formatClock(hour.time, timezone)}, fishing score ${hour.score}. Open forecast.`}
          >
            <span>
              {i === 0 ? "Next" : formatClock(hour.time, timezone, true)}
            </span>
            <WeatherIcon code={hour.weatherCode} size={22} />
            <strong className="mini-score">{hour.score}</strong>
            <small>{formatNumber(hour.temperature, 0, "°")}</small>
            {hour.score === best && <i className="peak-dot" />}
          </button>
        ))}
      </div>
      <p className="hourly-caption">
        <ChartNoAxesCombined size={12} />
        Hourly fishing scores · next {hours.length} hours
      </p>
    </section>
  );
}
