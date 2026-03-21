'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CartCount } from './CartCount'

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Our Story', href: '/our-story' },
]

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blush shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold text-violet hover:text-violet-dark transition-colors"
        >
          GF Gracey&apos;s Cookies
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-violet transition-colors">
            <span className="text-xl" aria-label="Cart">🛒</span>
            <CartCount />
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-violet transition-colors">
            <span className="text-xl" aria-label="Cart">🛒</span>
            <CartCount />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="text-gray-500 hover:text-violet p-1"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-blush px-4 pb-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
