import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/ProductCard'
import type { Product } from '@/lib/types'

export default async function HomePage() {
  let featuredProducts: Product[] = []

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: false })
      .limit(4)
    featuredProducts = data ?? []
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
              <ProductCard key={product.id} product={product} />
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
