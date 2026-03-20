import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const { token } = await searchParams

  if (!token || typeof token !== 'string') {
    notFound()
  }

  let order = null
  let items: Array<{
    id: string
    quantity: number
    unit_price: number
    products: { name: string } | null
  }> = []

  try {
    const admin = createAdminClient()

    const { data: orderData } = await admin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!orderData || orderData.access_token !== token) {
      notFound()
    }

    order = orderData

    const { data: itemsData } = await admin
      .from('order_items')
      .select('id, quantity, unit_price, products(name)')
      .eq('order_id', id)

    items = (itemsData as unknown as typeof items) ?? []
  } catch {
    notFound()
  }

  if (!order) notFound()

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00')
    return d.toLocaleDateString('en-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending Payment',
    paid: 'Payment Received',
    ready: 'Ready for Pickup',
    fulfilled: 'Fulfilled',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Thank you header */}
      <div
        className="rounded-3xl px-8 py-10 text-center mb-8"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <p className="text-5xl mb-4">🍪</p>
        <h1 className="font-display text-4xl font-bold text-violet mb-2">
          Thank you, {order.customer_name.split(' ')[0]}!
        </h1>
        <p className="font-body text-gray-600">
          Your order has been placed. We&apos;ll have it fresh and ready for you.
        </p>
      </div>

      {/* Order details card */}
      <div className="bg-white border border-blush rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-blush flex items-center justify-between">
          <div>
            <p className="font-body text-xs text-gray-500 uppercase tracking-wide">Order ID</p>
            <p className="font-body text-sm font-mono text-gray-700">{order.id}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              order.status === 'paid'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : order.status === 'ready'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : order.status === 'fulfilled'
                ? 'bg-gray-100 text-gray-600 border border-gray-200'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
            }`}
          >
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>

        {/* Items */}
        <div className="px-6 py-4 border-b border-blush">
          <h2 className="font-display text-lg font-semibold text-violet mb-3">
            Items Ordered
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-body text-sm font-medium text-gray-800">
                    {item.products?.name ?? 'Product'}
                  </p>
                  <p className="font-body text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-body text-sm font-semibold text-gray-800">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Total & pickup */}
        <div className="px-6 py-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <span className="font-body font-medium text-gray-700">Total Paid</span>
            <span className="font-display text-xl font-bold text-gold">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-sm text-gray-500">Pickup Week</span>
            <span className="font-body text-sm font-medium text-violet">
              {formatDate(order.pickup_week)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-sm text-gray-500">Confirmation email</span>
            <span className="font-body text-sm font-medium text-gray-700">
              {order.customer_email}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
