import {
  getPastMondays,
  splitPeriods,
  aggregateByWeek,
  computeProductSales,
} from '@/lib/stats'

describe('getPastMondays', () => {
  it('returns the requested number of Mondays', () => {
    const result = getPastMondays(4)
    expect(result).toHaveLength(4)
  })

  it('returns strings in YYYY-MM-DD format', () => {
    const result = getPastMondays(4)
    result.forEach((d) => expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/))
  })

  it('returns dates in ascending order', () => {
    const result = getPastMondays(4)
    for (let i = 1; i < result.length; i++) {
      expect(result[i] > result[i - 1]).toBe(true)
    }
  })

  it('all returned dates are Mondays (day index 1)', () => {
    const result = getPastMondays(8)
    result.forEach((d) => {
      const day = new Date(d + 'T00:00:00').getDay()
      expect(day).toBe(1)
    })
  })

  it('includes current week Monday', () => {
    // The most recent Monday should be <= today
    const result = getPastMondays(4)
    const last = new Date(result[result.length - 1] + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expect(last.getTime()).toBeLessThanOrEqual(today.getTime())
  })
})

describe('splitPeriods', () => {
  it('splits an even list in half', () => {
    const weeks = ['a', 'b', 'c', 'd']
    const { prev, curr } = splitPeriods(weeks)
    expect(prev).toEqual(['a', 'b'])
    expect(curr).toEqual(['c', 'd'])
  })
})

describe('aggregateByWeek', () => {
  const orders = [
    { pickup_week: '2026-03-02', total: 50, id: '1' },
    { pickup_week: '2026-03-02', total: 30, id: '2' },
    { pickup_week: '2026-03-09', total: 80, id: '3' },
  ]

  it('groups by pickup_week', () => {
    const result = aggregateByWeek(orders)
    expect(result['2026-03-02'].orderCount).toBe(2)
    expect(result['2026-03-09'].orderCount).toBe(1)
  })

  it('sums revenue per week', () => {
    const result = aggregateByWeek(orders)
    expect(result['2026-03-02'].revenue).toBeCloseTo(80)
    expect(result['2026-03-09'].revenue).toBeCloseTo(80)
  })
})

describe('computeProductSales', () => {
  const items = [
    { product_id: 'p1', product_name: 'Chocolate Chip', quantity: 3 },
    { product_id: 'p1', product_name: 'Chocolate Chip', quantity: 2 },
    { product_id: 'p2', product_name: 'Snickerdoodle', quantity: 5 },
  ]

  it('sums quantities per product', () => {
    const result = computeProductSales(items)
    const p1 = result.find((r) => r.productId === 'p1')
    expect(p1?.totalQty).toBe(5)
  })

  it('returns results sorted by quantity descending', () => {
    const result = computeProductSales(items)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].totalQty).toBeLessThanOrEqual(result[i - 1].totalQty)
    }
  })
})
