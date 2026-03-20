import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { WeekNav } from './WeekNav'
import { OrderActions } from './OrderActions'
import type { Order, OrderItem } from '@/lib/types'

function getCurrentMonday(): string {
  const today = new Date()
  const day = today.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

function statusBadgeVariant(status: Order['status']): 'ready' | 'pending' | 'fulfilled' {
  if (status === 'paid') return 'pending'
  if (status === 'ready') return 'ready'
  return 'fulfilled'
}

type OrderWithItems = Order & { item_count: number }

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
      .select('*, order_items(id)')
      .eq('pickup_week', week)
      .in('status', ['paid', 'ready', 'fulfilled'])
      .order('created_at', { ascending: true })

    if (error) {
      fetchError = error.message
    } else {
      orders = (data ?? []).map((o: Order & { order_items: { id: string }[] }) => ({
        ...o,
        item_count: o.order_items?.length ?? 0,
      }))
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Items</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.customer_name}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customer_email}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customer_phone}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{order.item_count}</td>
                  <td className="px-4 py-3 text-right text-gray-700">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      label={order.status}
                      variant="status"
                      status={statusBadgeVariant(order.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(order.status === 'paid' || order.status === 'ready') && (
                      <OrderActions orderId={order.id} status={order.status} />
                    )}
                    {order.status === 'fulfilled' && (
                      <span className="text-xs text-gray-400">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
