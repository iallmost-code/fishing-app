export function formatNumber(
  value: number | null | undefined,
  digits = 0,
  unit = "",
) {
  return value != null && Number.isFinite(value)
    ? `${value.toFixed(digits)}${unit}`
    : "Unavailable";
}
export function formatClock(
  value: string | undefined,
  timezone: string,
  hourOnly = false,
) {
  if (!value || !Number.isFinite(Date.parse(value))) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    ...(hourOnly ? {} : { minute: "2-digit" }),
  }).format(new Date(value));
}
export function dateKey(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function formatDay(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
export function weatherDescription(code: number | null) {
  if (code === null) return "Conditions unavailable";
  if (code === 0) return "Clear skies";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}
