const RAD = Math.PI / 180

/** NOAA approximation; result in minutes. */
export function equationOfTime(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const day = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000)
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60
  const gamma = (2 * Math.PI / 365) * (day - 1 + (hour - 12) / 24)
  return 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
}

export function timezoneOffsetMinutes(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).reduce<Record<string, string>>((out, p) => (out[p.type] = p.value, out), {})
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return Math.round((asUtc - date.getTime()) / 60000)
}

export function solarData(now: Date, latitude: number, longitude: number, timeZone: string) {
  const eot = equationOfTime(now)
  const zoneOffset = timezoneOffsetMinutes(now, timeZone)
  const local = new Date(now.getTime() + zoneOffset * 60000)
  const localMinutes = local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60
  const solarMinutes = ((localMinutes + eot + 4 * longitude - zoneOffset) % 1440 + 1440) % 1440
  const solarNoon = 720 - 4 * longitude - eot + zoneOffset
  return {
    solarMinutes,
    solarNoon,
    thermalPeak: solarNoon + 180,
    kmPerSolarMinute: 40075 * Math.cos(latitude * RAD) / 1440,
    equationOfTime: eot
  }
}

export function minutesToClock(total: number, withSeconds = false) {
  const normalized = ((total % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60)
  const m = Math.floor(normalized % 60)
  const s = Math.floor((normalized - Math.floor(normalized)) * 60)
  return [h, m, s].slice(0, withSeconds ? 3 : 2).map(v => String(v).padStart(2, '0')).join(':')
}
