import { Anchor, Fish, Trees, Waves, Droplet } from "lucide-react";
import type { WaterLocation } from "../models/waterLocation";
import { waterTypeLabel } from "../services/water/overpass";

export function SpotIcon({
  spot,
  size = 20,
}: {
  spot: WaterLocation;
  size?: number;
}) {
  const Icon =
    spot.type === "park"
      ? Trees
      : spot.type === "river"
        ? Waves
        : spot.type === "boat-ramp"
          ? Anchor
          : spot.type === "pier" || spot.type === "fishing-spot"
            ? Fish
            : Droplet;
  return <Icon size={size} aria-hidden="true" />;
}

export function spotSubtitle(spot: WaterLocation) {
  const kind =
    spot.type === "park" && spot.water?.length
      ? `Park · ${spot.water.map((w) => (w === "lake" ? "Lake" : "River")).join(" & ")}`
      : waterTypeLabel(spot.type);
  return `${kind} · ${spot.distanceMiles < 10 ? spot.distanceMiles.toFixed(1) : Math.round(spot.distanceMiles)} mi`;
}

export default function SpotRow({
  spot,
  onClick,
}: {
  spot: WaterLocation;
  onClick: () => void;
}) {
  return (
    <button className="spot-row" onClick={onClick}>
      <span className={`spot-icon ${spot.type}`}>
        <SpotIcon spot={spot} />
      </span>
      <span className="spot-text">
        <strong>{spot.name}</strong>
        <small>{spotSubtitle(spot)}</small>
        {spot.facts.length > 0 && (
          <span className="tags">
            {spot.facts.slice(0, 2).map((f) => (
              <i key={f}>{f}</i>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}
