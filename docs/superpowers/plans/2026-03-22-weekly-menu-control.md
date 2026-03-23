# Weekly Menu Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-week menu configuration page to the admin so Gracey can choose which products are available each week and set per-week quantity limits.

**Architecture:** A new `weekly_menu` DB table stores `(pickup_week, product_id, quantity_limit)` rows. The admin `/admin/menu` page lets you toggle products on/off per week and set limits — changes auto-save. The shop page is updated to show only products in the current week's menu and use `quantity_limit` for sold-out tracking.

**Tech Stack:** Next.js App Router (server components + server actions), Supabase (admin client), TypeScript, Jest/ts-jest

---

## File Map

| Action | Path |
|--------|------|
| Create | `supabase/migrations/003_weekly_menu.sql` |
| Create | `src/app/actions/menu.ts` |
| Create | `src/app/admin/menu/MenuToggleRow.tsx` |
| Create | `src/app/admin/menu/page.tsx` |
| Create | `src/__tests__/menu.test.ts` |
| Modify | `src/app/admin/AdminNav.tsx` |
| Modify | `src/app/shop/page.tsx` |

---

## Task 1: DB migration — create weekly_menu table

**Files:**
- Create: `supabase/migrations/003_weekly_menu.sql`

- [ ] **Step 1: Create the migration file**

  Create `supabase/migrations/003_weekly_menu.sql`:

  ```sql
  CREATE TABLE weekly_menu (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_week   DATE NOT NULL,
    product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_limit INTEGER NULL,
    UNIQUE (pickup_week, product_id)
  );
  ```

- [ ] **Step 2: Apply the migration**

  Run via Supabase MCP or in the Supabase dashboard SQL editor. Verify the `weekly_menu` table appears in your project.

- [ ] **Step 3: Commit**

  ```bash
  git add supabase/migrations/003_weekly_menu.sql
  git commit -m "feat: add weekly_menu migration"
  ```

---

## Task 2: TDD — getNextMondayUTC helper + server actions

The shop page has a local `getNextMonday()` with a UTC bug. This task introduces a UTC-safe version, tests it, and creates the menu server actions.

**Files:**
- Create: `src/__tests__/menu.test.ts`
- Create: `src/app/actions/menu.ts`

### Step 1: Write the failing tests

- [ ] **Create `src/__tests__/menu.test.ts`**

  ```typescript
  // Pure helper — copied from src/app/actions/menu.ts for unit testing
  // (same pattern as utils.test.ts)

  function getNextMondayUTC(from: Date = new Date()): string {
    const day = from.getUTCDay() // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntil = day === 0 ? 1 : 8 - day
    const next = new Date(from)
    next.setUTCDate(from.getUTCDate() + daysUntil)
    return next.toISOString().split('T')[0]
  }

  // --- getNextMondayUTC ---
  describe('getNextMondayUTC', () => {
    it('returns next Monday from a Sunday (UTC)', () => {
      const sunday = new Date('2025-03-16T00:00:00Z') // Sunday
      expect(getNextMondayUTC(sunday)).toBe('2025-03-17')
    })

    it('returns the following Monday when given a Monday', () => {
      const monday = new Date('2025-03-17T00:00:00Z')
      expect(getNextMondayUTC(monday)).toBe('2025-03-24')
    })

    it('returns next Monday from a Wednesday', () => {
      const wednesday = new Date('2025-03-19T00:00:00Z')
      expect(getNextMondayUTC(wednesday)).toBe('2025-03-24')
    })

    it('returns next Monday from a Saturday', () => {
      const saturday = new Date('2025-03-22T00:00:00Z')
      expect(getNextMondayUTC(saturday)).toBe('2025-03-24')
    })

    it('returns a YYYY-MM-DD string', () => {
      const result = getNextMondayUTC(new Date('2025-03-19T00:00:00Z'))
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
  ```

- [ ] **Step 2: Run to confirm tests pass**

  ```bash
  npx jest src/__tests__/menu.test.ts --no-coverage
  ```

  Expected: PASS — helpers are defined inline in the test file.

- [ ] **Step 3: Create `src/app/actions/menu.ts`**

  ```typescript
  'use server'

  import { createAdminClient } from '@/lib/supabase/admin'
  import { revalidatePath } from 'next/cache'

  export function getNextMondayUTC(from: Date = new Date()): string {
    const day = from.getUTCDay()
    const daysUntil = day === 0 ? 1 : 8 - day
    const next = new Date(from)
    next.setUTCDate(from.getUTCDate() + daysUntil)
    return next.toISOString().split('T')[0]
  }

  export async function toggleMenuEntry(
    week: string,
    productId: string,
    on: boolean
  ): Promise<{ error?: string }> {
    try {
      const admin = createAdminClient()
      if (on) {
        const { error } = await admin
          .from('weekly_menu')
          .upsert({ pickup_week: week, product_id: productId }, { onConflict: 'pickup_week,product_id' })
        if (error) return { error: error.message }
      } else {
        const { error } = await admin
          .from('weekly_menu')
          .delete()
          .eq('pickup_week', week)
          .eq('product_id', productId)
        if (error) return { error: error.message }
      }
      revalidatePath('/admin/menu')
      revalidatePath('/shop')
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  export async function updateMenuQuantity(
    week: string,
    productId: string,
    limit: number | null
  ): Promise<{ error?: string }> {
    try {
      const admin = createAdminClient()
      const { error } = await admin
        .from('weekly_menu')
        .update({ quantity_limit: limit })
        .eq('pickup_week', week)
        .eq('product_id', productId)
      if (error) return { error: error.message }
      revalidatePath('/admin/menu')
      revalidatePath('/shop')
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
  ```

- [ ] **Step 4: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/__tests__/menu.test.ts src/app/actions/menu.ts
  git commit -m "feat: add menu server actions and getNextMondayUTC helper with tests"
  ```

---

## Task 3: MenuToggleRow client component

**Files:**
- Create: `src/app/admin/menu/MenuToggleRow.tsx`

- [ ] **Step 1: Create the component**

  ```typescript
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
        if (result.error) setRowError(result.error)
        if (!isOn) {
          // Pre-fill quantity from product default when turning on
          setQuantityValue(product.weekly_quantity > 0 ? String(product.weekly_quantity) : '')
        }
      })
    }

    function handleQuantityBlur() {
      setRowError(null)
      const trimmed = quantityValue.trim()
      const limit = trimmed === '' ? null : parseInt(trimmed, 10)
      if (trimmed !== '' && (isNaN(limit!) || limit! < 0)) {
        setRowError('Quantity must be a positive number or blank for unlimited.')
        return
      }
      startTransition(async () => {
        const result = await updateMenuQuantity(week, product.id, limit)
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
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS (no new tests — component logic tested via integration)

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/admin/menu/MenuToggleRow.tsx
  git commit -m "feat: add MenuToggleRow client component"
  ```

---

## Task 4: Admin menu page

**Files:**
- Create: `src/app/admin/menu/page.tsx`

- [ ] **Step 1: Create the page**

  ```typescript
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
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/admin/menu/page.tsx
  git commit -m "feat: add admin menu page"
  ```

---

## Task 5: Add Menu link to AdminNav

**Files:**
- Modify: `src/app/admin/AdminNav.tsx`

- [ ] **Step 1: Add the Menu nav link**

  Current `navLinks` array in `src/app/admin/AdminNav.tsx`:
  ```typescript
  const navLinks = [
    { label: 'Orders', href: '/admin' },
    { label: 'Ingredients', href: '/admin/ingredients' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Recipes', href: '/admin/recipes' },
    { label: 'Stats', href: '/admin/stats' },
  ]
  ```

  Replace with:
  ```typescript
  const navLinks = [
    { label: 'Orders', href: '/admin' },
    { label: 'Menu', href: '/admin/menu' },
    { label: 'Ingredients', href: '/admin/ingredients' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Recipes', href: '/admin/recipes' },
    { label: 'Stats', href: '/admin/stats' },
  ]
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/admin/AdminNav.tsx
  git commit -m "feat: add Menu link to admin nav"
  ```

---

## Task 6: Update shop page to use weekly_menu

**Files:**
- Modify: `src/app/shop/page.tsx`

The shop currently shows all `available=true` products and uses `products.weekly_quantity` for limits. This task replaces that with a join against `weekly_menu`.

- [ ] **Step 1: Replace `src/app/shop/page.tsx`**

  ```typescript
  import { createAdminClient } from '@/lib/supabase/admin'
  import { CategoryFilter } from '@/components/CategoryFilter'
  import { getNextMondayUTC } from '@/app/actions/menu'
  import type { Product } from '@/lib/types'

  type MenuEntry = {
    product_id: string
    quantity_limit: number | null
  }

  export default async function ShopPage() {
    let products: Product[] = []
    let remainingMap: Record<string, number> = {}

    try {
      const admin = createAdminClient()
      const nextMonday = getNextMondayUTC()

      // Fetch this week's menu entries
      const { data: entries, error: entriesError } = await admin
        .from('weekly_menu')
        .select('product_id, quantity_limit')
        .eq('pickup_week', nextMonday)

      if (entriesError) throw entriesError

      const menuEntries: MenuEntry[] = entries ?? []
      if (menuEntries.length === 0) {
        // No menu configured for this week — show empty shop
        return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-10">
              <h1 className="font-display text-4xl font-bold text-violet mb-2">Our Cookies</h1>
              <p className="font-body text-gray-600">Freshly baked, gluten-free, and made with love every week.</p>
            </div>
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🍪</p>
              <p className="font-body text-gray-500 text-lg">Products coming soon — check back later!</p>
            </div>
          </div>
        )
      }

      const productIds = menuEntries.map((e) => e.product_id)
      const entryMap = new Map(menuEntries.map((e) => [e.product_id, e]))

      // Fetch the products that are on the menu and still available (not discontinued)
      const { data, error: productsError } = await admin
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('available', true)
        .order('name')

      if (productsError) throw productsError
      products = data ?? []

      // Sold-out tracking: use weekly_menu.quantity_limit
      const limitedProducts = products.filter(
        (p) => (entryMap.get(p.id)?.quantity_limit ?? null) !== null
      )

      if (limitedProducts.length > 0) {
        const { data: items } = await admin
          .from('order_items')
          .select('product_id, quantity, orders!inner(pickup_week, status)')
          .in('product_id', limitedProducts.map((p) => p.id))
          .eq('orders.pickup_week', nextMonday)
          .in('orders.status', ['paid', 'ready', 'fulfilled'])

        const orderedMap: Record<string, number> = {}
        for (const item of items ?? []) {
          orderedMap[item.product_id] = (orderedMap[item.product_id] ?? 0) + item.quantity
        }

        for (const p of limitedProducts) {
          const limit = entryMap.get(p.id)!.quantity_limit!
          remainingMap[p.id] = Math.max(0, limit - (orderedMap[p.id] ?? 0))
        }
      }
    } catch {
      products = []
    }

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-violet mb-2">Our Cookies</h1>
          <p className="font-body text-gray-600">Freshly baked, gluten-free, and made with love every week.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🍪</p>
            <p className="font-body text-gray-500 text-lg">Products coming soon — check back later!</p>
          </div>
        ) : (
          <CategoryFilter products={products} remainingMap={remainingMap} />
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/shop/page.tsx
  git commit -m "feat: update shop page to use weekly_menu for availability and limits"
  ```

---

## Manual Smoke Test

After all tasks are complete:

1. Apply the DB migration (Task 1 Step 2) if not already done
2. Start the dev server: `npm run dev`
3. Go to `/admin/menu` — should show all available products, all toggled off
4. Toggle a product on — row should go full-opacity, quantity input appears
5. Enter a quantity limit and click away — value should persist on page refresh
6. Go to `/shop` — only the toggled-on products should appear
7. Toggle a product off — it should disappear from the shop on next refresh
