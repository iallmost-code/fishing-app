export type FishingLocation = {
  latitude: number;
  longitude: number;
  source: "gps" | "fallback" | "manual" | "spot";
  name: string;
  /** GPS accuracy radius in meters, when known. */
  accuracy?: number;
};
export type LocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unavailable";
export const MONROE_FALLBACK: FishingLocation = {
  latitude: 33.7948,
  longitude: -83.7132,
  source: "fallback",
  name: "Monroe, Georgia",
};

type GeoError = Error & { code?: number };
function position(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, options),
  );
}

/**
 * Ask the phone for a fix. A high-accuracy request can time out under tree
 * cover or indoors, so fall back to a network/cell fix before giving up.
 */
export async function locate(): Promise<FishingLocation> {
  if (!navigator.geolocation)
    throw Object.assign(new Error("This browser can't share your location."), {
      code: 2,
    });
  let pos: GeolocationPosition;
  try {
    pos = await position({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  } catch (err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) throw locationError(1);
    try {
      pos = await position({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      });
    } catch (retry) {
      throw locationError((retry as GeolocationPositionError).code);
    }
  }
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    source: "gps",
    name: "Your location",
  };
}
function locationError(code: number): GeoError {
  return Object.assign(
    new Error(
      code === 1
        ? "Location is blocked. Turn it on for this site in your phone's browser settings, or search a town."
        : "Couldn't get a GPS fix. Try again outside, or search a town.",
    ),
    { code },
  );
}

/** Current permission without prompting; "unknown" where the API is missing (older iOS). */
export async function permissionState(): Promise<PermissionState | "unknown"> {
  try {
    const status = await navigator.permissions?.query({
      name: "geolocation",
    });
    return status?.state ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Town name for a GPS fix, e.g. "Near Monroe, GA". Falls back silently. */
export async function nameFor(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&lat=${latitude.toFixed(4)}&lon=${longitude.toFixed(4)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const a = (await response.json()).address ?? {};
    const town = a.city ?? a.town ?? a.village ?? a.hamlet ?? a.county;
    const state = a["ISO3166-2-lvl4"]?.split("-")[1] ?? a.state;
    return town ? `Near ${[town, state].filter(Boolean).join(", ")}` : null;
  } catch {
    return null;
  }
}

const STORAGE_KEY = "fishing:last-location";
/** Last location, so the app opens on your water instead of the fallback. */
export function loadLastLocation(): FishingLocation | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return saved &&
      Number.isFinite(saved.latitude) &&
      Number.isFinite(saved.longitude)
      ? saved
      : null;
  } catch {
    return null;
  }
}
export function saveLastLocation(location: FishingLocation) {
  try {
    // About 100 m of precision is plenty for weather and nearby water.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...location,
        latitude: +location.latitude.toFixed(3),
        longitude: +location.longitude.toFixed(3),
        accuracy: undefined,
      }),
    );
  } catch {
    /* storage unavailable (private mode) */
  }
}

export async function searchLocations(
  query: string,
): Promise<FishingLocation[]> {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
    { signal: AbortSignal.timeout(10000) },
  );
  if (!response.ok)
    throw new Error("Location search is unavailable. Please retry.");
  const data = await response.json();
  return (data.results ?? []).map((p: any) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    source: "manual",
    name: [p.name, p.admin1].filter(Boolean).join(", "),
  }));
}
