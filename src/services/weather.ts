export type WeatherHour = {
  time: string
  temperature: number
  pressureHpa: number
  cloudCover: number
  windMph: number
  windDirection: number
  precipitationChance: number
}

export type WeatherSnapshot = {
  latitude: number
  longitude: number
  timezone: string
  current: {
    time: string
    temperature: number
    apparentTemperature: number
    pressureHpa: number
    cloudCover: number
    windMph: number
    windDirection: number
    precipitation: number
    weatherCode: number
  }
  hourly: WeatherHour[]
  sunrise?: string
  sunset?: string
}

const API = 'https://api.open-meteo.com/v1/forecast'

export async function getWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: 'auto',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    past_hours: '6',
    forecast_days: '2',
    current: [
      'temperature_2m',
      'apparent_temperature',
      'pressure_msl',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation',
      'weather_code'
    ].join(','),
    hourly: [
      'temperature_2m',
      'pressure_msl',
      'cloud_cover',
      'wind_speed_10m',
      'wind_direction_10m',
      'precipitation_probability'
    ].join(','),
    daily: 'sunrise,sunset'
  })

  const response = await fetch(`${API}?${params.toString()}`)
  if (!response.ok) throw new Error(`Weather request failed (${response.status})`)
  const data = await response.json()

  const hourly: WeatherHour[] = data.hourly.time.map((time: string, i: number) => ({
    time,
    temperature: data.hourly.temperature_2m[i],
    pressureHpa: data.hourly.pressure_msl[i],
    cloudCover: data.hourly.cloud_cover[i],
    windMph: data.hourly.wind_speed_10m[i],
    windDirection: data.hourly.wind_direction_10m[i],
    precipitationChance: data.hourly.precipitation_probability[i] ?? 0,
  }))

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      pressureHpa: data.current.pressure_msl,
      cloudCover: data.current.cloud_cover,
      windMph: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
    },
    hourly,
    sunrise: data.daily?.sunrise?.[0],
    sunset: data.daily?.sunset?.[0],
  }
}

export const hpaToInHg = (hpa: number) => hpa * 0.0295299830714

export function degreesToCompass(deg: number) {
  const points = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return points[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}
