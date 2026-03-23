import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { WeekNav } from '@/app/admin/WeekNav'
import { MenuToggleRow } from './MenuToggleRow'
import { getNextMondayUTC } from '@/app/actions/menu'
import type { Product } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

type MenuEntry = {
  product_id: string
  quantity_limit: number | null
}

export default async function MenuPage({ searchParams }: PageProps) {
  const { week: weekParam } = await searchParams
  const week = weekParam ?? getNextMondayUTC()

  let products: Product[] = []
  let entries: MenuEntry[] = []
  let fetchError: string | null = null

  try {
    const admin = createAdminClient()

    const [productsResult, entriesResult] = await Promise.all([
      admin.from('products').select('*').eq('available', true).order('name'),
      admin.from('weekly_menu').select('product_id, quantity_limit').eq('pickup_week', week),
    ])

    if (productsResult.error) throw productsResult.error
    if (entriesResult.error) throw entriesResult.error

    products = productsResult.data ?? []
    entries = entriesResult.data ?? []
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Could not load data.'
  }

  const entryMap = new Map(entries.map((e) => [e.product_id, e]))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-violet">Menu</h1>
        <Suspense fallback={<div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />}>
          <WeekNav currentWeek={week} />
        </Suspense>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-6">
          {fetchError}
        </div>
      )}

      {products.length === 0 && !fetchError ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No available products. Add products on the Products page first.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">On Menu</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Weekly Limit</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <MenuToggleRow
                  key={product.id}
                  product={product}
                  entry={entryMap.get(product.id) ?? null}
                  week={week}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
