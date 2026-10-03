import { lazy, Suspense, useEffect, useState } from "react";
import { Waves } from "lucide-react";
import AppHeader from "./components/AppHeader";
import { motionBehavior, scrollToSection } from "./utils/scroll";
import { useFishingConditions } from "./hooks/useFishingConditions";
import { useNearbyWater } from "./hooks/useNearbyWater";
import Navigation, { type AppTab, TABS } from "./components/Navigation";
import LocationSheet from "./components/LocationSheet";
import SpotSheet from "./components/SpotSheet";
import type { WaterLocation } from "./models/waterLocation";
import TodayPage from "./pages/TodayPage";
import ForecastPage from "./pages/ForecastPage";
import ScreenErrorBoundary from "./components/ScreenErrorBoundary";
const SpotsPage = lazy(() => import("./pages/SpotsPage"));

function initialTab(): AppTab {
  const raw = window.location.hash.slice(1);
  const hash = raw === "Home" ? "Today" : raw === "Map" ? "Spots" : raw;
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
  const { location, weather, loading, error, offline } = conditions;
  const water = useNearbyWater(location, radius);
  function navigate(next: AppTab) {
    setTab(next);
    setShowLocation(false);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: motionBehavior() });
  }
  useEffect(() => {
    const update = () => {
      setTab(initialTab());
      setShowLocation(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return (
    <div className={`app-shell tab-${tab.toLowerCase()}`}>
      <div className="page-bass-background" aria-hidden="true">
        <img src="./brand/bass-hero.webp" alt="" />
      </div>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document
            .getElementById("main-content")
            ?.focus({ preventScroll: true });
          scrollToSection("main-content");
        }}
      >
        Skip to content
      </a>
      <AppHeader
        tab={tab}
        conditions={conditions}
        showLocation={showLocation}
        onLocation={() => setShowLocation(true)}
      />
      <main className="screen" id="main-content" tabIndex={-1}>
        <h1 className="sr-only">WTF — Where’s the Fish · {tab}</h1>
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
              stale={!!error || offline}
              water={water}
              onForecast={() => navigate("Forecast")}
              onSpots={() => navigate("Spots")}
              onOpenSpot={setOpenSpot}
            />
          )
        ) : loading ? (
          <section className="card loading-card" role="status">
            <span className="loading-ripple">
              <Waves size={30} />
            </span>
            <h2>Reading the water…</h2>
            <p>Checking the conditions for your next cast.</p>
          </section>
        ) : (
          <section className="card empty-page">
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
      <footer>
        <div className="footer-brand">
          <Waves size={17} />
          <strong>Less guessing. More fishing.</strong>
        </div>
        <p>
          Weather by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>{" "}
          · Fishing scores are guidance, not a guarantee.
        </p>
        <span>WTF — WHERE’S THE FISH · MADE FOR DAYS ON THE WATER</span>
      </footer>
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
