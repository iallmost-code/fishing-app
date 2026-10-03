export type FishingWindow = {
  start: string;
  end: string;
  averageScore: number;
  peakScore: number;
  hours: number;
};
export type WindowConfig = {
  minimumScore: number;
  peakTolerance: number;
  minimumHours: number;
};
export const WINDOW_CONFIG: WindowConfig = {
  minimumScore: 70,
  peakTolerance: 10,
  minimumHours: 2,
};
export function getFishingWindows(
  input: { time: string; score: number }[],
  config = WINDOW_CONFIG,
): FishingWindow[] {
  const hours = input
    .filter(
      (h) => Number.isFinite(Date.parse(h.time)) && Number.isFinite(h.score),
    )
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (!hours.length) return [];
  const threshold = Math.max(
    config.minimumScore,
    Math.max(...hours.map((h) => h.score)) - config.peakTolerance,
  );
  const windows: FishingWindow[] = [];
  let group: typeof hours = [];
  const flush = () => {
    if (group.length >= config.minimumHours)
      windows.push({
        start: group[0].time,
        end: new Date(
          Date.parse(group[group.length - 1].time) + 3600000,
        ).toISOString(),
        averageScore: Math.round(
          group.reduce((sum, h) => sum + h.score, 0) / group.length,
        ),
        peakScore: Math.max(...group.map((h) => h.score)),
        hours: group.length,
      });
    group = [];
  };
  for (const hour of hours) {
    if (
      group.length &&
      Date.parse(hour.time) - Date.parse(group[group.length - 1].time) !==
        3600000
    )
      flush();
    if (hour.score >= threshold) group.push(hour);
    else flush();
  }
  flush();
  return windows
    .sort(
      (a, b) =>
        b.averageScore - a.averageScore ||
        b.peakScore - a.peakScore ||
        Date.parse(a.start) - Date.parse(b.start),
    )
    .slice(0, 2);
}
