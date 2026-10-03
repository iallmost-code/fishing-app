/** Future provider records; presence does not imply public/legal fishing access. */
export type WaterType =
  "lake" | "pond" | "reservoir" | "river" | "stream" | "unknown";
export type WaterLocation = {
  id: string;
  provider: string;
  name: string | null;
  type: WaterType;
  latitude: number;
  longitude: number;
  approximateAreaSqMeters?: number;
  distanceMiles: number;
  favorite: boolean;
};
