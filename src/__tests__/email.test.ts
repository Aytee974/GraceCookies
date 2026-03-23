// Pure helper functions — copied from src/lib/email.ts for unit testing
// (same pattern as utils.test.ts)

function getFirstName(customerName: string): string {
  return customerName.split(' ')[0]
}

function formatPickupWeekLabel(pickupWeek: string): string {
  // pickupWeek is YYYY-MM-DD, always a Monday
  const [year, month, day] = pickupWeek.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatLineItem(name: string, quantity: number, unitPrice: number): string {
  const label = `${name} ×${quantity}`
  const price = `$${(unitPrice * quantity).toFixed(2)}`
  const totalWidth = 42
  const padding = totalWidth - label.length - price.length
  return `  ${label}${' '.repeat(Math.max(1, padding))}${price}`
}

function calcSubtotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
}

// --- getFirstName ---
describe('getFirstName', () => {
  it('returns the first word of a full name', () => {
    expect(getFirstName('Grace Smith')).toBe('Grace')
  })

  it('returns the whole string if there is no space', () => {
    expect(getFirstName('Grace')).toBe('Grace')
  })

  it('handles names with multiple words', () => {
    expect(getFirstName('Grace Anne Smith')).toBe('Grace')
  })
})

// --- formatPickupWeekLabel ---
describe('formatPickupWeekLabel', () => {
  it('formats a Monday date as "Monday, March 24"', () => {
    expect(formatPickupWeekLabel('2025-03-24')).toBe('Monday, March 24')
  })

  it('formats a different Monday correctly', () => {
    expect(formatPickupWeekLabel('2025-01-06')).toBe('Monday, January 6')
  })
})

// --- formatLineItem ---
describe('formatLineItem', () => {
  it('includes the product name, quantity, and total price', () => {
    const line = formatLineItem('Chocolate Chip Cookie', 2, 7.00)
    expect(line).toContain('Chocolate Chip Cookie ×2')
    expect(line).toContain('$14.00')
  })

  it('includes the product name, quantity, and total price for a single item', () => {
    const line = formatLineItem('Snickerdoodle', 1, 7.00)
    expect(line).toContain('Snickerdoodle ×1')
    expect(line).toContain('$7.00')
  })
})

// --- calcSubtotal ---
describe('calcSubtotal', () => {
  it('sums quantity × unit_price across all items', () => {
    const items = [
      { quantity: 2, unit_price: 7.00 },
      { quantity: 1, unit_price: 7.00 },
    ]
    expect(calcSubtotal(items)).toBeCloseTo(21.00)
  })

  it('returns 0 for an empty order', () => {
    expect(calcSubtotal([])).toBe(0)
  })

  it('handles a single item', () => {
    expect(calcSubtotal([{ quantity: 3, unit_price: 5.50 }])).toBeCloseTo(16.50)
  })
})
