import Link from 'next/link'
import { CartCount } from './CartCount'

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blush shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold text-violet hover:text-violet-dark transition-colors"
        >
          GF Gracey&apos;s Cookies
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/shop"
            className="font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
          >
            Shop
          </Link>

          <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-violet transition-colors">
            <span className="text-xl" aria-label="Cart">🛒</span>
            <CartCount />
          </Link>
        </div>
      </nav>
    </header>
  )
}
