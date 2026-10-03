import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LocateFixed } from "lucide-react";
import type { FeatureCollection, Point } from "geojson";
import type { FishingLocation } from "../services/location";
import type { WaterLocation } from "../models/waterLocation";
import { BASEMAP_STYLE } from "../services/maps/basemap";
import { radiusPolygon } from "../services/maps/radius";

const COLORS: Record<WaterLocation["type"], string> = {
  park: "#16a34a",
  lake: "#0284c7",
  pond: "#0284c7",
  reservoir: "#0284c7",
  river: "#0e7490",
  "boat-ramp": "#f59e0b",
  pier: "#f59e0b",
  "fishing-spot": "#f59e0b",
};

function spotFeatures(spots: WaterLocation[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: spots.map((s) => ({
      type: "Feature",
      properties: { id: s.id, color: COLORS[s.type] },
      geometry: { type: "Point", coordinates: [s.longitude, s.latitude] },
    })),
  };
}

export default function FishingMap({
  location,
  radius,
  spots,
  onSelect,
}: {
  location: FishingLocation;
  radius: number;
  spots: WaterLocation[];
  onSelect: (spot: WaterLocation) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    marker = useRef<maplibregl.Marker | null>(null);
  const latest = useRef({ location, radius, spots, onSelect });
  latest.current = { location, radius, spots, onSelect };
  const [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false),
    [attempt, setAttempt] = useState(0);

  function showArea(instance: maplibregl.Map, animate = true) {
    const { location: l, radius: r } = latest.current,
      data = radiusPolygon(l.latitude, l.longitude, r);
    (instance.getSource("search-radius") as GeoJSONSource | undefined)?.setData(
      data,
    );
    marker.current?.setLngLat([l.longitude, l.latitude]);
    const bounds = data.geometry.coordinates[0].reduce(
      (b, c) => b.extend(c as [number, number]),
      new maplibregl.LngLatBounds(),
    );
    instance.fitBounds(bounds, {
      padding: 24,
      duration: animate ? 600 : 0,
      maxZoom: 13,
    });
  }

  useEffect(() => {
    if (!container.current) return;
    setError("");
    setLoaded(false);
    let instance: maplibregl.Map;
    try {
      const l = latest.current.location;
      instance = new maplibregl.Map({
        container: container.current,
        style: BASEMAP_STYLE,
        center: [l.longitude, l.latitude],
        zoom: 10,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      instance.touchZoomRotate.disableRotation();
      map.current = instance;
      instance.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );
      const dot = document.createElement("div");
      dot.className = "map-marker";
      dot.setAttribute("aria-label", "You");
      marker.current = new maplibregl.Marker({ element: dot })
        .setLngLat([l.longitude, l.latitude])
        .addTo(instance);
      instance.on("load", () => {
        const { location: l, radius: r, spots } = latest.current;
        instance.addSource("search-radius", {
          type: "geojson",
          data: radiusPolygon(l.latitude, l.longitude, r),
        });
        instance.addLayer({
          id: "radius-line",
          type: "line",
          source: "search-radius",
          paint: {
            "line-color": "#0369a1",
            "line-width": 1.5,
            "line-dasharray": [3, 2],
          },
        });
        instance.addSource("spots", {
          type: "geojson",
          data: spotFeatures(spots),
        });
        instance.addLayer({
          id: "spots",
          type: "circle",
          source: "spots",
          paint: {
            "circle-radius": 8,
            "circle-color": ["get", "color"],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });
        // Invisible, finger-sized tap target over each dot.
        instance.addLayer({
          id: "spots-hit",
          type: "circle",
          source: "spots",
          paint: { "circle-radius": 20, "circle-opacity": 0 },
        });
        instance.on("click", "spots-hit", (e) => {
          const id = e.features?.[0]?.properties?.id,
            spot = latest.current.spots.find((s) => s.id === id);
          if (spot) latest.current.onSelect(spot);
        });
        showArea(instance, false);
        setLoaded(true);
      });
      instance.on("error", () =>
        setError("Some map tiles didn't load. Check your signal."),
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
      setError("This browser couldn't start the map.");
      map.current = null;
    }
  }, [attempt]);

  useEffect(() => {
    if (loaded && map.current) showArea(map.current);
  }, [location.latitude, location.longitude, radius, loaded]);
  useEffect(() => {
    if (!loaded || !map.current) return;
    (map.current.getSource("spots") as GeoJSONSource | undefined)?.setData(
      spotFeatures(spots),
    );
  }, [spots, loaded]);

  return (
    <div className="map-frame">
      <div
        className="map-canvas"
        ref={container}
        aria-label={`Map of water within ${radius} miles`}
      />
      <button
        className="map-recenter"
        onClick={() => map.current && showArea(map.current)}
        disabled={!loaded}
        aria-label="Recenter map"
      >
        <LocateFixed size={20} />
      </button>
      {error && (
        <div className="map-error" role="status">
          {error}
          <button
            className="text-button"
            onClick={() => setAttempt((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
