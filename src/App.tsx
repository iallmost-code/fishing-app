import { lazy, Suspense, useState } from "react";
import { MapPin, LocateFixed, RefreshCw, Waves, X } from "lucide-react";
import { useFishingConditions } from "./hooks/useFishingConditions";
import Navigation, { type AppTab } from "./components/Navigation";
import LocationSearch from "./components/LocationSearch";
import HomePage from "./pages/HomePage";
import ScreenErrorBoundary from "./components/ScreenErrorBoundary";
import ForecastPage from "./pages/ForecastPage";
import TacklePage from "./pages/TacklePage";
import CatchesPage from "./pages/CatchesPage";
import { formatClock } from "./utils/format";
const MapPage = lazy(() => import("./pages/MapPage"));
export default function App() {
  const conditions = useFishingConditions(),
    [tab, setTab] = useState<AppTab>(() => {
      const hash = window.location.hash.slice(1);
      return ["Home", "Map", "Forecast", "Tackle", "Catches"].includes(hash)
        ? (hash as AppTab)
        : "Home";
    }),
    [showLocation, setShowLocation] = useState(false);
  function navigate(next: AppTab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const { location, weather, loading, error } = conditions;
  return (
    <div className="app-shell">
      <header className="hero">
        <div className="brand-line">
          <Waves size={23} />
          <span>Fishing Companion</span>
          <span className="brand-tag">READ THE WATER</span>
        </div>
        <div className="hero-top">
          <div>
            <button
              className="location-heading"
              onClick={() => setShowLocation(!showLocation)}
            >
              <MapPin size={15} />
              {location.name}
            </button>
            <h1>
              {tab === "Home"
                ? "Make your next cast count."
                : tab === "Forecast"
                  ? "Find your best bite."
                  : tab === "Map"
                    ? "Find your next spot."
                    : tab === "Tackle"
                      ? "Your tackle box."
                      : "Your catch log."}
            </h1>
            <p className="coords">
              {location.source === "gps"
                ? "Live GPS"
                : location.source === "manual"
                  ? "Selected location"
                  : "Fallback location"}{" "}
              · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          </div>
          <div className="header-buttons">
            <button
              className="round-btn"
              onClick={() => void conditions.refresh()}
              disabled={loading}
              aria-label="Refresh weather"
            >
              <RefreshCw size={19} className={loading ? "spin" : ""} />
            </button>
            <button
              className="round-btn"
              onClick={() => setShowLocation(!showLocation)}
              aria-label="Choose location"
              aria-expanded={showLocation}
            >
              {showLocation ? <X size={20} /> : <LocateFixed size={20} />}
            </button>
          </div>
        </div>
        {conditions.offline && (
          <div className="notice" role="status">
            You're offline.{" "}
            {weather
              ? "Previously loaded weather is shown below."
              : "Live weather needs a connection."}
          </div>
        )}
        {loading && (
          <div className="status" role="status">
            <RefreshCw className="spin" size={16} />
            Loading conditions…
          </div>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
            {weather ? " Previous weather remains visible." : ""}
            <button onClick={() => void conditions.refresh()}>Retry</button>
          </div>
        )}
        {weather && (
          <div className="weather-freshness">
            {error || conditions.offline ? "PREVIOUS WEATHER" : "LIVE WEATHER"}{" "}
            · Updated {formatClock(weather.fetchedAt, weather.timezone)} ·{" "}
            {weather.timezone}
          </div>
        )}
      </header>
      <main className="screen" id="main-content">
        {showLocation && (
          <div className="content">
            <LocationSearch conditions={conditions} />
          </div>
        )}
        {tab === "Map" ? (
          <ScreenErrorBoundary>
            <Suspense fallback={<div className="card">Loading map…</div>}>
              <MapPage conditions={conditions} />
            </Suspense>
          </ScreenErrorBoundary>
        ) : tab === "Tackle" ? (
          <TacklePage />
        ) : tab === "Catches" ? (
          <CatchesPage />
        ) : weather ? (
          tab === "Forecast" ? (
            <ForecastPage weather={weather} />
          ) : (
            <HomePage
              weather={weather}
              onForecast={() => navigate("Forecast")}
            />
          )
        ) : !loading ? (
          <section className="card empty-page">
            <Waves size={38} />
            <h2>Weather is unavailable</h2>
            <p>Choose a location or retry when your connection returns.</p>
            <button
              className="primary-button"
              onClick={() => void conditions.refresh()}
            >
              Retry weather
            </button>
          </section>
        ) : null}
      </main>
      <footer>
        Weather by{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
        . Fishing scores are guidance, not a guarantee.
      </footer>
      <Navigation tab={tab} onChange={navigate} />
    </div>
  );
}
