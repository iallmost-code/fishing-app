import { useEffect, useRef, useState } from "react";
import { getWeather, type WeatherSnapshot } from "../services/weather";
import {
  loadLastLocation,
  locate,
  MONROE_FALLBACK,
  nameFor,
  permissionState,
  saveLastLocation,
  type FishingLocation,
  type LocationStatus,
} from "../services/location";
import { distanceMiles } from "../services/water/geo";
export function useFishingConditions() {
  const [location, setLocation] = useState<FishingLocation>(
    () => loadLastLocation() ?? MONROE_FALLBACK,
  );
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle"),
    [locationError, setLocationError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const request = useRef(0),
    current = useRef(location);
  async function refresh(selected: FishingLocation = current.current) {
    const id = ++request.current,
      previous = current.current;
    current.current = selected;
    setLocation(selected);
    if (selected.source !== "fallback") saveLastLocation(selected);
    setLoading(true);
    setError("");
    // Never show conditions from the previous place beneath a new one.
    if (distanceMiles(previous, selected) > 1) setWeather(null);
    try {
      const result = await getWeather(selected.latitude, selected.longitude);
      if (id === request.current) setWeather(result);
    } catch (err) {
      if (id === request.current)
        setError(
          err instanceof Error && !/abort|timed? ?out|fetch/i.test(err.message)
            ? err.message
            : "Couldn't reach the weather service. Check your signal and retry.",
        );
    } finally {
      if (id === request.current) setLoading(false);
    }
  }
  /** Returns whether a fix was obtained. */
  async function useGPS(): Promise<boolean> {
    setLocationStatus("locating");
    setLocationError("");
    try {
      const fix = await locate();
      setLocationStatus("granted");
      // Keep the town name we already know if you haven't really moved.
      const prev = current.current;
      const near = prev.source === "gps" && distanceMiles(prev, fix) < 2;
      const selected = { ...fix, name: near ? prev.name : fix.name };
      await refresh(selected);
      if (!near) {
        const name = await nameFor(fix.latitude, fix.longitude);
        if (name && current.current === selected) {
          const named = { ...selected, name };
          current.current = named;
          setLocation(named);
          saveLastLocation(named);
        }
      }
      return true;
    } catch (err) {
      setLocationStatus(
        (err as { code?: number }).code === 1 ? "denied" : "unavailable",
      );
      setLocationError((err as Error).message);
      return false;
    }
  }
  useEffect(() => {
    // Show the last place immediately, then try for a live GPS fix.
    void refresh(current.current);
    void permissionState().then((state) => {
      if (state === "denied") {
        setLocationStatus("denied");
        setLocationError(
          "Location is blocked. Turn it on for this site in your phone's browser settings, or search a town.",
        );
      } else void useGPS();
    });
  }, []);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return {
    location,
    weather,
    loading,
    error,
    refresh,
    useGPS,
    locationStatus,
    locationError,
    offline,
  };
}
export type FishingConditions = ReturnType<typeof useFishingConditions>;
