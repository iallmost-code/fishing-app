export type WeatherHour = {
  time: string;
  temperature: number | null;
  pressureHpa: number | null;
  cloudCover: number | null;
  windMph: number | null;
  windDirection: number | null;
  precipitationChance: number | null;
  weatherCode: number | null;
};
export type WeatherDay = {
  date: string;
  time: string;
  high: number | null;
  low: number | null;
  weatherCode: number | null;
  windMph: number | null;
  precipitationChance: number | null;
  sunrise?: string;
  sunset?: string;
};
export type WeatherSnapshot = {
  latitude: number;
  longitude: number;
  timezone: string;
  fetchedAt: string;
  current: {
    time: string;
    temperature: number | null;
    apparentTemperature: number | null;
    pressureHpa: number | null;
    cloudCover: number | null;
    windMph: number | null;
    windDirection: number | null;
    precipitation: number | null;
    precipitationChance: number | null;
    weatherCode: number | null;
  };
  hourly: WeatherHour[];
  daily: WeatherDay[];
  sunrise?: string;
  sunset?: string;
};
const API = "https://api.open-meteo.com/v1/forecast";
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const timestamp = (v: unknown): string | undefined =>
  typeof v === "number" && Number.isFinite(v)
    ? new Date(v * 1000).toISOString()
    : undefined;
export function normalizeWeather(data: any): WeatherSnapshot {
  if (
    !Array.isArray(data.hourly?.time) ||
    !data.current?.time ||
    !data.timezone
  )
    throw new Error(
      "The weather service returned an incomplete forecast. Please retry.",
    );
  const timezone = data.timezone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new Error("The weather service returned an invalid timezone.");
  }
  const dayKey = (v: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(v));
  const hourly: WeatherHour[] = data.hourly.time
    .flatMap((t: unknown, i: number) => {
      const time = timestamp(t);
      return time
        ? [
            {
              time,
              temperature: number(data.hourly.temperature_2m?.[i]),
              pressureHpa: number(data.hourly.pressure_msl?.[i]),
              cloudCover: number(data.hourly.cloud_cover?.[i]),
              windMph: number(data.hourly.wind_speed_10m?.[i]),
              windDirection: number(data.hourly.wind_direction_10m?.[i]),
              precipitationChance: number(
                data.hourly.precipitation_probability?.[i],
              ),
              weatherCode: number(data.hourly.weather_code?.[i]),
            },
          ]
        : [];
    })
    .sort(
      (a: WeatherHour, b: WeatherHour) =>
        Date.parse(a.time) - Date.parse(b.time),
    );
  const currentTime = timestamp(data.current.time)!;
  const currentHour = hourly.find(
    (h) =>
      Date.parse(h.time) <= Date.parse(currentTime) &&
      Date.parse(h.time) + 3600000 > Date.parse(currentTime),
  );
  const daily: WeatherDay[] = (data.daily?.time ?? []).flatMap(
    (t: unknown, i: number) => {
      const time = timestamp(t);
      return time
        ? [
            {
              date: dayKey(time),
              time,
              high: number(data.daily.temperature_2m_max?.[i]),
              low: number(data.daily.temperature_2m_min?.[i]),
              weatherCode: number(data.daily.weather_code?.[i]),
              windMph: number(data.daily.wind_speed_10m_max?.[i]),
              precipitationChance: number(
                data.daily.precipitation_probability_max?.[i],
              ),
              sunrise: timestamp(data.daily.sunrise?.[i]),
              sunset: timestamp(data.daily.sunset?.[i]),
            },
          ]
        : [];
    },
  );
  const today = daily.find((d) => d.date === dayKey(currentTime));
  const c = data.current;
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone,
    fetchedAt: new Date().toISOString(),
    current: {
      time: currentTime,
      temperature: number(c.temperature_2m),
      apparentTemperature: number(c.apparent_temperature),
      pressureHpa: number(c.pressure_msl),
      cloudCover: number(c.cloud_cover),
      windMph: number(c.wind_speed_10m),
      windDirection: number(c.wind_direction_10m),
      precipitation: number(c.precipitation),
      precipitationChance: currentHour?.precipitationChance ?? null,
      weatherCode: number(c.weather_code),
    },
    hourly,
    daily,
    sunrise: today?.sunrise,
    sunset: today?.sunset,
  };
}
export async function getWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "auto",
    timeformat: "unixtime",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    past_hours: "12",
    forecast_days: "7",
    current:
      "temperature_2m,apparent_temperature,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,weather_code",
    hourly:
      "temperature_2m,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation_probability,weather_code",
    daily:
      "sunrise,sunset,temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,precipitation_probability_max",
  });
  const response = await fetch(`${API}?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new Error(
      `Weather request failed (${response.status}). Please retry.`,
    );
  return normalizeWeather(await response.json());
}
export const hpaToInHg = (hpa: number) => hpa * 0.0295299830714;
export function degreesToCompass(deg: number | null) {
  if (deg === null || !Number.isFinite(deg)) return "Unavailable";
  const points = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return points[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}
