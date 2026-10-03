import { lazy, Suspense, useState } from "react";
import {
  MapPin,
  RefreshCw,
  ChevronDown,
  LocateOff,
  Locate,
} from "lucide-react";
import { useFishingConditions } from "./hooks/useFishingConditions";
import { useNearbyWater } from "./hooks/useNearbyWater";
import Navigation, { type AppTab, TABS } from "./components/Navigation";
import LocationSheet from "./components/LocationSheet";
import SpotSheet from "./components/SpotSheet";
import type { WaterLocation } from "./models/waterLocation";
import TodayPage from "./pages/TodayPage";
import ForecastPage from "./pages/ForecastPage";
import ScreenErrorBoundary from "./components/ScreenErrorBoundary";
import { formatClock } from "./utils/format";
const SpotsPage = lazy(() => import("./pages/SpotsPage"));

function initialTab(): AppTab {
  const hash = window.location.hash.slice(1);
  return (TABS as readonly string[]).includes(hash)
    ? (hash as AppTab)
    : "Today";
}

export default function App() {
  const conditions = useFishingConditions(),
    [tab, setTab] = useState<AppTab>(initialTab),
    [showLocation, setShowLocation] = useState(false),
    [radius, setRadius] = useState(10),
    [openSpot, setOpenSpot] = useState<WaterLocation | null>(null);
  const { location, weather, loading, error, locationStatus } = conditions;
  const water = useNearbyWater(location, radius);
  function navigate(next: AppTab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0 });
  }
  const gpsLine =
    locationStatus === "locating"
      ? "Finding you…"
      : location.source === "gps"
        ? `GPS${location.accuracy ? ` · ±${Math.round(location.accuracy * 3.281)} ft` : ""}`
        : locationStatus === "denied"
          ? "Location off · tap to fix"
          : location.source === "spot"
            ? "Fishing spot"
            : location.source === "manual"
              ? "Searched town"
              : "Default spot · tap to use GPS";
  return (
    <div className="app-shell">
      <header className="top-bar">
        <button
          className="place-button"
          onClick={() => setShowLocation(true)}
          aria-label="Change location"
        >
          {locationStatus === "denied" ? (
            <LocateOff size={20} />
          ) : location.source === "gps" ? (
            <Locate size={20} />
          ) : (
            <MapPin size={20} />
          )}
          <span>
            <strong>
              {location.name}
              <ChevronDown size={16} />
            </strong>
            <small className={locationStatus === "denied" ? "warn" : ""}>
              {gpsLine}
              {weather && !loading
                ? ` · ${formatClock(weather.fetchedAt, weather.timezone)}`
                : ""}
            </small>
          </span>
        </button>
        <button
          className="icon-button"
          onClick={() =>
            location.source === "gps"
              ? void conditions.useGPS()
              : void conditions.refresh()
          }
          disabled={loading || locationStatus === "locating"}
          aria-label="Refresh"
        >
          <RefreshCw
            size={20}
            className={loading || locationStatus === "locating" ? "spin" : ""}
          />
        </button>
      </header>
      {conditions.offline && (
        <div className="banner" role="status">
          You're offline{weather ? " — showing the last weather." : "."}
        </div>
      )}
      {error && (
        <div className="banner error" role="alert">
          {error}
          <button onClick={() => void conditions.refresh()}>Retry</button>
        </div>
      )}
      <main className="screen">
        {tab === "Spots" ? (
          <ScreenErrorBoundary>
            <Suspense fallback={<div className="card">Loading map…</div>}>
              <SpotsPage
                conditions={conditions}
                water={water}
                radius={radius}
                onRadius={setRadius}
                onOpenSpot={setOpenSpot}
              />
            </Suspense>
          </ScreenErrorBoundary>
        ) : weather ? (
          tab === "Forecast" ? (
            <ForecastPage weather={weather} />
          ) : (
            <TodayPage
              weather={weather}
              water={water}
              onForecast={() => navigate("Forecast")}
              onSpots={() => navigate("Spots")}
              onOpenSpot={setOpenSpot}
            />
          )
        ) : loading ? (
          <div className="skeleton" aria-label="Loading conditions">
            <div />
            <div />
            <div />
          </div>
        ) : (
          <section className="card empty">
            <h2>No weather yet</h2>
            <p>Check your connection, or pick a different spot.</p>
            <button
              className="primary-button"
              onClick={() => void conditions.refresh()}
            >
              Try again
            </button>
          </section>
        )}
      </main>
      <Navigation tab={tab} onChange={navigate} />
      {openSpot && (
        <SpotSheet
          spot={openSpot}
          onClose={() => setOpenSpot(null)}
          onFishHere={(spot) => {
            setOpenSpot(null);
            void conditions.refresh({
              latitude: spot.latitude,
              longitude: spot.longitude,
              source: "spot",
              name: spot.name,
            });
            navigate("Today");
          }}
        />
      )}
      {showLocation && (
        <LocationSheet
          conditions={conditions}
          onClose={() => setShowLocation(false)}
        />
      )}
    </div>
  );
}
