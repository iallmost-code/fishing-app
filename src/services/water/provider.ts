import type { WaterLocation } from "../../models/waterLocation";
/** Provider seam only. No discovery provider or fabricated records are installed yet. */
export interface WaterProvider {
  findNearby(
    center: { latitude: number; longitude: number },
    radiusMiles: number,
    signal?: AbortSignal,
  ): Promise<{ locations: WaterLocation[]; truncated: boolean }>;
}
