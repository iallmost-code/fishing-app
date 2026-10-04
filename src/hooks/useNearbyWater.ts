import { useEffect, useState } from "react";
import type { WaterLocation } from "../models/waterLocation";
import { findNearbyWater, mergeSpots } from "../services/water";
import { knownSpotsNear } from "../services/water/knownSpots";
import type { FishingLocation } from "../services/location";

export function useNearbyWater(location: FishingLocation, radiusMiles: number) {
  const [spots, setSpots] = useState<WaterLocation[]>([]),
    [loading, setLoading] = useState(true),
    [liveError, setLiveError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0);
  // Round so GPS jitter doesn't refetch; ~0.7 mi is fine for "nearby".
  const lat = +location.latitude.toFixed(2),
    lon = +location.longitude.toFixed(2);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    // Known fishing parks need no network, so show them while live data loads.
    const known = mergeSpots(
      knownSpotsNear(location, radiusMiles),
      [],
      radiusMiles,
    );
    setSpots(known);
    findNearbyWater(
      { latitude: location.latitude, longitude: location.longitude },
      radiusMiles,
      controller.signal,
    )
      .then((result) => {
        setSpots(result.spots);
        setLiveError(result.liveError);
      })
      .catch(() => {
        /* aborted by a newer request */
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [lat, lon, radiusMiles, attempt]);
  return { spots, loading, liveError, retry: () => setAttempt((a) => a + 1) };
}
export type NearbyWaterState = ReturnType<typeof useNearbyWater>;
