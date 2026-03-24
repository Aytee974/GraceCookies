'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'
import { updateOrderStatus } from '@/app/actions/orders'
import type { Order, OrderItemWithProduct } from '@/lib/types'

type OrderWithItems = Order & {
  order_items: OrderItemWithProduct[]
}

function statusBadgeVariant(status: Order['status']): 'ready' | 'pending' | 'fulfilled' {
  if (status === 'paid') return 'pending'
  if (status === 'ready') return 'ready'
  return 'fulfilled'
}

function OrderRow({
  order,
  isExpanded,
  onToggle,
}: {
  order: OrderWithItems
  isExpanded: boolean
  onToggle: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 font-medium text-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs select-none">
              {isExpanded ? '▼' : '▶'}
            </span>
            {order.customer_name}
          </div>
        </td>
        <td className="px-4 py-3 text-gray-600">{order.customer_email}</td>
        <td className="px-4 py-3 text-gray-600">{order.customer_phone}</td>
        <td className="px-4 py-3 text-right text-gray-700">{order.order_items.length}</td>
        <td className="px-4 py-3 text-right text-gray-700">${Number(order.total).toFixed(2)}</td>
        <td className="px-4 py-3">
          <Badge
            label={order.status}
            variant="status"
            status={statusBadgeVariant(order.status)}
          />
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="border-b border-[#ede9fe] p-0">
            <div className="bg-[#f5f3ff] border-t border-[#ede9fe] px-6 py-4">
              <p className="text-xs font-semibold text-[#7c3aed] uppercase tracking-wide mb-3">
                Items Ordered
              </p>
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.products.name}
                    </span>
                    <span className="text-gray-500">${Number(item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {(order.status === 'paid' || order.status === 'ready') && (
                <div className="mt-4">
                  <button
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation()
                      startTransition(() =>
                        updateOrderStatus(order.id, order.status === 'paid' ? 'ready' : 'fulfilled')
                      )
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#7c3aed] rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                  >
                    {isPending
                      ? 'Updating…'
                      : order.status === 'paid'
                      ? 'Mark Ready'
                      : 'Mark Fulfilled'}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

interface OrdersTableProps {
  orders: OrderWithItems[]
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
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
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() => toggleRow(order.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
