'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { CartItem } from '@/lib/types'

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('cart')
      if (stored) setCart(JSON.parse(stored))
    } catch {
      setCart([])
    }
  }, [])

  function saveCart(updated: CartItem[]) {
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('cart-updated'))
  }

  function updateQuantity(productId: string, delta: number) {
    const updated = cart
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(0, Math.min(12, item.quantity + delta)) }
          : item
      )
      .filter((item) => item.quantity > 0)
    saveCart(updated)
  }

  function removeItem(productId: string) {
    saveCart(cart.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-lavender rounded w-48" />
          <div className="h-24 bg-lavender rounded" />
          <div className="h-24 bg-lavender rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold text-violet mb-8">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🛒</p>
          <p className="font-body text-gray-500 text-lg mb-6">Your cart is empty.</p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Cart items */}
          <div className="flex flex-col gap-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-white border border-blush rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-14 h-14 rounded-xl bg-lavender flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🍪</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-violet truncate">
                      {item.product.name}
                    </p>
                    <p className="font-body text-sm text-gray-500">
                      ${Number(item.product.price).toFixed(2)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  {/* Quantity controls */}
                  <div className="flex items-center border border-blush-dark rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-violet hover:bg-lavender transition-colors font-bold"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center font-body font-medium text-gray-900 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-violet hover:bg-lavender transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-display font-bold text-gold w-16 text-right">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtotal */}
          <div className="border-t border-blush pt-4 flex justify-between items-center">
            <span className="font-body text-lg font-medium text-gray-700">Subtotal</span>
            <span className="font-display text-2xl font-bold text-gold">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-violet border border-violet rounded-lg hover:bg-lavender transition-colors"
            >
              &larr; Continue Shopping
            </Link>
            <Link href="/checkout">
              <Button variant="primary" size="lg">
                Proceed to Checkout &rarr;
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
