import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import tzlookup from 'tz-lookup'
import { getDictionary, languages, type Language } from './i18n'
import { minutesToClock, solarData } from './solar'

type Place = { name: string; latitude: number; longitude: number; timezone: string }
type SearchResult = { display_name: string; lat: string; lon: string; place_id: number }

const DEFAULT_PLACE: Place = { name: 'Bassano del Grappa, Italia', latitude: 45.7666, longitude: 11.7274, timezone: 'Europe/Rome' }
const languageFromBrowser = (): Language => {
  const code = navigator.language.slice(0, 2) as Language
  return code in languages ? code : 'en'
}

function SunMark() {
  return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="12"/><g><path d="M32 3v9M32 52v9M3 32h9M52 32h9M11.5 11.5l6.5 6.5M46 46l6.5 6.5M52.5 11.5L46 18M18 46l-6.5 6.5"/></g></svg>
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
}

function ClockIcon({ thermal = false }: { thermal?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d={thermal ? 'M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18M12 8v4l3 2' : 'M12 7v5l3 2'}/></svg>
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('sunny-language') as Language) || languageFromBrowser())
  const [place, setPlace] = useState<Place>(() => {
    try { return JSON.parse(localStorage.getItem('sunny-place') || '') } catch { return DEFAULT_PLACE }
  })
  const [now, setNow] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState<'geo' | 'search' | null>(null)
  const firstGeoRequest = useRef(false)
  const t = getDictionary(language)

  const useGeolocation = useCallback((automatic = false) => {
    if (!navigator.geolocation) { if (!automatic) setMessage(t.denied); return }
    setBusy('geo'); setMessage('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { name: `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}°`, latitude: coords.latitude, longitude: coords.longitude, timezone: tzlookup(coords.latitude, coords.longitude) }
        setPlace(next); localStorage.setItem('sunny-place', JSON.stringify(next)); setBusy(null)
      },
      () => { setBusy(null); if (!automatic) setMessage(t.denied) },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    )
  }, [t.denied])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    if (!localStorage.getItem('sunny-place') && !firstGeoRequest.current) { firstGeoRequest.current = true; useGeolocation(true) }
    return () => clearInterval(timer)
  }, [useGeolocation])

  useEffect(() => { document.documentElement.lang = language; localStorage.setItem('sunny-language', language) }, [language])

  const data = useMemo(() => solarData(now, place.latitude, place.longitude, place.timezone), [now, place])
  const localClock = new Intl.DateTimeFormat(language, { timeZone: place.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now)

  async function search(event: FormEvent) {
    event.preventDefault(); const clean = query.trim(); if (clean.length < 2) return
    setBusy('search'); setMessage(''); setResults([])
    const cacheKey = `sunny-search:${language}:${clean.toLowerCase()}`
    try {
      let found: SearchResult[]
      const cached = localStorage.getItem(cacheKey)
      if (cached) found = JSON.parse(cached)
      else {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.search = new URLSearchParams({ q: clean, format: 'jsonv2', limit: '5', addressdetails: '0', 'accept-language': language }).toString()
        const response = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error('geocoder')
        found = await response.json(); localStorage.setItem(cacheKey, JSON.stringify(found))
      }
      setResults(found); if (!found.length) setMessage(t.noResults)
    } catch { setMessage(t.errorSearch) } finally { setBusy(null) }
  }

  function choose(result: SearchResult) {
    const latitude = Number(result.lat), longitude = Number(result.lon)
    const next = { name: result.display_name, latitude, longitude, timezone: tzlookup(latitude, longitude) }
    setPlace(next); localStorage.setItem('sunny-place', JSON.stringify(next)); setResults([]); setQuery('')
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="SunnyTime"><span className="brand-mark"><SunMark /></span><span>Sunny<span>Time</span></span></a>
      <label className="language-select" aria-label="Language"><span>◎</span><select value={language} onChange={e => setLanguage(e.target.value as Language)}>{Object.entries(languages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </header>

    <section className="hero" id="top">
      <h1>{t.title}<br/><em>{t.titleAccent}</em></h1>
    </section>

    <section className="dashboard" aria-live="polite">
      <article className="solar-card">
        <div className="sun-orbit"><i className="ray ray-1"/><i className="ray ray-2"/><i className="ray ray-3"/><i className="ray ray-4"/><div className="sun-disc"><SunMark /></div></div>
        <span className="card-label">{t.solarTime}</span>
        <strong className="solar-clock">{minutesToClock(data.solarMinutes, true)}</strong>
        <div className="local-clock"><span>{t.localTime}</span><b>{localClock}</b></div>
        <div className="place-line"><PinIcon /><span title={place.name}>{place.name}</span></div>
      </article>

      <div className="metric-grid">
        <article className="metric-card"><div className="metric-icon"><ClockIcon /></div><div><span>{t.solarNoon}</span><strong>{minutesToClock(data.solarNoon)}</strong><small>{t.ground}</small></div></article>
        <article className="metric-card hot"><div className="metric-icon"><ClockIcon thermal /></div><div><span>{t.thermal}</span><strong>{minutesToClock(data.thermalPeak)}</strong><small>{t.air}</small></div></article>
        <article className="metric-card distance"><div className="metric-icon">↔</div><div><span>{t.distance}</span><strong>{data.kmPerSolarMinute.toFixed(1)} <i>{t.km}</i></strong><small>{t.along}</small></div></article>
      </div>
    </section>

    <section className="location-panel">
      <div className="section-title"><PinIcon /><h2>{t.location}</h2></div>
      <button className="geo-button" onClick={() => useGeolocation()} disabled={busy === 'geo'}><span>⌖</span>{busy === 'geo' ? t.locating : t.useLocation}</button>
      <div className="divider"><span>{t.or}</span></div>
      <form onSubmit={search} className="search-form">
        <label><span className="sr-only">{t.searchHint}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.placeholder} autoComplete="off" /><button disabled={busy === 'search'} aria-label={t.search}>{busy === 'search' ? '…' : '⌕'}</button></label>
      </form>
      <p className="hint">{message || t.searchHint}</p>
      {results.length > 0 && <div className="results" aria-label={t.select}>{results.map(result => <button key={result.place_id} onClick={() => choose(result)}><PinIcon /><span>{result.display_name}</span></button>)}</div>}
      <div className="location-meta"><span><b>{t.coords}</b>{place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°</span><span><b>{t.timezone}</b>{place.timezone.replace('_', ' ')}</span></div>
    </section>

    <aside className="notice">ⓘ <span>{t.info}</span></aside>
    <footer><span>SunnyTime · {new Date().getFullYear()}</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{t.footer}</a></footer>
  </main>
}
