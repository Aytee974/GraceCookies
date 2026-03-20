'use client'

import { useState } from 'react'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/lib/types'

const CATEGORIES = ['All', 'Cookies', 'Other']

interface CategoryFilterProps {
  products: Product[]
}

export function CategoryFilter({ products }: CategoryFilterProps) {
  const [active, setActive] = useState('All')

  const filtered =
    active === 'All'
      ? products
      : products.filter(
          (p) => p.category.toLowerCase() === active.toLowerCase()
        )

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 border ${
              active === cat
                ? 'bg-violet text-white border-violet'
                : 'bg-white text-violet border-lavender-dark hover:bg-lavender'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🍪</p>
          <p className="font-body text-gray-500">No products in this category yet.</p>
        </div>
      )}
    </div>
  )
}
