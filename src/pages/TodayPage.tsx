import {
  ArrowUpRight,
  Clock3,
  Map,
  ChartNoAxesCombined,
  Gauge,
  Sunset,
} from "lucide-react";
import { calculateFishingScore } from "../engine/fishingScore";
import { scoreForecast } from "../engine/forecast";
import { getFishingWindows } from "../engine/fishingWindows";
import { getCurrentLurePicks } from "../engine/currentLures";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { hpaToInHg, type WeatherSnapshot } from "../services/weather";
import { dateKey, formatClock, formatNumber } from "../utils/format";
import type { WaterLocation } from "../models/waterLocation";
import type { NearbyWaterState } from "../hooks/useNearbyWater";
import SpotRow from "../components/SpotRow";
import PressureChart from "../components/PressureChart";
import FishingWindows from "../components/FishingWindows";
import ScoreReasons from "../components/ScoreReasons";
import BiteScoreCard from "../components/BiteScoreCard";
import ConditionsCard from "../components/ConditionsCard";
import LurePicks from "../components/LurePicks";
import HourlyPreview from "../components/HourlyPreview";
export default function TodayPage({
  weather,
  onForecast,
  onSpots,
  water,
  onOpenSpot,
  stale,
}: {
  weather: WeatherSnapshot;
  onForecast: () => void;
  onSpots: () => void;
  water: NearbyWaterState;
  onOpenSpot: (spot: WaterLocation) => void;
  stale: boolean;
}) {
  const currentTime = useCurrentTime();
  const score = calculateFishingScore(weather),
    allHours = scoreForecast(weather);
  const today = dateKey(weather.current.time, weather.timezone),
    now = Date.parse(weather.current.time);
  const remaining = allHours.filter(
      (h) =>
        dateKey(h.time, weather.timezone) === today &&
        Date.parse(h.time) >= now,
    ),
    windows = getFishingWindows(remaining);
  const upcoming = allHours
    .filter((h) => Date.parse(h.time) >= Math.floor(now / 3600000) * 3600000)
    .slice(0, 12);
  const change = (v: number | null) =>
    v === null
      ? "Unavailable"
      : `${v >= 0 ? "+" : ""}${hpaToInHg(v).toFixed(3)} inHg`;
  return (
    <div className="content home-content">
      <div className="today-heading">
        <span>Your day on the water</span>
        <span className={`data-pill ${stale ? "is-stale" : ""}`}>
          <i />
          {stale ? "PREVIOUS WEATHER" : "LIVE CONDITIONS"}
        </span>
      </div>
      <BiteScoreCard score={score} />
      <button className="best-bite-banner" onClick={onForecast}>
        <span className="best-bite-icon">
          <Sunset size={25} />
        </span>
        <span>
          <small>
            {windows[0] ? "YOUR BEST BITE WINDOW" : "MAKE EVERY HOUR COUNT"}
          </small>
          <strong>
            {windows[0]
              ? `${formatClock(windows[0].start, weather.timezone)} – ${formatClock(windows[0].end, weather.timezone)}`
              : "Find your best time to cast"}
          </strong>
          <span>
            {windows[0]
              ? `Average score ${windows[0].averageScore} · Time to make a plan`
              : "No strong continuous window. Explore today’s hours."}
          </span>
        </span>
        <ArrowUpRight size={20} />
      </button>
      <div className="quick-actions">
        <button className="action-forecast" onClick={onForecast}>
          <ChartNoAxesCombined size={21} />
          <span>Fishing forecast</span>
          <ArrowUpRight size={16} />
        </button>
        <button className="action-map" onClick={onSpots}>
          <Map size={21} />
          <span>Find fishing spots</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
      <HourlyPreview
        hours={upcoming}
        timezone={weather.timezone}
        onForecast={onForecast}
      />
      <LurePicks
        advice={getCurrentLurePicks(weather, currentTime)}
        conditionsTime={weather.current.time}
        stale={stale}
        timezone={weather.timezone}
      />
      <section className="card">
        <div className="section-head">
          <div>
            <span className="kicker">YOUR NEXT GREAT CAST</span>
            <h3>Spots near you.</h3>
          </div>
          <button className="text-button" onClick={onSpots}>
            Explore <ArrowUpRight size={16} />
          </button>
        </div>
        {water.loading && !water.spots.length ? (
          <p className="muted">Looking for water nearby…</p>
        ) : water.spots.length ? (
          <div className="spot-list">
            {water.spots.slice(0, 3).map((spot) => (
              <SpotRow
                key={spot.id}
                spot={spot}
                onClick={() => onOpenSpot(spot)}
              />
            ))}
          </div>
        ) : (
          <p className="muted">No mapped water found within range.</p>
        )}
      </section>
      <section className="card windows-card">
        <div className="section-head">
          <div>
            <span className="kicker">A LITTLE EDGE ON THE WATER</span>
            <h3>Your bite windows.</h3>
          </div>
          <span className="section-icon yellow">
            <Clock3 size={20} />
          </span>
        </div>
        <FishingWindows windows={windows} timezone={weather.timezone} />
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <span className="kicker">READ THE CHANGE</span>
            <h3>Pressure outlook.</h3>
          </div>
        </div>
        <PressureChart weather={weather} />
      </section>
      <section className="card pressure-movement">
        <div className="section-head">
          <div>
            <span className="kicker">FOLLOW THE CHANGE</span>
            <h3>Pressure movement.</h3>
          </div>
          <span className="section-icon blue">
            <Gauge size={20} />
          </span>
        </div>
        <div className="pressure-grid">
          {[
            { label: "1 hour", value: score.pressure.oneHour },
            { label: "3 hours", value: score.pressure.threeHour },
            { label: "6 hours", value: score.pressure.sixHour },
          ].map((d) => (
            <div key={d.label}>
              <small>{d.label}</small>
              <strong>{change(d.value)}</strong>
            </div>
          ))}
        </div>
        <p className="fine-print">
          Rate:{" "}
          {score.pressure.rate === null
            ? "Unavailable"
            : formatNumber(hpaToInHg(score.pressure.rate), 3, " inHg / hour")}
        </p>
      </section>
      <ConditionsCard weather={weather} />
      <section className="card" id="score-explanation">
        <div className="section-head">
          <div>
            <span className="kicker">EVERY SCORE EXPLAINED</span>
            <h3>Why this score.</h3>
          </div>
        </div>
        <ScoreReasons result={score} />
      </section>
      <div className="weather-freshness">
        <span>
          {stale ? "PREVIOUS WEATHER" : "LIVE WEATHER"} · Updated{" "}
          {formatClock(weather.fetchedAt, weather.timezone)}
        </span>
        <span>{weather.timezone} · Open-Meteo</span>
      </div>
    </div>
  );
}
