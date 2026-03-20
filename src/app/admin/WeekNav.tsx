'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-CA', {
    timeZone: 'UTC',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

interface WeekNavProps {
  currentWeek: string
}

export function WeekNav({ currentWeek }: WeekNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(week: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', week)
    router.push(`${pathname}?${params.toString()}`)
  }

  const prevWeek = addDays(currentWeek, -7)
  const nextWeek = addDays(currentWeek, 7)

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={() => navigate(prevWeek)}>
        &larr; Prev
      </Button>
      <span className="text-sm font-medium text-gray-700 min-w-[160px] text-center">
        Week of {formatWeek(currentWeek)}
      </span>
      <Button variant="secondary" size="sm" onClick={() => navigate(nextWeek)}>
        Next &rarr;
      </Button>
    </div>
  )
}
