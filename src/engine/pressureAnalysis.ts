import type { WeatherHour } from "../services/weather";
export type PressureLabel =
  | "Rapidly Falling"
  | "Falling"
  | "Stable"
  | "Rising"
  | "Rapidly Rising"
  | "Unavailable";
export type PressureTrend = {
  oneHour: number | null;
  threeHour: number | null;
  sixHour: number | null;
  rate: number | null;
  label: PressureLabel;
};
export function classifyPressure(rate: number | null): PressureLabel {
  if (rate === null || !Number.isFinite(rate)) return "Unavailable";
  if (rate <= -1.2) return "Rapidly Falling";
  if (rate <= -0.25) return "Falling";
  if (rate >= 1.2) return "Rapidly Rising";
  if (rate >= 0.25) return "Rising";
  return "Stable";
}
export function pressureAt(
  hours: WeatherHour[],
  time: string,
  current: number | null,
): PressureTrend {
  const now = Date.parse(time);
  const delta = (n: number) => {
    const target = now - n * 3600000;
    const previous = pressureNear(hours, target);
    return current !== null && previous !== null ? current - previous : null;
  };
  const oneHour = delta(1),
    threeHour = delta(3),
    sixHour = delta(6);
  const rate = threeHour !== null ? threeHour / 3 : oneHour;
  return { oneHour, threeHour, sixHour, rate, label: classifyPressure(rate) };
}

/**
 * Pressure at an arbitrary time from hourly readings: an exact reading
 * within 20 minutes, otherwise a straight line between the readings either
 * side when they are no more than an hour apart. Never bridges missing hours.
 */
export function pressureNear(
  hours: WeatherHour[],
  target: number,
): number | null {
  const readings = hours
    .filter((h) => h.pressureHpa !== null)
    .map((h) => ({ t: Date.parse(h.time), p: h.pressureHpa! }));
  const close = readings.find((r) => Math.abs(r.t - target) <= 20 * 60000);
  if (close) return close.p;
  const before = readings.filter((r) => r.t < target).at(-1),
    after = readings.find((r) => r.t > target);
  if (!before || !after || after.t - before.t > 3600000 * 1.1) return null;
  return (
    before.p +
    ((after.p - before.p) * (target - before.t)) / (after.t - before.t)
  );
}
