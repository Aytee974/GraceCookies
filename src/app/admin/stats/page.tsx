import { createAdminClient } from '@/lib/supabase/admin'
import { RangeSelector } from './RangeSelector'
import {
  getPastMondays,
  splitPeriods,
  aggregateByWeek,
  computeProductSales,
  type WeekAggregate,
  type ProductSale,
} from '@/lib/stats'

interface Props {
  searchParams: Promise<{ weeks?: string }>
}

export default async function StatsPage({ searchParams }: Props) {
  const params = await searchParams
  const weeks = Number(params.weeks ?? '8')
  const rangeWeeks = [4, 8, 12].includes(weeks) ? weeks : 8

  // Fetch double the weeks so we can compare current vs previous period
  const allWeeks = getPastMondays(rangeWeeks * 2)
  const { prev: prevWeeks, curr: currWeeks } = splitPeriods(allWeeks)

  const admin = createAdminClient()
  const VALID_STATUSES = ['paid', 'ready', 'fulfilled']

  // Fetch orders for all weeks (both periods)
  const { data: ordersRaw } = await admin
    .from('orders')
    .select('id, pickup_week, total, status')
    .in('pickup_week', allWeeks)
    .in('status', VALID_STATUSES)

  const orders = ordersRaw ?? []

  // Fetch order_items for current period only.
  // Two-step: get current-period order IDs first, then filter order_items.
  const currOrderIds = orders
    .filter((o) => currWeeks.includes(o.pickup_week))
    .map((o) => o.id)

  const { data: itemsRaw } = currOrderIds.length > 0
    ? await admin
        .from('order_items')
        .select('quantity, product_id, products(name)')
        .in('order_id', currOrderIds)
    : { data: [] }

  // Normalize items shape
  const items = (itemsRaw ?? []).map((row: any) => ({
    product_id: row.product_id,
    product_name: row.products?.name ?? 'Unknown',
    quantity: row.quantity,
  }))

  // Split orders by period
  const currOrders = orders.filter((o) => currWeeks.includes(o.pickup_week))
  const prevOrders = orders.filter((o) => prevWeeks.includes(o.pickup_week))

  // Aggregates
  const currByWeek = aggregateByWeek(currOrders)
  const prevByWeek = aggregateByWeek(prevOrders)
  const topProducts = computeProductSales(items).slice(0, 5)

  // KPI: current period
  const currRevenue = currOrders.reduce((s, o) => s + Number(o.total), 0)
  const currOrderCount = currOrders.length
  const currAOV = currOrderCount > 0 ? currRevenue / currOrderCount : 0

  // KPI: previous period
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total), 0)
  const prevOrderCount = prevOrders.length
  const prevAOV = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0

  // Best week in current period
  const weekAggList: WeekAggregate[] = currWeeks.map((w) =>
    currByWeek[w] ?? { week: w, revenue: 0, orderCount: 0 }
  )
  const bestWeekAgg = weekAggList.reduce(
    (best, agg) => (agg.revenue > best.revenue ? agg : best),
    weekAggList[0]
  )

  // Delta helpers
  function delta(curr: number, prev: number): string {
    if (prev === 0) return '—'
    const pct = ((curr - prev) / prev) * 100
    return pct >= 0 ? `↑ ${pct.toFixed(0)}%` : `↓ ${Math.abs(pct).toFixed(0)}%`
  }
  function deltaClass(curr: number, prev: number): string {
    if (prev === 0) return 'text-gray-400'
    return curr >= prev ? 'text-green-600' : 'text-red-500'
  }

  // Bar chart scale: height proportional to max value, max bar height 160px
  const maxRevenue = Math.max(...weekAggList.map((w) => w.revenue), 1)
  const maxAOV = Math.max(
    ...weekAggList.map((w) =>
      w.orderCount > 0 ? w.revenue / w.orderCount : 0
    ),
    1
  )

  function barHeight(value: number, max: number): number {
    return Math.round((value / max) * 160)
  }

  function fmtWeekLabel(iso: string): string {
    const d = new Date(iso + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: `$${currRevenue.toFixed(2)}`,
      delta: delta(currRevenue, prevRevenue),
      deltaClass: deltaClass(currRevenue, prevRevenue),
    },
    {
      label: 'Total Orders',
      value: String(currOrderCount),
      delta: delta(currOrderCount, prevOrderCount),
      deltaClass: deltaClass(currOrderCount, prevOrderCount),
    },
    {
      label: 'Avg Order Value',
      value: `$${currAOV.toFixed(2)}`,
      delta: delta(currAOV, prevAOV),
      deltaClass: deltaClass(currAOV, prevAOV),
    },
    {
      label: 'Best Week',
      value: bestWeekAgg ? fmtWeekLabel(bestWeekAgg.week) : '—',
      delta:
        bestWeekAgg
          ? `$${bestWeekAgg.revenue.toFixed(2)} · ${bestWeekAgg.orderCount} orders`
          : '—',
      deltaClass: 'text-gray-500',
    },
  ]

  const topQty = topProducts[0]?.totalQty ?? 1

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-3xl font-bold text-violet">Statistics</h1>
        <RangeSelector current={rangeWeeks as 4 | 8 | 12} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="font-body text-xs text-gray-500 uppercase tracking-wide mb-1">
              {kpi.label}
            </p>
            <p className="font-display text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`font-body text-xs mt-1 ${kpi.deltaClass}`}>{kpi.delta}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue bar chart — wide */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-gray-800 mb-6">
            Weekly Revenue
          </h2>
          <div className="flex items-end gap-2" style={{ height: 200 }}>
            {weekAggList.map((agg) => {
              const isBest = agg.week === bestWeekAgg?.week
              const h = barHeight(agg.revenue, maxRevenue)
              return (
                <div key={agg.week} className="flex flex-col items-center flex-1 min-w-0">
                  <span className="font-body text-xs text-gray-500 mb-1 truncate w-full text-center">
                    ${agg.revenue > 0 ? agg.revenue.toFixed(0) : '0'}
                  </span>
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: h || 2,
                      backgroundColor: isBest ? '#d4af37' : '#7c3aed',
                    }}
                  />
                  <span className="font-body text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {fmtWeekLabel(agg.week)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Best-selling products — narrow */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold text-gray-800 mb-6">
            Best Sellers
          </h2>
          {topProducts.length === 0 ? (
            <p className="font-body text-sm text-gray-400">No data for this period.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {topProducts.map((p, i) => (
                <div key={p.productId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-body text-sm font-bold flex-shrink-0"
                        style={{ color: '#d4af37' }}
                      >
                        #{i + 1}
                      </span>
                      <span className="font-body text-sm text-gray-700 truncate">
                        {p.productName}
                      </span>
                    </div>
                    <span className="font-body text-sm font-semibold text-gray-600 flex-shrink-0 ml-2">
                      {p.totalQty}
                    </span>
                  </div>
                  <div className="h-1.5 bg-lavender rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(p.totalQty / topQty) * 100}%`,
                        backgroundColor: '#7c3aed',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AOV trend — full width */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-gray-800 mb-6">
          Avg Order Value Trend
        </h2>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {weekAggList.map((agg) => {
            const aov = agg.orderCount > 0 ? agg.revenue / agg.orderCount : 0
            const isBest = agg.week === bestWeekAgg?.week
            const h = barHeight(aov, maxAOV)
            return (
              <div key={agg.week} className="flex flex-col items-center flex-1 min-w-0">
                <span className="font-body text-xs text-gray-500 mb-1 truncate w-full text-center">
                  {aov > 0 ? `$${aov.toFixed(0)}` : '—'}
                </span>
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: h || 2,
                    backgroundColor: isBest ? '#7c3aed' : '#ddd6fe',
                  }}
                />
                <span className="font-body text-xs text-gray-400 mt-1 truncate w-full text-center">
                  {fmtWeekLabel(agg.week)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
