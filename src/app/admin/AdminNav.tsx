'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Orders', href: '/admin' },
  { label: 'Menu', href: '/admin/menu' },
  { label: 'Ingredients', href: '/admin/ingredients' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Recipes', href: '/admin/recipes' },
  { label: 'Stats', href: '/admin/stats' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {navLinks.map(({ label, href }) => {
        const isActive =
          href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-lavender text-violet font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-violet'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
