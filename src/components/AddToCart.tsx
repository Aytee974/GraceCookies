'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Product, CartItem } from '@/lib/types'

interface AddToCartProps {
  product: Product
}

export function AddToCart({ product }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    try {
      const stored = localStorage.getItem('cart')
      const cart: CartItem[] = stored ? JSON.parse(stored) : []
      const existing = cart.find((item) => item.product.id === product.id)
      if (existing) {
        existing.quantity = Math.min(12, existing.quantity + quantity)
      } else {
        cart.push({ product, quantity })
      }
      localStorage.setItem('cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cart-updated'))
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="font-body text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center border border-blush-dark rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-violet hover:bg-lavender transition-colors font-bold text-lg"
            aria-label="Decrease quantity"
          >
            &minus;
          </button>
          <span className="w-10 text-center font-body font-medium text-gray-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(12, q + 1))}
            className="w-10 h-10 flex items-center justify-center text-violet hover:bg-lavender transition-colors font-bold text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={handleAdd} className="w-full sm:w-auto">
        {added ? '✓ Added to Cart!' : 'Add to Cart'}
      </Button>

      {added && (
        <p className="font-body text-sm text-green-600">
          Added {quantity} {quantity === 1 ? 'item' : 'items'} to your cart.
        </p>
      )}
    </div>
  )
}
