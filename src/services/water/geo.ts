type Point = { latitude: number; longitude: number };
/** Great-circle distance in miles. */
export function distanceMiles(a: Point, b: Point) {
  const r = (v: number) => (v * Math.PI) / 180;
  const h =
    Math.sin(r(b.latitude - a.latitude) / 2) ** 2 +
    Math.cos(r(a.latitude)) *
      Math.cos(r(b.latitude)) *
      Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.min(1, Math.sqrt(h)));
}
