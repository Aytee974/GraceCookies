'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [4, 8, 12] as const

export function RangeSelector({ current }: { current: 4 | 8 | 12 }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function select(weeks: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('weeks', String(weeks))
    router.push(`/admin/stats?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
      {OPTIONS.map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => select(n)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            current === n
              ? 'bg-violet text-white'
              : 'bg-white text-gray-600 hover:bg-lavender hover:text-violet'
          }`}
        >
          {n} weeks
        </button>
      ))}
    </div>
  )
}
