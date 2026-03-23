'use client'

import { useState, useTransition } from 'react'
import { toggleMenuEntry, updateMenuQuantity } from '@/app/actions/menu'
import type { Product } from '@/lib/types'

interface MenuEntry {
  quantity_limit: number | null
}

interface MenuToggleRowProps {
  product: Product
  entry: MenuEntry | null  // null = not on this week's menu
  week: string             // YYYY-MM-DD
}

export function MenuToggleRow({ product, entry, week }: MenuToggleRowProps) {
  const isOn = entry !== null
  const [quantityValue, setQuantityValue] = useState(
    entry?.quantity_limit != null ? String(entry.quantity_limit) : ''
  )
  const [rowError, setRowError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    setRowError(null)
    startTransition(async () => {
      const result = await toggleMenuEntry(week, product.id, !isOn)
      if (result.error) {
        setRowError(result.error)
      } else if (!isOn) {
        // Pre-fill quantity from product default when turning on
        setQuantityValue(product.weekly_quantity > 0 ? String(product.weekly_quantity) : '')
      }
    })
  }

  function handleQuantityBlur() {
    if (!isOn) return
    setRowError(null)
    const trimmed = quantityValue.trim()
    if (trimmed === '') {
      startTransition(async () => {
        const result = await updateMenuQuantity(week, product.id, null)
        if (result.error) setRowError(result.error)
      })
      return
    }
    const parsed = parseInt(trimmed, 10)
    if (isNaN(parsed) || parsed < 0 || !Number.isInteger(Number(trimmed))) {
      setRowError('Quantity must be 0 or greater, or blank for unlimited.')
      return
    }
    startTransition(async () => {
      const result = await updateMenuQuantity(week, product.id, parsed)
      if (result.error) setRowError(result.error)
    })
  }

  return (
    <>
      <tr
        className={`border-b border-gray-50 transition-colors ${
          isOn ? 'hover:bg-gray-50' : 'opacity-50'
        }`}
      >
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{product.name}</div>
        </td>
        <td className="px-4 py-3">
          <span className="text-xs bg-lavender text-violet rounded px-2 py-0.5 font-medium">
            {product.category}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
              isOn ? 'bg-violet' : 'bg-gray-300'
            }`}
            aria-label={isOn ? 'Remove from menu' : 'Add to menu'}
          >
            <span
              className={`block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${
                isOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </td>
        <td className="px-4 py-3 text-center">
          {isOn ? (
            <input
              type="number"
              min="0"
              value={quantityValue}
              onChange={(e) => setQuantityValue(e.target.value)}
              onBlur={handleQuantityBlur}
              placeholder="∞"
              step="1"
              disabled={isPending}
              className="w-20 rounded-lg border border-blush-dark px-2 py-1 text-sm text-center focus:outline-none focus:border-blush focus:ring-2 focus:ring-blush/50"
            />
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>
      </tr>
      {rowError && (
        <tr>
          <td colSpan={4} className="px-4 pb-2">
            <p className="text-xs text-red-600">{rowError}</p>
          </td>
        </tr>
      )}
    </>
  )
}
