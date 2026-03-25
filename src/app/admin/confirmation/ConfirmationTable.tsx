'use client'

import { useState, useTransition } from 'react'
import { sendConfirmationEmail, sendAllConfirmationEmails } from '@/app/actions/orders'
import { Order, OrderItemWithProduct } from '@/lib/types'

type OrderWithItems = Order & {
  order_items: OrderItemWithProduct[]
}

type Props = {
  orders: OrderWithItems[]
  week: string
  sentCount: number
  unsentCount: number
}

export default function ConfirmationTable({ orders, week, sentCount, unsentCount }: Props) {
  const [isPending, startTransition] = useTransition()
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [batchResult, setBatchResult] = useState<{ sent: number; failed: number } | null>(null)

  function handleSend(orderId: string) {
    setRowErrors(prev => ({ ...prev, [orderId]: '' }))
    startTransition(async () => {
      const result = await sendConfirmationEmail(orderId)
      if (!result.success) {
        setRowErrors(prev => ({
          ...prev,
          [orderId]: result.error === 'already_sent'
            ? 'Already sent.'
            : 'Failed to send — please try again.',
        }))
      }
    })
  }

  function handleSendAll() {
    setBatchResult(null)
    startTransition(async () => {
      const result = await sendAllConfirmationEmails(week)
      setBatchResult(result)
    })
  }

  function formatSentAt(ts: string) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ' at '
      + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function formatItems(items: OrderItemWithProduct[]) {
    return items.map(i => `${i.quantity}× ${i.products.name}`).join(' · ')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            {unsentCount} ready · {sentCount} already notified
          </p>
          {batchResult && (
            <p className="text-xs text-gray-500 mt-0.5">
              {batchResult.sent} sent
              {batchResult.failed > 0 && `, ${batchResult.failed} failed — please retry failed orders individually`}
            </p>
          )}
        </div>
        {unsentCount > 0 && (
          <button
            onClick={handleSendAll}
            disabled={isPending}
            className="bg-violet text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            Send All Remaining ({unsentCount})
          </button>
        )}
      </div>

      {orders.length === 0 && (
        <p className="p-6 text-gray-500 text-sm">No ready orders for this week.</p>
      )}
      {orders.map(order => {
        const sent = order.confirmation_sent_at !== null
        return (
          <div
            key={order.id}
            className={`flex justify-between items-center px-4 py-3 border-b border-gray-100 last:border-0 ${sent ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                {sent ? (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">✓ Sent</span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">Not sent</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {order.customer_email}
                {sent && order.confirmation_sent_at && (
                  <span> · notified {formatSentAt(order.confirmation_sent_at)}</span>
                )}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {formatItems(order.order_items)} · ${Number(order.total).toFixed(2)}
              </p>
              {rowErrors[order.id] && (
                <p className="text-xs text-red-600 mt-1">{rowErrors[order.id]}</p>
              )}
            </div>
            <button
              onClick={() => handleSend(order.id)}
              disabled={sent || isPending}
              className={`ml-4 text-sm font-semibold px-4 py-1.5 rounded-lg whitespace-nowrap ${
                sent
                  ? 'bg-transparent text-gray-400 border border-gray-200 cursor-not-allowed'
                  : 'bg-violet text-white hover:bg-violet/90 disabled:opacity-50'
              }`}
            >
              {sent ? 'Already sent' : 'Send Email →'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
