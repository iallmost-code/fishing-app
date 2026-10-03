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
    // Never substitute a distant hour or bridge missing pressure readings.
    const previous = hours.find(
      (h) =>
        Math.abs(Date.parse(h.time) - target) <= 20 * 60000 &&
        h.pressureHpa !== null,
    );
    return current !== null && previous?.pressureHpa != null
      ? current - previous.pressureHpa
      : null;
  };
  const oneHour = delta(1),
    threeHour = delta(3),
    sixHour = delta(6);
  const rate = threeHour !== null ? threeHour / 3 : oneHour;
  return { oneHour, threeHour, sixHour, rate, label: classifyPressure(rate) };
}
