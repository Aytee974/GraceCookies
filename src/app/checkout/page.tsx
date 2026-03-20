'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { placeOrder } from '@/app/actions/checkout'
import type { CartItem } from '@/lib/types'

function getNextMondays(count: number): Date[] {
  const mondays: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const firstMonday = new Date(today)
  firstMonday.setDate(today.getDate() + daysUntilMonday)
  for (let i = 0; i < count; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i * 7)
    mondays.push(d)
  }
  return mondays
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function formatWeek(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')
  return d.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const pickupWeeks = getNextMondays(4).map(toISODate)
  const [pickupWeek, setPickupWeek] = useState(pickupWeeks[0])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('cart')
      if (stored) setCart(JSON.parse(stored))
    } catch {
      setCart([])
    }
  }, [])

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await placeOrder({
      cart,
      firstName,
      lastName,
      email,
      phone,
      pickupWeek,
    })

    setLoading(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    // Clear cart and redirect to Stripe
    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cart-updated'))
    router.push(result.url)
  }

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-lavender rounded w-48" />
          <div className="h-48 bg-lavender rounded" />
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="font-body text-gray-500 text-lg mb-4">Your cart is empty.</p>
        <a href="/shop" className="text-violet underline">Browse products</a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold text-violet mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white border border-blush rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-violet mb-4">
              Your Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Grace"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Smith"
              />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          {/* Pickup week */}
          <div className="bg-white border border-blush rounded-2xl p-6 shadow-sm">
            <h2 className="font-display text-xl font-semibold text-violet mb-4">
              Pickup Week
            </h2>
            <div className="flex flex-col gap-3">
              {pickupWeeks.map((week) => (
                <label
                  key={week}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    pickupWeek === week
                      ? 'border-violet bg-lavender'
                      : 'border-blush-dark hover:bg-lavender/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pickupWeek"
                    value={week}
                    checked={pickupWeek === week}
                    onChange={() => setPickupWeek(week)}
                    className="accent-violet"
                  />
                  <span className="font-body text-sm font-medium text-gray-700">
                    Week of {formatWeek(week)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="font-body text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Redirecting to payment...' : 'Place Order & Pay →'}
          </Button>
        </form>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-blush rounded-2xl p-6 shadow-sm sticky top-24">
            <h2 className="font-display text-xl font-semibold text-violet mb-4">
              Order Summary
            </h2>
            <div className="flex flex-col gap-3 mb-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-medium text-gray-800 truncate">
                      {item.product.name}
                    </p>
                    <p className="font-body text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-body text-sm font-semibold text-gray-800 flex-shrink-0">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-blush pt-3 flex justify-between">
              <span className="font-body font-medium text-gray-700">Total</span>
              <span className="font-display text-xl font-bold text-gold">
                ${subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
