'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CartCount } from './CartCount'
import { useAuth } from '@/lib/auth-context'

function getInitials(user: { user_metadata?: { first_name?: string; last_name?: string }; email?: string } | null): string {
  if (!user) return ''
  const { first_name, last_name } = user.user_metadata ?? {}
  if (first_name && last_name) return `${first_name[0]}${last_name[0]}`.toUpperCase()
  if (first_name) return first_name[0].toUpperCase()
  return (user.email?.[0] ?? '?').toUpperCase()
}

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Our Story', href: '/our-story' },
]

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, openAuthModal } = useAuth()

  function AccountButton({ mobile }: { mobile?: boolean }) {
    const base = 'flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 transition-colors'
    if (!user) {
      return (
        <button
          type="button"
          onClick={() => { openAuthModal(); if (mobile) setMenuOpen(false) }}
          className={`${base} bg-lavender text-violet border border-[#e9d5ff] hover:bg-[#e9d5ff]`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Sign in
        </button>
      )
    }
    return (
      <Link
        href="/account"
        onClick={() => { if (mobile) setMenuOpen(false) }}
        className={`${base} bg-[#ede9fe] text-violet border border-[#c4b5fd] hover:bg-[#ddd6fe]`}
      >
        <span className="w-5 h-5 rounded-full bg-violet text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {getInitials(user)}
        </span>
        My Account
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blush shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold text-violet hover:text-violet-dark transition-colors"
        >
          GF Gracey&apos;s Cookies
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
            >
              {label}
            </Link>
          ))}
          <AccountButton />
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

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-blush px-4 pb-4 flex flex-col gap-2">
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
          <div className="pt-1">
            <AccountButton mobile />
          </div>
        </div>
      )}
    </header>
  )
}
