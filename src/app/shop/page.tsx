import { createClient } from '@/lib/supabase/server'
import { CategoryFilter } from '@/components/CategoryFilter'
import type { Product } from '@/lib/types'

export default async function ShopPage() {
  let products: Product[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('name')
    products = data ?? []
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
        <CategoryFilter products={products} />
      )}
    </div>
  )
}
