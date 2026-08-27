import { describe, expect, it } from 'vitest'
import { minutesToClock, solarData } from './solar'

describe('solar calculations', () => {
  it('places Greenwich solar noon close to 12:00 near an equinox', () => {
    const data = solarData(new Date('2026-03-20T12:00:00Z'), 51.48, 0, 'UTC')
    expect(data.solarNoon).toBeGreaterThan(710)
    expect(data.solarNoon).toBeLessThan(730)
  })
  it('formats wrapped clock values', () => expect(minutesToClock(1500)).toBe('01:00'))
})
