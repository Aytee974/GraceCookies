import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProductCard } from '@/components/ProductCard'
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

export default async function HomePage() {
  let featuredProducts: Product[] = []
  let remainingMap: Record<string, number> = {}

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: false })
      .limit(4)
    featuredProducts = data ?? []

    const limitedProducts = featuredProducts.filter((p) => p.weekly_quantity > 0)
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
    featuredProducts = []
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-violet max-w-3xl leading-tight mb-6">
          Handmade cookies &amp; treats, baked fresh every week.
        </h1>
        <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-lg mb-8">
          <Image
            src="/cookies-hero.jpg"
            alt="Freshly baked cookies"
            width={1200}
            height={800}
            className="w-full h-64 sm:h-80 object-cover"
            priority
          />
        </div>
        <p className="font-body text-lg text-gray-600 max-w-xl mb-10">
          Gluten-free, made with love. Order by Sunday, pick up the following week.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-xl bg-gold text-white hover:bg-gold-dark transition-colors duration-150 shadow-md"
        >
          Shop Now &rarr;
        </Link>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl font-bold text-violet mb-8 text-center">
          Featured Treats
        </h2>
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} remaining={remainingMap[product.id]} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍪</p>
            <p className="font-body text-gray-500">
              Products coming soon &mdash; check back later!
            </p>
          </div>
        )}
        {featuredProducts.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg border border-violet text-violet hover:bg-violet hover:text-white transition-colors duration-150"
            >
              See All Products
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-lavender py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-violet mb-12 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: '🛍️',
                title: 'Browse & Order',
                description:
                  'Choose your favourite cookies and add them to your cart. Place your order by Sunday night.',
              },
              {
                step: '2',
                icon: '💳',
                title: 'Pay Securely',
                description:
                  'Checkout safely with Stripe. Your payment is encrypted and secure.',
              },
              {
                step: '3',
                icon: '📦',
                title: 'Pick Up Weekly',
                description:
                  'Pick up your fresh-baked order during your chosen pickup week.',
              },
            ].map(({ step, icon, title, description }) => (
              <div
                key={step}
                className="bg-white rounded-2xl p-8 text-center border border-blush shadow-sm"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold text-white text-sm font-bold mb-3">
                  {step}
                </div>
                <h3 className="font-display text-xl font-semibold text-violet mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
