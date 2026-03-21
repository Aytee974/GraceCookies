import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
  remaining?: number
}

export function ProductCard({ product, remaining }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden p-0 hover:shadow-lg transition-shadow duration-200">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative w-full h-48 bg-lavender">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">🍪</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/shop/${product.slug}`}>
            <h3 className="font-display text-lg font-semibold text-violet hover:text-violet-dark transition-colors leading-tight">
              {product.name}
            </h3>
          </Link>
          <Badge label={product.category} variant="category" />
        </div>

        {product.description && (
          <p className="font-body text-sm text-gray-600 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        {remaining !== undefined && (
          <p className={`text-xs font-medium ${
            remaining === 0
              ? 'text-red-500'
              : remaining <= 5
              ? 'text-amber-600'
              : 'text-green-600'
          }`}>
            {remaining === 0 ? 'Sold out this week' : remaining <= 5 ? `Only ${remaining} left!` : `${remaining} left`}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="font-display text-xl font-bold text-gold">
            ${Number(product.price).toFixed(2)}
          </span>
          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors duration-150"
          >
            View
          </Link>
        </div>
      </div>
    </Card>
  )
}
