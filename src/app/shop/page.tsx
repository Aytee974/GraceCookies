import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryFilter } from '@/components/CategoryFilter'
import { getNextMondayUTC } from '@/lib/menu-utils'
import type { Product } from '@/lib/types'

type MenuEntry = {
  product_id: string
  quantity_limit: number | null
}

export default async function ShopPage() {
  let products: Product[] = []
  let remainingMap: Record<string, number> = {}

  try {
    const admin = createAdminClient()
    const nextMonday = getNextMondayUTC()

    // Fetch this week's menu entries
    const { data: entries, error: entriesError } = await admin
      .from('weekly_menu')
      .select('product_id, quantity_limit')
      .eq('pickup_week', nextMonday)

    if (entriesError) throw entriesError

    const menuEntries: MenuEntry[] = entries ?? []
    if (menuEntries.length === 0) {
      // No menu configured for this week — show empty shop
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <h1 className="font-display text-4xl font-bold text-violet mb-2">Our Cookies</h1>
            <p className="font-body text-gray-600">Freshly baked, gluten-free, and made with love every week.</p>
          </div>
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🍪</p>
            <p className="font-body text-gray-500 text-lg">Products coming soon — check back later!</p>
          </div>
        </div>
      )
    }

    const productIds = menuEntries.map((e) => e.product_id)
    const entryMap = new Map(menuEntries.map((e) => [e.product_id, e]))

    // Fetch the products that are on the menu and still available (not discontinued)
    const { data, error: productsError } = await admin
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('available', true)
      .order('name')

    if (productsError) throw productsError
    products = data ?? []

    // Sold-out tracking: use weekly_menu.quantity_limit
    const limitedProducts = products.filter(
      (p) => (entryMap.get(p.id)?.quantity_limit ?? null) !== null
    )

    if (limitedProducts.length > 0) {
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
        const limit = entryMap.get(p.id)!.quantity_limit!
        remainingMap[p.id] = Math.max(0, limit - (orderedMap[p.id] ?? 0))
      }
    }
  } catch {
    products = []
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold text-violet mb-2">Our Cookies</h1>
        <p className="font-body text-gray-600">Freshly baked, gluten-free, and made with love every week.</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🍪</p>
          <p className="font-body text-gray-500 text-lg">Products coming soon — check back later!</p>
        </div>
      ) : (
        <CategoryFilter products={products} remainingMap={remainingMap} />
      )}
    </div>
  )
}
