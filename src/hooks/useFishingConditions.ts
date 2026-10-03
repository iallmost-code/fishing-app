import { useEffect, useRef, useState } from "react";
import { getWeather, type WeatherSnapshot } from "../services/weather";
import {
  locate,
  MONROE_FALLBACK,
  type FishingLocation,
  type LocationStatus,
} from "../services/location";
export function useFishingConditions() {
  const [location, setLocation] = useState<FishingLocation>(MONROE_FALLBACK);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle"),
    [locationError, setLocationError] = useState("");
  const [offline, setOffline] = useState(!navigator.onLine);
  const request = useRef(0);
  async function refresh(selected: FishingLocation = location) {
    const id = ++request.current;
    setLocation(selected);
    setLoading(true);
    setError("");
    // Never show conditions from the previous town beneath a newly selected town.
    if (
      selected.latitude !== location.latitude ||
      selected.longitude !== location.longitude
    )
      setWeather(null);
    try {
      const result = await getWeather(selected.latitude, selected.longitude);
      if (id === request.current) setWeather(result);
    } catch (err) {
      if (id === request.current)
        setError(
          err instanceof Error
            ? err.message
            : "Weather is unavailable. Please retry.",
        );
    } finally {
      if (id === request.current) setLoading(false);
    }
  }
  async function useGPS() {
    setLocationStatus("locating");
    setLocationError("");
    try {
      const selected = await locate();
      setLocationStatus("granted");
      await refresh(selected);
    } catch (err) {
      setLocationStatus(
        (err as { code?: number }).code === 1 ? "denied" : "unavailable",
      );
      setLocationError((err as Error).message);
    }
  }
  useEffect(() => {
    void refresh(MONROE_FALLBACK);
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
