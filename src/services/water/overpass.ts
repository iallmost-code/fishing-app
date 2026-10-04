import type { WaterLocation, WaterType } from "../../models/waterLocation";
import { distanceMiles } from "./geo";

/**
 * Nearby water from OpenStreetMap via the public Overpass API. Public
 * instances are shared and rate limited, so results are cached per area and
 * a second instance is tried only when the first fails.
 */
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const MAX_RADIUS_MILES = 25;

export function overpassQuery(lat: number, lon: number, radiusMiles: number) {
  const r = Math.round(Math.min(radiusMiles, MAX_RADIUS_MILES) * 1609.344),
    around = `(around:${r},${lat.toFixed(4)},${lon.toFixed(4)})`;
  return `[out:json][timeout:25];
(
  nwr["natural"="water"]["name"]["water"!~"wastewater|sewage|lagoon|swimming_pool|fountain|reflecting_pool|basin"]${around};
  way["waterway"="river"]["name"]${around};
  nwr["leisure"="fishing"]${around};
  nwr["leisure"="slipway"]${around};
  nwr["man_made"="pier"]["fishing"="yes"]${around};
);
out center tags qt 400;`;
}

type Element = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};
const isWater = (t: WaterType) =>
  t === "lake" || t === "pond" || t === "reservoir" || t === "river";

/** Sewage and wastewater treatment water: never somewhere to fish. */
const SEWAGE_NAME =
  /sewage|sewer|waste ?water|wwtp|wpcp|effluent|sludge|lagoon|water reclamation|water pollution|treatment (plant|facility|pond|works)|settling (pond|basin)|oxidation pond|aeration/i;
export function isSewage(tags: Record<string, string>) {
  const words = [tags.name, tags.alt_name, tags.old_name, tags.operator]
    .filter(Boolean)
    .join(" ");
  return (
    SEWAGE_NAME.test(words) ||
    ["wastewater", "sewage", "lagoon"].includes(tags.water) ||
    ["wastewater", "sewage"].includes(tags.basin) ||
    ["wastewater", "sewage"].includes(tags.content) ||
    /wastewater|sewage/.test(tags.man_made ?? "") ||
    tags.industrial === "sewage"
  );
}
function classify(tags: Record<string, string>): WaterType | null {
  if (tags.leisure === "slipway") return "boat-ramp";
  if (tags.man_made === "pier") return "pier";
  if (tags.leisure === "fishing") return "fishing-spot";
  if (tags.waterway === "river" || tags.water === "river") return "river";
  if (tags.natural === "water") {
    if (tags.water === "pond") return "pond";
    if (tags.water === "reservoir") return "reservoir";
    if (!tags.water || tags.water === "lake" || tags.water === "oxbow")
      return "lake";
  }
  return null;
}
const LABEL: Record<WaterType, string> = {
  lake: "Lake",
  pond: "Pond",
  reservoir: "Reservoir",
  river: "River",
  "boat-ramp": "Boat ramp",
  pier: "Fishing pier",
  "fishing-spot": "Fishing spot",
  park: "Park",
};
export const waterTypeLabel = (t: WaterType) => LABEL[t];

/** Turn raw Overpass elements into one entry per named water/access point. */
export function normalizeOverpass(
  elements: Element[],
  center: { latitude: number; longitude: number },
): WaterLocation[] {
  const byKey = new Map<string, WaterLocation>();
  for (const e of elements) {
    const tags = e.tags ?? {},
      type = classify(tags),
      lat = e.lat ?? e.center?.lat,
      lon = e.lon ?? e.center?.lon;
    if (!type || lat === undefined || lon === undefined) continue;
    if (tags.access === "private" || tags.access === "no") continue;
    if (tags.fishing === "no") continue;
    if (isSewage(tags)) continue;
    const spot: WaterLocation = {
      id: `osm-${e.type}-${e.id}`,
      source: "osm",
      name: tags.name ?? "",
      type,
      latitude: lat,
      longitude: lon,
      distanceMiles: distanceMiles(center, { latitude: lat, longitude: lon }),
      facts: [
        ...(tags.fishing === "yes" || type === "fishing-spot"
          ? ["Fishing allowed"]
          : []),
        ...(tags.fee === "yes" ? ["Fee"] : []),
        ...(tags.access === "permissive" || tags.access === "customers"
          ? ["Access: ask"]
          : []),
      ],
    };
    // Rivers come back as many segments, and lakes sometimes as both a way
    // and a relation: keep the closest piece of each named water.
    const key = spot.name
      ? `${isWater(type) ? "water" : type}:${spot.name.toLowerCase()}`
      : spot.id;
    const existing = byKey.get(key);
    if (!existing || spot.distanceMiles < existing.distanceMiles)
      byKey.set(key, spot);
  }
  const spots = [...byKey.values()];
  // Give unnamed ramps and piers the name of the water they sit on.
  const named = spots.filter((s) => isWater(s.type) && s.name);
  for (const s of spots) {
    if (s.name) continue;
    const near = named
      .map((w) => ({ w, d: distanceMiles(s, w) }))
      .filter((x) => x.d < 1)
      .sort((a, b) => a.d - b.d)[0];
    s.name = near ? `${LABEL[s.type]} · ${near.w.name}` : LABEL[s.type];
  }
  return spots;
}

const cache = new Map<string, WaterLocation[]>();
const CACHE_TTL = 24 * 3600 * 1000;
function cacheKey(lat: number, lon: number, r: number) {
  return `fishing:water:v2:${lat.toFixed(2)},${lon.toFixed(2)}:${r}`;
}

export async function fetchOsmWater(
  center: { latitude: number; longitude: number },
  radiusMiles: number,
  signal?: AbortSignal,
): Promise<WaterLocation[]> {
  const r = Math.min(radiusMiles, MAX_RADIUS_MILES),
    key = cacheKey(center.latitude, center.longitude, r);
  const remembered = cache.get(key) ?? readStored(key);
  if (remembered) return withDistances(remembered, center);
  const body = `data=${encodeURIComponent(overpassQuery(center.latitude, center.longitude, r))}`;
  let lastError: unknown;
  for (const url of ENDPOINTS) {
    // Combine the caller's signal with a timeout without AbortSignal.any,
    // which older iPhones lack.
    const controller = new AbortController(),
      abort = () => controller.abort(),
      timer = setTimeout(abort, 30000);
    signal?.addEventListener("abort", abort);
    try {
      const response = await fetch(url, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Overpass ${response.status}`);
      const spots = normalizeOverpass(
        (await response.json()).elements ?? [],
        center,
      );
      cache.set(key, spots);
      store(key, spots);
      return spots;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Map water data is unavailable.");
}
function withDistances(
  spots: WaterLocation[],
  center: { latitude: number; longitude: number },
) {
  return spots.map((s) => ({ ...s, distanceMiles: distanceMiles(center, s) }));
}
function readStored(key: string): WaterLocation[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved && Date.now() - saved.at < CACHE_TTL) {
      cache.set(key, saved.spots);
      return saved.spots;
    }
  } catch {
    /* ignore */
  }
  return null;
}
function store(key: string, spots: WaterLocation[]) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), spots }));
  } catch {
    /* storage full or unavailable */
  }
}
