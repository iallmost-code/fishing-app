import type { WeatherSnapshot } from '../services/weather'

export type PressureTrend = {
  oneHour: number
  threeHour: number
  sixHour: number
  label: 'Rapidly Falling' | 'Falling' | 'Stable' | 'Rising' | 'Rapidly Rising'
}

export type ScoreResult = {
  score: number
  label: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent'
  reasons: { text: string; impact: number }[]
  pressure: PressureTrend
}

function closestIndex(times: string[], targetMs: number) {
  let best = 0
  let distance = Infinity
  times.forEach((time, i) => {
    const d = Math.abs(new Date(time).getTime() - targetMs)
    if (d < distance) { distance = d; best = i }
  })
  return best
}

export function analyzePressure(weather: WeatherSnapshot): PressureTrend {
  const now = new Date(weather.current.time).getTime()
  const times = weather.hourly.map(h => h.time)
  const current = weather.current.pressureHpa
  const delta = (hours: number) => current - weather.hourly[closestIndex(times, now - hours * 3600000)].pressureHpa

  const oneHour = delta(1)
  const threeHour = delta(3)
  const sixHour = delta(6)
  const rate = threeHour / 3

  let label: PressureTrend['label'] = 'Stable'
  if (rate <= -1.2) label = 'Rapidly Falling'
  else if (rate <= -0.25) label = 'Falling'
  else if (rate >= 1.2) label = 'Rapidly Rising'
  else if (rate >= 0.25) label = 'Rising'

  return { oneHour, threeHour, sixHour, label }
}

function timeProximityScore(time: string, sunrise?: string, sunset?: string) {
  const t = new Date(time).getTime()
  const anchors = [sunrise, sunset].filter(Boolean).map(v => new Date(v!).getTime())
  if (!anchors.length) return 0
  const hours = Math.min(...anchors.map(a => Math.abs(a - t) / 3600000))
  if (hours <= 1) return 12
  if (hours <= 2) return 8
  if (hours <= 3) return 4
  return 0
}

export function calculateFishingScore(weather: WeatherSnapshot): ScoreResult {
  const pressure = analyzePressure(weather)
  const reasons: ScoreResult['reasons'] = []
  let score = 48

  const trendImpact = pressure.label === 'Falling' ? 14
    : pressure.label === 'Rapidly Falling' ? 8
    : pressure.label === 'Stable' ? 6
    : pressure.label === 'Rising' ? 1
    : -5
  score += trendImpact
  reasons.push({ text: `${pressure.label} pressure`, impact: trendImpact })

  const wind = weather.current.windMph
  const windImpact = wind >= 4 && wind <= 12 ? 10 : wind > 20 ? -10 : wind > 12 ? 3 : 2
  score += windImpact
  reasons.push({ text: `${wind.toFixed(0)} mph wind`, impact: windImpact })

  const clouds = weather.current.cloudCover
  const cloudImpact = clouds >= 45 && clouds <= 90 ? 9 : clouds > 90 ? 5 : 1
  score += cloudImpact
  reasons.push({ text: `${clouds.toFixed(0)}% cloud cover`, impact: cloudImpact })

  const lightImpact = timeProximityScore(weather.current.time, weather.sunrise, weather.sunset)
  score += lightImpact
  if (lightImpact) reasons.push({ text: 'Near a low-light feeding window', impact: lightImpact })

  const rainImpact = weather.current.precipitation > 0 ? 2 : 0
  score += rainImpact

  score = Math.max(0, Math.min(100, Math.round(score)))
  const label: ScoreResult['label'] = score >= 85 ? 'Excellent'
    : score >= 70 ? 'Very Good'
    : score >= 50 ? 'Good'
    : score >= 30 ? 'Fair'
    : 'Poor'

  return { score, label, reasons: reasons.sort((a,b) => Math.abs(b.impact)-Math.abs(a.impact)), pressure }
}

export function hourlyFishingScore(hour: WeatherSnapshot['hourly'][number], pressureDelta: number) {
  let score = 46
  if (pressureDelta < -0.25) score += 12
  else if (pressureDelta > 1.0) score -= 5
  else score += 5

  if (hour.windMph >= 4 && hour.windMph <= 12) score += 10
  else if (hour.windMph > 20) score -= 10

  if (hour.cloudCover >= 45 && hour.cloudCover <= 90) score += 9
  if (hour.precipitationChance >= 20 && hour.precipitationChance <= 65) score += 5

  return Math.max(0, Math.min(100, Math.round(score)))
}
