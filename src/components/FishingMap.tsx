import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import type { FishingLocation } from "../services/location";
import { BASEMAP_STYLE } from "../services/maps/basemap";
import { radiusPolygon } from "../services/maps/radius";
export default function FishingMap({
  location,
  radius,
}: {
  location: FishingLocation;
  radius: number;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    marker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef({ location, radius });
  latest.current = { location, radius };
  const [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [attempt, setAttempt] = useState(0);
  function showArea(instance: maplibregl.Map, animate = true) {
    const { location: l, radius: r } = latest.current,
      data = radiusPolygon(l.latitude, l.longitude, r);
    const source = instance.getSource("search-radius") as
      GeoJSONSource | undefined;
    source?.setData(data);
    marker.current?.setLngLat([l.longitude, l.latitude]);
    const coords = data.geometry.coordinates[0];
    const bounds = coords.reduce(
      (b, c) => b.extend(c as [number, number]),
      new maplibregl.LngLatBounds(),
    );
    instance.fitBounds(bounds, {
      padding: 55,
      duration: animate ? 700 : 0,
      maxZoom: 12,
    });
  }
  useEffect(() => {
    if (!container.current) return;
    setError("");
    setLoaded(false);
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: BASEMAP_STYLE,
        center: [
          latest.current.location.longitude,
          latest.current.location.latitude,
        ],
        zoom: 10,
        attributionControl: false,
      });
      map.current = instance;
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      instance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      const dot = document.createElement("div");
      dot.className = "map-marker";
      dot.setAttribute("aria-label", "Selected location");
      marker.current = new maplibregl.Marker({ element: dot })
        .setLngLat([
          latest.current.location.longitude,
          latest.current.location.latitude,
        ])
        .addTo(instance);
      instance.on("load", () => {
        instance.addSource("search-radius", {
          type: "geojson",
          data: radiusPolygon(
            latest.current.location.latitude,
            latest.current.location.longitude,
            latest.current.radius,
          ),
        });
        instance.addLayer({
          id: "radius-fill",
          type: "fill",
          source: "search-radius",
          paint: { "fill-color": "#05a8df", "fill-opacity": 0.08 },
        });
        instance.addLayer({
          id: "radius-line",
          type: "line",
          source: "search-radius",
          paint: {
            "line-color": "#058bd1",
            "line-width": 2,
            "line-dasharray": [3, 2],
          },
        });
        showArea(instance, false);
        setLoaded(true);
        setError("");
      });
      instance.on("error", () =>
        setError(
          "Some map data could not load. Check your connection or retry the map.",
        ),
      );
      const resize = new ResizeObserver(() => instance.resize());
      resize.observe(container.current);
      return () => {
        resize.disconnect();
        marker.current?.remove();
        instance.remove();
        map.current = null;
        marker.current = null;
      };
    } catch {
      setError(
        "This browser could not start the map. You can still choose a location below.",
      );
      map.current = null;
    }
  }, [attempt]);
  useEffect(() => {
    if (loaded && map.current) showArea(map.current);
  }, [location.latitude, location.longitude, radius, loaded]);
  return (
    <div className="map-frame">
      <div
        className="map-canvas"
        ref={container}
        aria-label={`Map around ${location.name}, ${radius} mile radius`}
      />
      <button
        className="map-recenter"
        onClick={() => map.current && showArea(map.current)}
        disabled={!loaded}
        aria-label="Recenter map on selected location"
      >
        <LocateFixed size={18} />
        Recenter
      </button>
      {error && (
        <div className="map-error" role="status">
          {error}
          <button
            className="text-button"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Retry map
          </button>
        </div>
      )}
    </div>
  );
}
