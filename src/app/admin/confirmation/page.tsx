import { createAdminClient } from '@/lib/supabase/admin'
import { WeekNav } from '@/app/admin/WeekNav'
import ConfirmationTable from './ConfirmationTable'

function getCurrentMonday(): string {
  const today = new Date()
  const day = today.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

type PageProps = {
  searchParams: Promise<{ week?: string }>
}

export default async function ConfirmationPage({ searchParams }: PageProps) {
  const { week: weekParam } = await searchParams
  const week = weekParam ?? getCurrentMonday()

  const admin = createAdminClient()
  const { data: orders, error } = await admin
    .from('orders')
    .select('*, order_items(id, quantity, unit_price, products(name))')
    .eq('status', 'ready')
    .eq('pickup_week', week)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load orders: {error.message}</p>
      </div>
    )
  }

  const sentCount = (orders ?? []).filter(o => o.confirmation_sent_at !== null).length
  const unsentCount = (orders ?? []).length - sentCount

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-violet mb-6">
        Confirmation
      </h1>
      <WeekNav currentWeek={week} />
      <div className="mt-6">
        <ConfirmationTable
          orders={orders ?? []}
          week={week}
          sentCount={sentCount}
          unsentCount={unsentCount}
        />
      </div>
    </div>
  )
}
