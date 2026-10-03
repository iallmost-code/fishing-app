import type { Feature, Polygon } from "geojson";
const radians = (v: number) => (v * Math.PI) / 180,
  degrees = (v: number) => (v * 180) / Math.PI;
export function radiusPolygon(
  latitude: number,
  longitude: number,
  miles: number,
): Feature<Polygon> {
  const angle = (miles * 1609.344) / 6371008.8,
    lat = radians(latitude),
    lon = radians(longitude);
  const coordinates = Array.from({ length: 65 }, (_, i) => {
    const bearing = (i / 64) * Math.PI * 2;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(angle) +
        Math.cos(lat) * Math.sin(angle) * Math.cos(bearing),
    );
    const pointLon =
      lon +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angle) * Math.cos(lat),
        Math.cos(angle) - Math.sin(lat) * Math.sin(pointLat),
      );
    return [degrees(pointLon), degrees(pointLat)];
  });
  return {
    type: "Feature",
    properties: { miles },
    geometry: { type: "Polygon", coordinates: [coordinates] },
  };
}
