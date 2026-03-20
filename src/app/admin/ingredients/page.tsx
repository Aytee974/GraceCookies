import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { WeekNav } from '../WeekNav'
import { PrintButton } from './PrintButton'

function getCurrentMonday(): string {
  const today = new Date()
  const day = today.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setUTCDate(today.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

interface AggregatedIngredient {
  name: string
  amount: number
  unit: string
}

interface PageProps {
  searchParams: Promise<{ week?: string }>
}

export default async function IngredientsPage({ searchParams }: PageProps) {
  const { week: weekParam } = await searchParams
  const week = weekParam ?? getCurrentMonday()

  let ingredients: AggregatedIngredient[] = []
  let fetchError: string | null = null

  try {
    const admin = createAdminClient()

    // 1. Get orders for the week
    const { data: orders, error: ordersError } = await admin
      .from('orders')
      .select('id')
      .eq('pickup_week', week)
      .in('status', ['paid', 'ready', 'fulfilled'])

    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      ingredients = []
    } else {
      const orderIds = orders.map((o: { id: string }) => o.id)

      // 2. Get all order_items for these orders
      const { data: orderItems, error: itemsError } = await admin
        .from('order_items')
        .select('product_id, quantity')
        .in('order_id', orderIds)

      if (itemsError) throw new Error(itemsError.message)

      if (!orderItems || orderItems.length === 0) {
        ingredients = []
      } else {
        // 3. Aggregate quantities per product
        const productQtyMap: Record<string, number> = {}
        for (const item of orderItems) {
          productQtyMap[item.product_id] = (productQtyMap[item.product_id] ?? 0) + item.quantity
        }

        const productIds = Object.keys(productQtyMap)

        // 4. Get recipes for these products
        const { data: recipes, error: recipesError } = await admin
          .from('recipes')
          .select('id, product_id, batch_size')
          .in('product_id', productIds)

        if (recipesError) throw new Error(recipesError.message)

        if (!recipes || recipes.length === 0) {
          ingredients = []
        } else {
          const recipeIds = recipes.map((r: { id: string }) => r.id)

          // 5. Get all recipe ingredients
          const { data: recipeIngredients, error: riError } = await admin
            .from('recipe_ingredients')
            .select('recipe_id, name, quantity, unit')
            .in('recipe_id', recipeIds)

          if (riError) throw new Error(riError.message)

          // 6. Calculate totals
          const ingredientTotals: Record<string, { amount: number; unit: string }> = {}

          for (const recipe of recipes) {
            const totalQty = productQtyMap[recipe.product_id] ?? 0
            if (totalQty === 0) continue

            const batchesNeeded = Math.ceil(totalQty / recipe.batch_size)
            const rIngredients = (recipeIngredients ?? []).filter(
              (ri: { recipe_id: string }) => ri.recipe_id === recipe.id
            )

            for (const ri of rIngredients) {
              const total = batchesNeeded * ri.quantity
              const key = `${ri.name}__${ri.unit}`
              if (ingredientTotals[key]) {
                ingredientTotals[key].amount += total
              } else {
                ingredientTotals[key] = { amount: total, unit: ri.unit }
              }
            }
          }

          ingredients = Object.entries(ingredientTotals).map(([key, val]) => ({
            name: key.split('__')[0],
            amount: val.amount,
            unit: val.unit,
          })).sort((a, b) => a.name.localeCompare(b.name))
        }
      }
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Could not connect to database.'
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-violet">Ingredients</h1>
        <div className="flex items-center gap-3">
          <Suspense fallback={<div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />}>
            <WeekNav currentWeek={week} />
          </Suspense>
          <PrintButton />
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600 mb-6">
          {fetchError}
        </div>
      )}

      {ingredients.length === 0 && !fetchError ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No ingredients needed — no orders or no recipes configured for this week.</p>
        </div>
      ) : ingredients.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ingredient</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Unit</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={`${ing.name}-${ing.unit}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{ing.name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{ing.amount}</td>
                  <td className="px-4 py-3 text-gray-600">{ing.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
