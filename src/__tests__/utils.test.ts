// Utility functions extracted for testing

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function getNextMonday(from: Date = new Date()): string {
  const today = new Date(from)
  today.setHours(0, 0, 0, 0)
  const day = today.getDay()
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return next.toISOString().split('T')[0]
}

function formatPrice(price: number): string {
  return `$${Number(price).toFixed(2)}`
}

function calcRemaining(weeklyQty: number, ordered: number): number {
  return Math.max(0, weeklyQty - ordered)
}

// --- slugify ---
describe('slugify', () => {
  it('lowercases the string', () => {
    expect(slugify('Chocolate Chip')).toBe('chocolate-chip')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('gluten free cookies')).toBe('gluten-free-cookies')
  })

  it('strips special characters', () => {
    expect(slugify("Gracey's Cookies!")).toBe('graceys-cookies')
  })

  it('handles already-lowercase input', () => {
    expect(slugify('brownies')).toBe('brownies')
  })

  it('trims leading and trailing spaces', () => {
    expect(slugify('  oat cookies  ')).toBe('oat-cookies')
  })
})

// --- getNextMonday ---
describe('getNextMonday', () => {
  it('returns a Monday when given a Sunday', () => {
    const sunday = new Date('2025-03-16') // a Sunday
    const result = getNextMonday(sunday)
    const day = new Date(result + 'T00:00:00').getDay()
    expect(day).toBe(1)
  })

  it('returns the following Monday when given a Monday', () => {
    const monday = new Date(2025, 2, 17) // Mon Mar 17 2025 (local time, no TZ shift)
    const result = getNextMonday(monday)
    const day = new Date(result + 'T00:00:00').getDay()
    expect(day).toBe(1) // still a Monday
    expect(result).not.toBe('2025-03-17') // must be a future Monday
  })

  it('returns a date in YYYY-MM-DD format', () => {
    const result = getNextMonday(new Date('2025-03-18'))
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// --- formatPrice ---
describe('formatPrice', () => {
  it('formats whole numbers with two decimals', () => {
    expect(formatPrice(5)).toBe('$5.00')
  })

  it('formats decimal prices correctly', () => {
    expect(formatPrice(12.5)).toBe('$12.50')
  })

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })
})

// --- calcRemaining ---
describe('calcRemaining', () => {
  it('returns difference when ordered is less than weekly qty', () => {
    expect(calcRemaining(24, 10)).toBe(14)
  })

  it('returns 0 when fully sold out', () => {
    expect(calcRemaining(24, 24)).toBe(0)
  })

  it('returns 0 when over-ordered (never negative)', () => {
    expect(calcRemaining(24, 30)).toBe(0)
  })

  it('returns full qty when nothing ordered', () => {
    expect(calcRemaining(12, 0)).toBe(12)
  })
})

// --- getInitials ---
function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

describe('getInitials', () => {
  it('returns first+last initials when both names present', () => {
    expect(getInitials('Grace', 'Smith')).toBe('GS')
  })

  it('returns single initial when only first name', () => {
    expect(getInitials('Grace', undefined)).toBe('G')
  })

  it('falls back to email initial when no name', () => {
    expect(getInitials(undefined, undefined, 'grace@example.com')).toBe('G')
  })

  it('returns ? when nothing provided', () => {
    expect(getInitials()).toBe('?')
  })

  it('uppercases the result', () => {
    expect(getInitials('grace', 'smith')).toBe('GS')
  })
})
