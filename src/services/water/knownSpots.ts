import type { WaterLocation } from "../../models/waterLocation";
import { distanceMiles } from "./geo";

/**
 * Parks within ~50 miles of Monroe, GA that AllTrails lists for fishing.
 * Only plain facts are kept (park, water type, fees, accessibility); the
 * coordinates are the park's location from OpenStreetMap, checked against
 * AllTrails' distances. Collected 2026-10-03; refresh by re-running the
 * AllTrails lookup. Outside this area the list simply contributes nothing.
 */
type KnownSpot = {
  id: string;
  name: string;
  water: ("lake" | "river")[];
  latitude: number;
  longitude: number;
  fee?: string;
  accessible?: boolean;
};
export const KNOWN_FISHING_PARKS: KnownSpot[] = [
  {
    id: "alltrails-11075678",
    name: "Meridian Park",
    water: ["lake"],
    latitude: 33.82359,
    longitude: -83.87673,
    accessible: true,
  },
  {
    id: "alltrails-10022765",
    name: "Fort Yargo State Park",
    water: ["lake"],
    latitude: 33.97025,
    longitude: -83.72975,
    fee: "State park parking fee",
  },
  {
    id: "alltrails-10280108",
    name: "Tribble Mill Park",
    water: ["lake"],
    latitude: 33.90733,
    longitude: -83.91083,
  },
  {
    id: "alltrails-10474632",
    name: "Turner Lake Park",
    water: ["lake"],
    latitude: 33.60046,
    longitude: -83.87797,
    accessible: true,
  },
  {
    id: "alltrails-10304710",
    name: "Rhodes Jordan Park",
    water: ["lake"],
    latitude: 33.96265,
    longitude: -83.97873,
    accessible: true,
  },
  {
    id: "alltrails-10274600",
    name: "Little Mulberry Park",
    water: ["lake"],
    latitude: 34.04651,
    longitude: -83.88116,
    accessible: true,
  },
  {
    id: "alltrails-10242109",
    name: "Yellow River Park",
    water: ["river"],
    latitude: 33.79178,
    longitude: -84.07172,
  },
  {
    id: "alltrails-11078971",
    name: "Charlie Elliott Wildlife Center",
    water: ["lake", "river"],
    latitude: 33.44182,
    longitude: -83.74114,
  },
  {
    id: "alltrails-10257856",
    name: "Chattahoochee Pointe Park",
    water: ["river"],
    latitude: 34.07036,
    longitude: -84.11868,
    accessible: true,
  },
  {
    id: "alltrails-10019415",
    name: "Buford Dam Park",
    water: ["lake", "river"],
    latitude: 34.15523,
    longitude: -84.06596,
  },
  {
    id: "alltrails-10314403",
    name: "Garrard Landing Park",
    water: ["river"],
    latitude: 33.97477,
    longitude: -84.26629,
    accessible: true,
  },
  {
    id: "alltrails-10314643",
    name: "Lullwater Preserve",
    water: ["lake", "river"],
    latitude: 33.79959,
    longitude: -84.31422,
  },
  {
    id: "alltrails-11121972",
    name: "Island Ford Park",
    water: ["river"],
    latitude: 33.99649,
    longitude: -84.33038,
    accessible: true,
  },
  {
    id: "alltrails-10262712",
    name: "Piedmont Park",
    water: ["lake"],
    latitude: 33.78905,
    longitude: -84.37189,
  },
  {
    id: "alltrails-10238113",
    name: "Indian Springs State Park",
    water: ["lake"],
    latitude: 33.24775,
    longitude: -83.9265,
    fee: "State park entrance fee",
  },
  {
    id: "alltrails-10021280",
    name: "Morgan Falls Overlook Park",
    water: ["lake", "river"],
    latitude: 33.9702,
    longitude: -84.37977,
  },
  {
    id: "alltrails-10257685",
    name: "Leita Thompson Memorial Park",
    water: ["lake"],
    latitude: 34.06696,
    longitude: -84.40476,
    accessible: true,
  },
  {
    id: "alltrails-10985464",
    name: "Piedmont National Wildlife Refuge",
    water: ["lake"],
    latitude: 33.111,
    longitude: -83.70412,
  },
  {
    id: "alltrails-10035154",
    name: "Victoria Bryant State Park",
    water: ["river"],
    latitude: 34.29751,
    longitude: -83.16015,
    fee: "State park parking fee",
  },
  {
    id: "alltrails-10258106",
    name: "Mill Creek Nature Center",
    water: ["river"],
    latitude: 34.06825,
    longitude: -83.97758,
  },
  {
    id: "alltrails-11204314",
    name: "Club Drive Park",
    water: ["lake"],
    latitude: 33.94133,
    longitude: -84.11082,
    accessible: true,
  },
  {
    id: "alltrails-10502673",
    name: "Laurel Park",
    water: ["lake"],
    latitude: 34.34705,
    longitude: -83.80684,
  },
  {
    id: "alltrails-10245076",
    name: "Chattahoochee River – Johnson Ferry",
    water: ["river"],
    latitude: 33.93927,
    longitude: -84.41233,
    fee: "National recreation area parking fee",
  },
];

export function knownSpotsNear(
  center: { latitude: number; longitude: number },
  radiusMiles: number,
): WaterLocation[] {
  return KNOWN_FISHING_PARKS.map((s) => ({
    id: s.id,
    source: "alltrails" as const,
    name: s.name,
    type: "park" as const,
    water: s.water,
    latitude: s.latitude,
    longitude: s.longitude,
    distanceMiles: distanceMiles(center, s),
    facts: [
      "Fishing allowed",
      ...(s.fee ? [s.fee] : []),
      ...(s.accessible ? ["Accessible paths"] : []),
    ],
  })).filter((s) => s.distanceMiles <= radiusMiles);
}
