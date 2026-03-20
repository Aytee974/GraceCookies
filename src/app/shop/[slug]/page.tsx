import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/Badge'
import { AddToCart } from '@/components/AddToCart'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let product = null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('available', true)
      .single()
    product = data
  } catch {
    product = null
  }

  if (!product) {
    notFound()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/shop"
        className="inline-flex items-center gap-1 font-body text-sm text-violet hover:text-violet-dark transition-colors mb-8"
      >
        &larr; Back to Shop
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Image */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-lavender border border-blush">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">🍪</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="font-display text-4xl font-bold text-violet leading-tight flex-1">
              {product.name}
            </h1>
            <Badge label={product.category} variant="category" />
          </div>

          <p className="font-display text-3xl font-bold text-gold">
            ${Number(product.price).toFixed(2)}
          </p>

          {product.description && (
            <p className="font-body text-gray-700 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="border-t border-blush pt-5">
            <AddToCart product={product} />
          </div>

          <p className="font-body text-xs text-gray-400">
            Orders close Sunday. Fresh pickup the following week.
          </p>
        </div>
      </div>
    </div>
  )
}
