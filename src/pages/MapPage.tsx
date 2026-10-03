import { useState } from "react";
import { MapPin, Waves } from "lucide-react";
import type { FishingConditions } from "../hooks/useFishingConditions";
import LocationSearch from "../components/LocationSearch";
import FishingMap from "../components/FishingMap";
export default function MapPage({
  conditions,
}: {
  conditions: FishingConditions;
}) {
  const [radius, setRadius] = useState(10);
  return (
    <div className="content">
      <section className="card map-card">
        <div className="map-toolbar">
          <div>
            <h3>Your water, in view</h3>
            <small>{conditions.location.name}</small>
          </div>
          <MapPin size={24} color="#0a96d4" />
        </div>
        <div className="radius-control" role="group" aria-label="Search radius">
          {[5, 10, 20, 30, 50].map((r) => (
            <button
              key={r}
              className={radius === r ? "selected" : ""}
              aria-pressed={radius === r}
              onClick={() => setRadius(r)}
            >
              {r} mi
            </button>
          ))}
        </div>
        <FishingMap location={conditions.location} radius={radius} />
        <div className="map-note">
          {conditions.location.source === "gps"
            ? "The blue marker is your browser GPS location."
            : conditions.location.source === "manual"
              ? "The blue marker is the selected town, not your live GPS location."
              : "The blue marker is the Monroe, Georgia fallback, not your live GPS location."}{" "}
          The circle shows your selected radius.
        </div>
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <span className="kicker">NEARBY WATER</span>
            <h3>Discovery is the next step</h3>
          </div>
          <Waves size={24} color="#0a96d4" />
        </div>
        <p className="muted">
          Nearby-water discovery is pending a verified data provider. No fishing
          spots are invented here. The map already supports your live GPS
          position and a town search.
        </p>
        <div className="map-permission">
          Location access:{" "}
          {conditions.locationStatus === "granted"
            ? "granted"
            : conditions.locationStatus === "denied"
              ? "denied — manual search is available"
              : conditions.locationStatus === "unavailable"
                ? "unavailable — manual search is available"
                : conditions.locationStatus === "locating"
                  ? "finding your location…"
                  : "not requested"}
        </div>
      </section>
      <LocationSearch conditions={conditions} />
    </div>
  );
}
