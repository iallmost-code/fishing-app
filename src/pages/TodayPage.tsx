import { useState } from "react";
import {
  Gauge,
  Wind,
  Sunrise,
  Sunset,
  ChevronRight,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  MoveRight,
} from "lucide-react";
import { calculateFishingScore } from "../engine/fishingScore";
import { scoreForecast } from "../engine/forecast";
import { getFishingWindows } from "../engine/fishingWindows";
import { getLureRecommendations } from "../engine/lureRecommendations";
import {
  hpaToInHg,
  degreesToCompass,
  type WeatherSnapshot,
} from "../services/weather";
import {
  dateKey,
  formatClock,
  formatNumber,
  weatherDescription,
} from "../utils/format";
import type { WaterLocation } from "../models/waterLocation";
import type { NearbyWaterState } from "../hooks/useNearbyWater";
import PressureChart from "../components/PressureChart";
import ScoreReasons from "../components/ScoreReasons";
import WeatherIcon from "../components/WeatherIcon";
import ScoreRing from "../components/ScoreRing";
import SpotRow from "../components/SpotRow";

export default function TodayPage({
  weather,
  water,
  onForecast,
  onSpots,
  onOpenSpot,
}: {
  weather: WeatherSnapshot;
  water: NearbyWaterState;
  onForecast: () => void;
  onSpots: () => void;
  onOpenSpot: (spot: WaterLocation) => void;
}) {
  const [morePicks, setMorePicks] = useState(false);
  const score = calculateFishingScore(weather),
    lures = getLureRecommendations(weather, score.pressure),
    allHours = scoreForecast(weather),
    tz = weather.timezone;
  const today = dateKey(weather.current.time, tz),
    now = Date.parse(weather.current.time);
  const windows = getFishingWindows(
    allHours.filter(
      (h) => dateKey(h.time, tz) === today && Date.parse(h.time) >= now,
    ),
  );
  const upcoming = allHours
    .filter((h) => Date.parse(h.time) >= Math.floor(now / 3600000) * 3600000)
    .slice(0, 12);
  const c = weather.current,
    best = windows[0],
    trend = score.pressure.label.toLowerCase();
  const TrendIcon = trend.includes("falling")
    ? TrendingDown
    : trend.includes("rising")
      ? TrendingUp
      : MoveRight;
  // Show whichever of sunrise/sunset is next.
  const sunsetNext = !weather.sunset || Date.parse(weather.sunset) > now;
  return (
    <div className="content">
      <section className="hero-card">
        <ScoreRing score={score.score} label={score.label} />
        <div className="hero-copy">
          <h1>
            {score.score >= 70
              ? "Good time to fish"
              : score.score >= 50
                ? "Worth a shot"
                : "Tough bite"}
          </h1>
          <p className="best-bite">
            {best ? (
              <>
                Best bite <b>{formatClock(best.start, tz)}</b> –{" "}
                <b>{formatClock(best.end, tz)}</b>
              </>
            ) : (
              "No strong window left today"
            )}
          </p>
          <p className="now-weather">
            <WeatherIcon code={c.weatherCode} size={18} />
            {formatNumber(c.temperature, 0, "°")} ·{" "}
            {weatherDescription(c.weatherCode)}
          </p>
        </div>
      </section>

      <section className="stat-row">
        <div className="stat">
          <Gauge size={18} />
          <small>Pressure</small>
          <strong>
            {score.pressure.label === "Unavailable" ? (
              "Trend n/a"
            ) : (
              <>
                <TrendIcon size={16} />
                {score.pressure.label}
              </>
            )}
          </strong>
          <span>
            {c.pressureHpa === null
              ? "—"
              : formatNumber(hpaToInHg(c.pressureHpa), 2, " inHg")}
          </span>
        </div>
        <div className="stat">
          <Wind size={18} />
          <small>Wind</small>
          <strong>{formatNumber(c.windMph, 0, " mph")}</strong>
          <span>
            {c.windMph === null ? "—" : degreesToCompass(c.windDirection)}
          </span>
        </div>
        <div className="stat">
          {sunsetNext ? <Sunset size={18} /> : <Sunrise size={18} />}
          <small>{sunsetNext ? "Sunset" : "Sunrise"}</small>
          <strong>
            {formatClock(sunsetNext ? weather.sunset : weather.sunrise, tz)}
          </strong>
          <span>Rain {formatNumber(c.precipitationChance, 0, "%")}</span>
        </div>
      </section>

      {lures[0] && (
        <section className="card">
          <span className="kicker">THROW THIS</span>
          <div className="lure top">
            <h2>{lures[0].name}</h2>
            <p>
              <b>{lures[0].color}</b> · {lures[0].retrieve}
            </p>
            <p className="muted">{lures[0].target}</p>
          </div>
          {morePicks &&
            lures.slice(1).map((lure) => (
              <div className="lure" key={lure.name}>
                <h3>{lure.name}</h3>
                <p>
                  <b>{lure.color}</b> · {lure.retrieve}
                </p>
                <p className="muted">{lure.target}</p>
              </div>
            ))}
          {lures.length > 1 && (
            <button
              className="text-button"
              onClick={() => setMorePicks(!morePicks)}
              aria-expanded={morePicks}
            >
              {morePicks ? "Fewer picks" : `${lures.length - 1} more picks`}
              <ChevronDown size={16} className={morePicks ? "flip" : ""} />
            </button>
          )}
        </section>
      )}

      <section className="card">
        <button className="card-head" onClick={onForecast}>
          <span className="kicker">NEXT 12 HOURS</span>
          <ChevronRight size={18} />
        </button>
        <div className="hour-strip">
          {upcoming.map((hour) => (
            <div className="hour" key={hour.time}>
              <span>{formatClock(hour.time, tz, true)}</span>
              <b className={`mini-score ${band(hour.score)}`}>{hour.score}</b>
              <WeatherIcon code={hour.weatherCode} size={18} />
              <small>{formatNumber(hour.temperature, 0, "°")}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <button className="card-head" onClick={onSpots}>
          <span className="kicker">SPOTS NEAR YOU</span>
          <ChevronRight size={18} />
        </button>
        {water.loading && !water.spots.length ? (
          <p className="muted">Looking for water nearby…</p>
        ) : water.spots.length ? (
          <div className="spot-list">
            {water.spots.slice(0, 3).map((s) => (
              <SpotRow key={s.id} spot={s} onClick={() => onOpenSpot(s)} />
            ))}
          </div>
        ) : (
          <p className="muted">No mapped water found within range.</p>
        )}
      </section>

      <details className="card more">
        <summary>Pressure graph</summary>
        <PressureChart weather={weather} />
      </details>
      <details className="card more">
        <summary>Why this score</summary>
        <ScoreReasons result={score} />
      </details>
      <p className="credit">
        Weather: Open-Meteo. Scores are guidance, not a guarantee.
      </p>
    </div>
  );
}

export function band(score: number) {
  return score >= 70 ? "good" : score >= 50 ? "fair" : "poor";
}
