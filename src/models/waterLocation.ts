export type WaterType =
  | "lake"
  | "pond"
  | "reservoir"
  | "river"
  | "boat-ramp"
  | "pier"
  | "fishing-spot"
  | "park";
/**
 * A place to fish. Presence in OpenStreetMap does not establish legal or
 * public access; `access` carries whatever the source states.
 */
export type WaterLocation = {
  id: string;
  /** osm: live map; alltrails: AllTrails fishing parks; guide: owner's spot list. */
  source: "osm" | "alltrails" | "guide";
  name: string;
  type: WaterType;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  /** Short facts shown as tags, e.g. "Fishing allowed", "Park fee". */
  facts: string[];
  /** Water types at a park (AllTrails): lake / river. */
  water?: ("lake" | "river")[];
};
