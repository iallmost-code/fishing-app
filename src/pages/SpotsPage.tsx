import { useState } from "react";
import type { FishingConditions } from "../hooks/useFishingConditions";
import type { NearbyWaterState } from "../hooks/useNearbyWater";
import type { WaterLocation } from "../models/waterLocation";
import FishingMap from "../components/FishingMap";
import SpotRow from "../components/SpotRow";

const FILTERS = {
  All: () => true,
  Lakes: (s: WaterLocation) =>
    ["lake", "pond", "reservoir"].includes(s.type) ||
    (s.type === "park" && !!s.water?.includes("lake")),
  Rivers: (s: WaterLocation) =>
    s.type === "river" || (s.type === "park" && !!s.water?.includes("river")),
  "Ramps & piers": (s: WaterLocation) =>
    ["boat-ramp", "pier", "fishing-spot"].includes(s.type),
} as const;
type Filter = keyof typeof FILTERS;

export default function SpotsPage({
  conditions,
  water,
  radius,
  onRadius,
  onOpenSpot,
}: {
  conditions: FishingConditions;
  water: NearbyWaterState;
  radius: number;
  onRadius: (miles: number) => void;
  onOpenSpot: (spot: WaterLocation) => void;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = water.spots.filter(FILTERS[filter]);
  return (
    <div className="content spots">
      <div className="map-wrap">
        <FishingMap
          location={conditions.location}
          radius={radius}
          spots={shown}
          onSelect={onOpenSpot}
        />
        <div className="radius-control" role="group" aria-label="Distance">
          {[5, 10, 25].map((r) => (
            <button
              key={r}
              className={radius === r ? "selected" : ""}
              aria-pressed={radius === r}
              onClick={() => onRadius(r)}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>
      <div className="filter-row" role="group" aria-label="Filter spots">
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <button
            key={f}
            className={filter === f ? "selected" : ""}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      {water.liveError && (
        <div className="banner subtle" role="status">
          {water.liveError}
          <button onClick={water.retry}>Retry</button>
        </div>
      )}
      <section className="card list-card">
        {water.loading && !water.spots.length ? (
          <p className="muted">Looking for water nearby…</p>
        ) : shown.length ? (
          <div className="spot-list">
            {shown.map((s) => (
              <SpotRow key={s.id} spot={s} onClick={() => onOpenSpot(s)} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Nothing here within {radius} miles. Try a bigger distance.
          </p>
        )}
      </section>
      <p className="credit">
        Water © OpenStreetMap contributors · Fishing parks: AllTrails. Being on
        the map doesn't mean public access.
      </p>
    </div>
  );
}
