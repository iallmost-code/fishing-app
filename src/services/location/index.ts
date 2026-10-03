export type FishingLocation = {
  latitude: number;
  longitude: number;
  source: "gps" | "fallback" | "manual";
  name: string;
};
export type LocationStatus =
  "idle" | "locating" | "granted" | "denied" | "unavailable";
export const MONROE_FALLBACK: FishingLocation = {
  latitude: 33.7948,
  longitude: -83.7132,
  source: "fallback",
  name: "Monroe, Georgia",
};
export function locate(): Promise<FishingLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(
        new Error(
          "Location is unavailable. Search a town or use Monroe, Georgia.",
        ),
      );
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: "gps",
          name: "Your GPS location",
        }),
      (err) =>
        reject(
          Object.assign(
            new Error(
              err.code === 1
                ? "Location permission denied. You can search a town instead."
                : "Could not find your location. Search a town instead.",
            ),
            { code: err.code },
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  });
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
    name: [p.name, p.admin1, p.country].filter(Boolean).join(", "),
  }));
}
