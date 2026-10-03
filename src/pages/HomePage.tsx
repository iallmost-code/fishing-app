import {
  Gauge,
  Wind,
  Cloud,
  Sunrise,
  Sunset,
  CloudRain,
  Thermometer,
  ArrowRight,
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
import PressureChart from "../components/PressureChart";
import FishingWindows from "../components/FishingWindows";
import ScoreReasons from "../components/ScoreReasons";
import WeatherIcon from "../components/WeatherIcon";
export default function HomePage({
  weather,
  onForecast,
}: {
  weather: WeatherSnapshot;
  onForecast: () => void;
}) {
  const score = calculateFishingScore(weather),
    lures = getLureRecommendations(weather, score.pressure),
    allHours = scoreForecast(weather);
  const today = dateKey(weather.current.time, weather.timezone),
    now = Date.parse(weather.current.time);
  const remaining = allHours.filter(
    (h) =>
      dateKey(h.time, weather.timezone) === today && Date.parse(h.time) >= now,
  );
  const windows = getFishingWindows(remaining),
    upcoming = allHours
      .filter((h) => Date.parse(h.time) >= Math.floor(now / 3600000) * 3600000)
      .slice(0, 8);
  const c = weather.current,
    pressure = (v: number | null) =>
      v === null ? "Unavailable" : formatNumber(hpaToInHg(v), 2, " inHg");
  const change = (v: number | null) =>
    v === null
      ? "Unavailable"
      : `${v >= 0 ? "+" : ""}${hpaToInHg(v).toFixed(3)} inHg`;
  return (
    <>
      <section className="score-panel">
        <div
          className="score-ring"
          style={
            { "--score": `${score.score * 3.6}deg` } as React.CSSProperties
          }
        >
          <div className="score-core">
            <strong>{score.score}</strong>
            <span>{score.label}</span>
          </div>
        </div>
        <div className="score-copy">
          <span className="eyebrow">YOUR FISHING SCORE</span>
          <h2>
            {score.score >= 70
              ? "Good time to fish"
              : score.score >= 50
                ? "Worth a shot"
                : "Tougher bite"}
          </h2>
          <p>
            {score.reasons
              .filter((r) => r.impact !== 0)
              .slice(0, 2)
              .map((r) => r.text)
              .join(" · ") || "Limited conditions available"}
          </p>
          <div className="current-weather">
            <WeatherIcon code={c.weatherCode} size={29} />
            <strong>{formatNumber(c.temperature, 0, "°F")}</strong>
            <span>{weatherDescription(c.weatherCode)}</span>
          </div>
        </div>
      </section>
      <div className="content">
        <section className="bite-summary">
          <div>
            <span>BEST BITE</span>
            <strong>
              {windows[0]
                ? `${formatClock(windows[0].start, weather.timezone)} – ${formatClock(windows[0].end, weather.timezone)}`
                : "No strong window yet"}
            </strong>
          </div>
          <div>
            <span>TOP PICK</span>
            <strong>{lures[0]?.name ?? "Unavailable"}</strong>
            <small>{lures[0]?.color}</small>
          </div>
          <div>
            <span>PRESSURE</span>
            <strong>{score.pressure.label}</strong>
            <small>{pressure(c.pressureHpa)}</small>
          </div>
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <span className="kicker">RIGHT NOW</span>
              <h3>Read the conditions</h3>
            </div>
            <WeatherIcon code={c.weatherCode} />
          </div>
          <div className="conditions-grid">
            {[
              {
                Icon: Gauge,
                label: "Pressure",
                value: pressure(c.pressureHpa),
              },
              {
                Icon: Wind,
                label: "Wind",
                value:
                  c.windMph === null
                    ? "Unavailable"
                    : `${formatNumber(c.windMph, 0, " mph")} ${degreesToCompass(c.windDirection)}`,
              },
              {
                Icon: Cloud,
                label: "Cloud cover",
                value: formatNumber(c.cloudCover, 0, "%"),
              },
              {
                Icon: Thermometer,
                label: "Temperature",
                value: formatNumber(c.temperature, 0, "°F"),
              },
              {
                Icon: CloudRain,
                label: "Rain chance",
                value: formatNumber(c.precipitationChance, 0, "%"),
              },
              {
                Icon: Sunrise,
                label: "Sunrise",
                value: formatClock(weather.sunrise, weather.timezone),
              },
              {
                Icon: Sunset,
                label: "Sunset",
                value: formatClock(weather.sunset, weather.timezone),
              },
            ].map((m) => (
              <div className="condition" key={m.label}>
                <m.Icon size={21} />
                <div>
                  <small>{m.label}</small>
                  <strong>{m.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <span className="kicker">BEST TIME TO CAST</span>
              <h3>Today's bite windows</h3>
            </div>
          </div>
          <FishingWindows windows={windows} timezone={weather.timezone} />
        </section>
        <PressureChart weather={weather} />
        <section className="card">
          <div className="section-head">
            <div>
              <span className="kicker">CHANGE FROM NOW</span>
              <h3>Pressure movement</h3>
            </div>
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
        <section className="card">
          <div className="section-head">
            <div>
              <span className="kicker">NEXT 8 HOURS</span>
              <h3>Fishing forecast</h3>
            </div>
            <button className="text-button" onClick={onForecast}>
              Full forecast
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="hour-strip">
            {upcoming.map((hour) => (
              <button className="hour" key={hour.time} onClick={onForecast}>
                <span>{formatClock(hour.time, weather.timezone, true)}</span>
                <WeatherIcon code={hour.weatherCode} size={19} />
                <div className="mini-score">{hour.score}</div>
                <small>{formatNumber(hour.temperature, 0, "°")}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <span className="kicker">BASED ON CONDITIONS · BASS</span>
              <h3>What to throw</h3>
            </div>
          </div>
          <div className="lure-list">
            {lures.map((lure, i) => (
              <article className="lure" key={lure.name}>
                <div className="rank">#{i + 1}</div>
                <div>
                  <h4>{lure.name}</h4>
                  <p>
                    <b>{lure.color}</b> · {lure.retrieve}
                  </p>
                  <p>{lure.target}</p>
                  <small>{lure.reason}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
        <ScoreReasons result={score} />
      </div>
    </>
  );
}
