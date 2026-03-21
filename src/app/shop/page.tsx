import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryFilter } from '@/components/CategoryFilter'
import type { Product } from '@/lib/types'

function getNextMonday(): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = today.getDay()
  const daysUntil = day === 0 ? 1 : 8 - day
  const next = new Date(today)
  next.setDate(today.getDate() + daysUntil)
  return next.toISOString().split('T')[0]
}

export default async function ShopPage() {
  let products: Product[] = []
  let remainingMap: Record<string, number> = {}

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('name')
    products = data ?? []

    const limitedProducts = products.filter((p) => p.weekly_quantity > 0)
    if (limitedProducts.length > 0) {
      const admin = createAdminClient()
      const nextMonday = getNextMonday()
      const { data: items } = await admin
        .from('order_items')
        .select('product_id, quantity, orders!inner(pickup_week, status)')
        .in('product_id', limitedProducts.map((p) => p.id))
        .eq('orders.pickup_week', nextMonday)
        .in('orders.status', ['paid', 'ready', 'fulfilled'])

      const orderedMap: Record<string, number> = {}
      for (const item of items ?? []) {
        orderedMap[item.product_id] = (orderedMap[item.product_id] ?? 0) + item.quantity
      }

      for (const p of limitedProducts) {
        remainingMap[p.id] = Math.max(0, p.weekly_quantity - (orderedMap[p.id] ?? 0))
      }
    }
  } catch {
    products = []
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-violet mb-2">
          Our Cookies
        </h1>
        <p className="font-body text-gray-600">
          Freshly baked, gluten-free, and made with love every week.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🍪</p>
          <p className="font-body text-gray-500 text-lg">
            Products coming soon &mdash; check back later!
          </p>
        </div>
      ) : (
        <CategoryFilter products={products} remainingMap={remainingMap} />
      )}
    </div>
  )
}
