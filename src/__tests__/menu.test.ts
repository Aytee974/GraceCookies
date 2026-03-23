// Pure helper — copied from src/app/actions/menu.ts for unit testing
// (same pattern as utils.test.ts)

function getNextMondayUTC(from: Date = new Date()): string {
  const day = from.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(from)
  next.setUTCDate(from.getUTCDate() + daysUntil)
  return next.toISOString().split('T')[0]
}

// --- getNextMondayUTC ---
describe('getNextMondayUTC', () => {
  it('returns next Monday from a Sunday (UTC)', () => {
    const sunday = new Date('2025-03-16T00:00:00Z') // Sunday
    expect(getNextMondayUTC(sunday)).toBe('2025-03-17')
  })

  it('returns the following Monday when given a Monday', () => {
    const monday = new Date('2025-03-17T00:00:00Z')
    expect(getNextMondayUTC(monday)).toBe('2025-03-24')
  })

  it('returns next Monday from a Wednesday', () => {
    const wednesday = new Date('2025-03-19T00:00:00Z')
    expect(getNextMondayUTC(wednesday)).toBe('2025-03-24')
  })

  it('returns next Monday from a Saturday', () => {
    const saturday = new Date('2025-03-22T00:00:00Z')
    expect(getNextMondayUTC(saturday)).toBe('2025-03-24')
  })

  it('returns a YYYY-MM-DD string', () => {
    const result = getNextMondayUTC(new Date('2025-03-19T00:00:00Z'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
