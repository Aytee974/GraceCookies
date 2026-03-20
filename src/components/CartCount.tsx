'use client'

import { useEffect, useState } from 'react'
import type { CartItem } from '@/lib/types'

export function CartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function updateCount() {
      try {
        const stored = localStorage.getItem('cart')
        if (stored) {
          const items: CartItem[] = JSON.parse(stored)
          setCount(items.reduce((sum, item) => sum + item.quantity, 0))
        } else {
          setCount(0)
        }
      } catch {
        setCount(0)
      }
    }

    updateCount()
    window.addEventListener('storage', updateCount)
    window.addEventListener('cart-updated', updateCount)
    return () => {
      window.removeEventListener('storage', updateCount)
      window.removeEventListener('cart-updated', updateCount)
    }
  }, [])

  if (count === 0) return null

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-gold text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}
