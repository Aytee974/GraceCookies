// Pure date/aggregation helpers for the admin stats page.
// No I/O — all functions are safe to unit test.

export type WeekAggregate = {
  week: string         // YYYY-MM-DD
  revenue: number
  orderCount: number
}

export type ProductSale = {
  productId: string
  productName: string
  totalQty: number
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns the `count` most recent Mondays (incl. current week) as YYYY-MM-DD, ascending. */
export function getPastMondays(count: number): string[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Day 0=Sun,1=Mon,...,6=Sat.  We want the Monday of the current week.
  const dayOfWeek = today.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - daysToSubtract)

  const result: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(thisMonday)
    d.setDate(thisMonday.getDate() - i * 7)
    result.push(toLocalDateString(d))
  }
  return result
}

/** Splits an array of weeks in half: first half = previous period, second = current. */
export function splitPeriods<T>(weeks: T[]): { prev: T[]; curr: T[] } {
  const mid = Math.floor(weeks.length / 2)
  return { prev: weeks.slice(0, mid), curr: weeks.slice(mid) }
}

/** Aggregates an array of order rows by pickup_week. */
export function aggregateByWeek(
  orders: { pickup_week: string; total: number | string; id: string }[]
): Record<string, WeekAggregate> {
  const map: Record<string, WeekAggregate> = {}
  for (const o of orders) {
    if (!map[o.pickup_week]) {
      map[o.pickup_week] = { week: o.pickup_week, revenue: 0, orderCount: 0 }
    }
    map[o.pickup_week].revenue += Number(o.total)
    map[o.pickup_week].orderCount += 1
  }
  return map
}

/** Aggregates order_item rows by product, sorted descending by qty. */
export function computeProductSales(
  items: { product_id: string; product_name: string; quantity: number }[]
): ProductSale[] {
  const map: Record<string, ProductSale> = {}
  for (const item of items) {
    if (!map[item.product_id]) {
      map[item.product_id] = {
        productId: item.product_id,
        productName: item.product_name,
        totalQty: 0,
      }
    }
    map[item.product_id].totalQty += item.quantity
  }
  return Object.values(map).sort((a, b) => b.totalQty - a.totalQty)
}
