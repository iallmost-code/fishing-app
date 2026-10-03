import { useEffect, useMemo, useState } from 'react'
import { MapPin, Wind, Cloud, Gauge, Sunrise, Sunset, LocateFixed, RefreshCw } from 'lucide-react'
import { getWeather, hpaToInHg, degreesToCompass, type WeatherSnapshot } from './services/weather'
import { calculateFishingScore, hourlyFishingScore } from './engine/fishingScore'
import { getLureRecommendations } from './engine/lureRecommendations'

type LocationState = {
  latitude: number
  longitude: number
  source: 'gps' | 'fallback'
}

const MONROE_FALLBACK: LocationState = { latitude: 33.7948, longitude: -83.7132, source: 'fallback' }

function formatClock(value?: string) {
  if (!value) return 'Unavailable'
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatHour(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric' })
}

function locate(): Promise<LocationState> {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(MONROE_FALLBACK)
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: 'gps' }),
      () => resolve(MONROE_FALLBACK),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    )
  })
}

export default function App() {
  const [location, setLocation] = useState<LocationState | null>(null)
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null)
  const [status, setStatus] = useState('Finding your location…')
  const [error, setError] = useState<string | null>(null)

  async function refresh(forceLocation = false) {
    try {
      setError(null)
      setStatus('Loading live conditions…')
      const loc = forceLocation || !location ? await locate() : location
      setLocation(loc)
      const result = await getWeather(loc.latitude, loc.longitude)
      setWeather(result)
      setStatus('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load live conditions.')
      setStatus('')
    }
  }

  useEffect(() => { void refresh(true) }, [])

  const score = useMemo(() => weather ? calculateFishingScore(weather) : null, [weather])
  const lures = useMemo(() => weather && score ? getLureRecommendations(weather, score.pressure) : [], [weather, score])

  const forecastHours = useMemo(() => {
    if (!weather) return []
    const now = new Date(weather.current.time).getTime()
    const upcoming = weather.hourly.filter(h => new Date(h.time).getTime() >= now).slice(0, 8)
    return upcoming.map((hour, i) => {
      const prev = weather.hourly[Math.max(0, weather.hourly.indexOf(hour) - 3)]
      const delta = hour.pressureHpa - prev.pressureHpa
      return { ...hour, score: hourlyFishingScore(hour, delta), i }
    })
  }, [weather])

  const bestHour = forecastHours.reduce<typeof forecastHours[number] | null>(
    (best, h) => !best || h.score > best.score ? h : best,
    null,
  )

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-top">
          <div>
            <div className="eyebrow"><MapPin size={15}/> {location?.source === 'gps' ? 'Live GPS location' : 'Monroe fallback location'}</div>
            <h1>Fishing Companion</h1>
            <p className="coords">{location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Locating…'}</p>
          </div>
          <button className="round-btn" onClick={() => void refresh(true)} aria-label="Refresh location and weather">
            <LocateFixed size={22}/>
          </button>
        </div>

        {status && <div className="status"><RefreshCw className="spin" size={16}/>{status}</div>}
        {error && <div className="error">{error}</div>}

        {weather && score && (
          <div className="score-panel">
            <div className="score-ring" style={{'--score': `${score.score * 3.6}deg`} as React.CSSProperties}>
              <div className="score-core">
                <strong>{score.score}</strong>
                <span>{score.label}</span>
              </div>
            </div>
            <div className="score-copy">
              <h2>{score.score >= 70 ? '🔥 Good time to fish' : score.score >= 50 ? '🎣 Worth a shot' : '🌊 Tougher bite'}</h2>
              <p>{score.reasons[0]?.text}. {score.reasons[1]?.text}.</p>
              <div className="chips">
                <span><Gauge size={15}/>{hpaToInHg(weather.current.pressureHpa).toFixed(2)} inHg</span>
                <span><Wind size={15}/>{degreesToCompass(weather.current.windDirection)} {weather.current.windMph.toFixed(0)} mph</span>
                <span><Cloud size={15}/>{weather.current.cloudCover.toFixed(0)}%</span>
                <span>{weather.current.temperature.toFixed(0)}°F</span>
              </div>
            </div>
          </div>
        )}
      </header>

      {weather && score && (
        <div className="content">
          <section className="prime-card">
            <div>
              <span>BEST UPCOMING HOUR</span>
              <strong>{bestHour ? formatHour(bestHour.time) : 'Unavailable'}</strong>
              <small>{bestHour ? `Fishing score ${bestHour.score}/100` : 'Forecast unavailable'}</small>
            </div>
            <div className="sun-times">
              <span><Sunrise size={17}/> {formatClock(weather.sunrise)}</span>
              <span><Sunset size={17}/> {formatClock(weather.sunset)}</span>
            </div>
          </section>

          <section className="card">
            <div className="section-head">
              <div>
                <span className="kicker">LIVE TREND</span>
                <h3>Barometric pressure</h3>
              </div>
              <span className="trend-badge">{score.pressure.label}</span>
            </div>
            <div className="pressure-grid">
              <div><small>1 hour</small><strong>{score.pressure.oneHour >= 0 ? '+' : ''}{score.pressure.oneHour.toFixed(1)} hPa</strong></div>
              <div><small>3 hours</small><strong>{score.pressure.threeHour >= 0 ? '+' : ''}{score.pressure.threeHour.toFixed(1)} hPa</strong></div>
              <div><small>6 hours</small><strong>{score.pressure.sixHour >= 0 ? '+' : ''}{score.pressure.sixHour.toFixed(1)} hPa</strong></div>
            </div>
          </section>

          <section className="card">
            <div className="section-head"><div><span className="kicker">NEXT 8 HOURS</span><h3>Fishing forecast</h3></div></div>
            <div className="hour-strip">
              {forecastHours.map(hour => (
                <div className="hour" key={hour.time}>
                  <span>{formatHour(hour.time)}</span>
                  <div className="mini-score">{hour.score}</div>
                  <small>{hour.temperature.toFixed(0)}°</small>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-head"><div><span className="kicker">BASED ON CONDITIONS</span><h3>What to throw</h3></div></div>
            <div className="lure-list">
              {lures.map((lure, i) => (
                <article className="lure" key={lure.name}>
                  <div className="rank">#{i + 1}</div>
                  <div>
                    <h4>{lure.name}</h4>
                    <p><b>{lure.color}</b> • {lure.retrieve}</p>
                    <p>{lure.target}</p>
                    <small>{lure.reason}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="section-head"><div><span className="kicker">WHY THIS SCORE</span><h3>Condition breakdown</h3></div></div>
            <div className="reason-list">
              {score.reasons.map(reason => (
                <div className="reason" key={reason.text}>
                  <span>{reason.text}</span>
                  <strong className={reason.impact >= 0 ? 'positive' : 'negative'}>{reason.impact >= 0 ? '+' : ''}{reason.impact}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <footer>
        Live weather data updates from the selected location. Fishing scores are guidance, not a guarantee.
      </footer>
    </main>
  )
}
