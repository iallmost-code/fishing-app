import { useEffect, useState } from "react";
import { Navigation2, Crosshair } from "lucide-react";
import type { WaterLocation } from "../models/waterLocation";
import { getWeather, type WeatherSnapshot } from "../services/weather";
import { calculateFishingScore } from "../engine/fishingScore";
import { scoreForecast } from "../engine/forecast";
import { getFishingWindows } from "../engine/fishingWindows";
import { lurePlan, type PlanWater } from "../engine/lurePlan";
import { dateKey, formatClock } from "../utils/format";
import Sheet from "./Sheet";
import ScoreRing from "./ScoreRing";
import { SpotIcon, spotSubtitle } from "./SpotRow";

function directionsUrl(spot: WaterLocation) {
  const dest = `${spot.latitude},${spot.longitude}`;
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    ? `https://maps.apple.com/?daddr=${dest}&q=${encodeURIComponent(spot.name)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

function waterFor(spot: WaterLocation): PlanWater | undefined {
  if (spot.type === "river") return "river";
  if (spot.type === "pond") return "pond";
  if (spot.type === "park")
    return spot.water?.includes("lake") ? "lake" : spot.water?.[0];
  return spot.type === "lake" || spot.type === "reservoir" ? "lake" : undefined;
}

export default function SpotSheet({
  spot,
  onClose,
  onFishHere,
}: {
  spot: WaterLocation;
  onClose: () => void;
  onFishHere: (spot: WaterLocation) => void;
}) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setWeather(null);
    setFailed(false);
    getWeather(spot.latitude, spot.longitude)
      .then((w) => live && setWeather(w))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [spot.id]);

  let summary = null;
  if (weather) {
    const score = calculateFishingScore(weather),
      tz = weather.timezone,
      now = Date.parse(weather.current.time),
      today = dateKey(weather.current.time, tz),
      best = getFishingWindows(
        scoreForecast(weather).filter(
          (h) => dateKey(h.time, tz) === today && Date.parse(h.time) >= now,
        ),
      )[0],
      lure = lurePlan(weather, scoreForecast(weather), waterFor(spot))[0];
    summary = (
      <div className="spot-score">
        <ScoreRing score={score.score} label={score.label} size={84} />
        <div>
          <p>
            Best bite{" "}
            <b>
              {best
                ? `${formatClock(best.start, tz)} – ${formatClock(best.end, tz)}`
                : "none left today"}
            </b>
          </p>
          {lure && (
            <p>
              Throw <b>{lure.name}</b> · {lure.color}
              <br />
              {lure.target}
            </p>
          )}
          <p className="muted">Pressure {score.pressure.label.toLowerCase()}</p>
        </div>
      </div>
    );
  }

  return (
    <Sheet
      title={
        <span className="sheet-title">
          <span className={`spot-icon ${spot.type}`}>
            <SpotIcon spot={spot} />
          </span>
          {spot.name}
        </span>
      }
      onClose={onClose}
    >
      <p className="muted">{spotSubtitle(spot)}</p>
      {spot.facts.length > 0 && (
        <p className="tags">
          {spot.facts.map((f) => (
            <i key={f}>{f}</i>
          ))}
        </p>
      )}
      {summary ??
        (failed ? (
          <p className="inline-error">Couldn't load conditions here.</p>
        ) : (
          <p className="muted">Checking conditions here…</p>
        ))}
      <div className="sheet-actions">
        <a
          className="primary-button"
          href={directionsUrl(spot)}
          target="_blank"
          rel="noreferrer"
        >
          <Navigation2 size={18} />
          Directions
        </a>
        <button className="secondary-button" onClick={() => onFishHere(spot)}>
          <Crosshair size={18} />
          Fish here
        </button>
      </div>
      <p className="credit">
        {spot.source === "alltrails"
          ? "Fishing info: AllTrails. Check park rules and Georgia fishing license requirements."
          : spot.source === "guide"
            ? "From the WTF spot list. Check posted rules and Georgia fishing license requirements."
            : "Map data © OpenStreetMap contributors. Being on the map doesn't mean public access."}
      </p>
    </Sheet>
  );
}
