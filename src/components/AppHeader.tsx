import {
  MapPin,
  LocateFixed,
  RefreshCw,
  ChevronDown,
  X,
  Fish,
} from "lucide-react";
import type { AppTab } from "./Navigation";
import type { FishingConditions } from "../hooks/useFishingConditions";
import { formatClock, formatNumber, weatherDescription } from "../utils/format";
import WeatherIcon from "./WeatherIcon";
export default function AppHeader({
  tab,
  conditions,
  showLocation,
  onLocation,
}: {
  tab: AppTab;
  conditions: FishingConditions;
  showLocation: boolean;
  onLocation: () => void;
}) {
  const { location, weather, loading, error, offline, locationStatus } =
    conditions;
  const locating = locationStatus === "locating";
  const gpsLine = locating
    ? "Finding you…"
    : location.source === "spot"
      ? "Fishing spot"
      : location.source === "manual"
        ? "Selected location"
        : locationStatus === "denied"
          ? "Location off · tap to fix"
          : location.source === "gps"
            ? `GPS${location.accuracy ? ` · ±${Math.round(location.accuracy * 3.281)} ft` : ""}`
            : "Monroe fallback";
  return (
    <header
      className={`app-header ${tab === "Today" ? "home-header" : "compact-header"}`}
    >
      <div className="brand-row">
        <a
          className="brand-lockup"
          href="#Today"
          aria-label="WTF — Where's the Fish today"
        >
          <img src="./brand/wtf-original.jpg" alt="WTF — where’s the fish" />
          <span className="brand-wordmark">
            <strong>
              WTF<span>.</span>
            </strong>
            <small>where’s the fish</small>
          </span>
        </a>
        {weather ? (
          <div className="header-weather">
            <WeatherIcon code={weather.current.weatherCode} size={28} />
            <div>
              <strong>
                {weather.current.temperature === null
                  ? "N/A"
                  : formatNumber(weather.current.temperature, 0, "°")}
              </strong>
              <span>{weatherDescription(weather.current.weatherCode)}</span>
            </div>
          </div>
        ) : (
          <span className="brand-promise">
            <Fish size={17} />
            MAKE IT A FISHING DAY
          </span>
        )}
      </div>
      <div className="bass-hero">
        <img
          className="bass-art"
          src="./brand/bass-hero.webp"
          alt="Largemouth bass leaping from sunlit turquoise water"
          fetchPriority="high"
        />
        <div className="bass-shade" />
        {tab === "Today" ? (
          <div className="bass-home-copy">
            <span>The water is calling</span>
            <h2>Chase the bite.</h2>
          </div>
        ) : (
          <div className="bass-tab-label">
            <Fish size={14} />
            {tab.toUpperCase()}
          </div>
        )}
      </div>
      <div className="location-bar">
        <button
          className="location-heading"
          onClick={onLocation}
          aria-expanded={showLocation}
        >
          <span className="location-pin">
            <MapPin size={16} />
          </span>
          <span>
            <strong>{location.name}</strong>
            <small>
              {gpsLine}
              {weather
                ? ` · ${formatClock(weather.current.time, weather.timezone)}`
                : ""}
            </small>
          </span>
          <ChevronDown size={14} />
        </button>
        <button
          className="header-action"
          onClick={() =>
            void (location.source === "gps"
              ? conditions.useGPS()
              : conditions.refresh())
          }
          disabled={loading || locating}
          aria-label="Refresh weather"
        >
          <RefreshCw size={18} className={loading || locating ? "spin" : ""} />
        </button>
        <button
          className="header-action locate-action"
          onClick={onLocation}
          aria-label="Choose location"
          aria-expanded={showLocation}
        >
          {showLocation ? <X size={18} /> : <LocateFixed size={18} />}
        </button>
      </div>
      <div className="header-status">
        {offline && (
          <div className="notice" role="status">
            You're offline.{" "}
            {weather
              ? "Previously loaded weather is shown below."
              : "Live weather needs a connection."}
          </div>
        )}
        {loading && (
          <div className="status" role="status">
            <RefreshCw className="spin" size={15} />
            Checking the water…
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
            {weather ? " Previous weather remains visible." : ""}
            <button onClick={() => void conditions.refresh()}>Retry</button>
          </div>
        )}
      </div>
    </header>
  );
}
