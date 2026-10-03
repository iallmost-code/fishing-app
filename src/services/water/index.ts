import type { WaterLocation } from "../../models/waterLocation";
import { distanceMiles } from "./geo";
import { knownSpotsNear } from "./knownSpots";
import { fetchOsmWater } from "./overpass";

export type NearbyWater = {
  spots: WaterLocation[];
  /** Set when the live map lookup failed; known parks are still returned. */
  liveError: string | null;
};

/**
 * Known fishing parks first-class, live OpenStreetMap water around them.
 * A live water body inside a known park is folded into that park so the
 * same lake doesn't show twice.
 */
export async function findNearbyWater(
  center: { latitude: number; longitude: number },
  radiusMiles: number,
  signal?: AbortSignal,
): Promise<NearbyWater> {
  const parks = knownSpotsNear(center, radiusMiles);
  let live: WaterLocation[] = [],
    liveError: string | null = null;
  try {
    live = await fetchOsmWater(center, radiusMiles, signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    liveError = "Couldn't load live map water. Showing known spots.";
  }
  return { spots: mergeSpots(parks, live, radiusMiles), liveError };
}

export function mergeSpots(
  parks: WaterLocation[],
  live: WaterLocation[],
  radiusMiles: number,
): WaterLocation[] {
  const merged = parks.map((p) => ({ ...p, facts: [...p.facts] }));
  for (const spot of live) {
    if (spot.distanceMiles > radiusMiles) continue;
    const park = merged.find(
      (p) =>
        p.source === "alltrails" &&
        (spot.type === "lake" ||
          spot.type === "pond" ||
          spot.type === "reservoir") &&
        distanceMiles(p, spot) < 0.75,
    );
    if (park) {
      if (spot.name && !park.facts.includes(spot.name))
        park.facts.push(spot.name);
      continue;
    }
    merged.push(spot);
  }
  return merged.sort((a, b) => a.distanceMiles - b.distanceMiles);
}
