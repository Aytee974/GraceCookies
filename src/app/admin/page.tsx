import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { WeekNav } from './WeekNav'
import { OrdersTable } from './OrdersTable'
import type { Order, OrderItemWithProduct } from '@/lib/types'

function getCurrentMonday(): string {
  const today = new Date()
  const day = today.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

type OrderWithItems = Order & { order_items: OrderItemWithProduct[] }

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { week: weekParam } = await searchParams
  const week = weekParam ?? getCurrentMonday()

  let orders: OrderWithItems[] = []
  let fetchError: string | null = null

  try {
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('orders')
      .select('*, order_items(id, quantity, unit_price, products(name))')
      .eq('pickup_week', week)
      .in('status', ['paid', 'ready', 'fulfilled'])
      .order('created_at', { ascending: true })

    if (error) {
      fetchError = error.message
    } else {
      orders = (data ?? []) as OrderWithItems[]
    }
  } catch {
    fetchError = 'Could not connect to database.'
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-violet">Orders</h1>
        <Suspense fallback={<div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />}>
          <WeekNav currentWeek={week} />
        </Suspense>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Orders</p>
          <p className="text-2xl font-bold text-violet">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-violet">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-6">
          {fetchError}
        </div>
      )}

      {orders.length === 0 && !fetchError ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No orders for this week.</p>
        </div>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  )
}
