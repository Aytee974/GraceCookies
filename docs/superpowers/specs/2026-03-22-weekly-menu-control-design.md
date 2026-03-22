# Weekly Menu Control — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

Add a "Menu" tab to the admin that lets Gracey configure which products are available each week and set per-week quantity limits. Currently, product availability and quantity limits are global fields on the `products` table. This spec introduces a per-week menu layer: a product only appears in the shop if it is both globally available and explicitly on that week's menu.

---

## Goals

- Admin can configure which products are on the menu for any given week
- Admin can set a per-week quantity limit for each product on the menu (blank = unlimited)
- Changes save instantly (toggle = immediate DB write; quantity = saves on blur)
- The customer-facing shop reflects the weekly menu — only shows products on the current week's menu
- Sold-out tracking uses `weekly_menu.quantity_limit` instead of `products.weekly_quantity`

---

## Non-Goals

- "Copy from last week" convenience button (can be added later)
- Menu templates or recurring schedules
- Customer-visible menu preview or announcement
- Changes to `products.weekly_quantity` (remains as a default hint, not used by the shop)

---

## Data Model

### New table: `weekly_menu`

```sql
create table weekly_menu (
  id           uuid primary key default gen_random_uuid(),
  pickup_week  date not null,
  product_id   uuid not null references products(id) on delete cascade,
  quantity_limit int null,  -- null = unlimited
  unique (pickup_week, product_id)
);
```

A product is on a week's menu if and only if a row exists for `(pickup_week, product_id)`.

### Existing `products` table

No schema changes. `products.available` continues to act as a global "not discontinued" flag — a product with `available = false` will not appear in the shop even if it has a `weekly_menu` row.

`products.weekly_quantity` is not used by the shop after this change but remains in the DB and is editable on the Products page. It may serve as a hint when setting weekly limits.

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/app/admin/menu/page.tsx` | Server component — fetches all `available` products and this week's `weekly_menu` rows, renders the table |
| `src/app/admin/MenuToggleRow.tsx` | Client component — one row per product: toggle on/off and quantity input |
| `src/app/actions/menu.ts` | Server actions — `toggleMenuEntry` and `updateMenuQuantity` |
| `supabase/migrations/YYYYMMDDHHMMSS_create_weekly_menu.sql` | DB migration |

### Modified files

| File | Change |
|---|---|
| `src/app/admin/AdminNav.tsx` | Add "Menu" nav link between "Orders" and "Products" |
| `src/app/shop/page.tsx` | Filter products by `weekly_menu` for the upcoming week; use `quantity_limit` for sold-out tracking |

---

## Admin UI

### Page: `/admin/menu`

- Header: "Menu" title + WeekNav (same prev/next week component as `/admin`)
- Default week: next Monday (same logic as the shop)
- Table columns: Product name | Category badge | On Menu (toggle) | Weekly Limit (number input)

### Row states

**On menu (toggle = on):**
- Row is full opacity
- Toggle is violet/filled
- Quantity input is enabled; blank = unlimited (shows `∞ unlimited` placeholder)
- When toggled on: quantity defaults to empty (unlimited) unless `products.weekly_quantity > 0`, in which case it pre-fills

**Off menu (toggle = off):**
- Row is dimmed (opacity ~55%)
- Toggle is grey
- Quantity column shows `—`, no input

### Save behaviour

- **Toggle** — fires immediately on click via `startTransition`; calls `toggleMenuEntry(week, productId, isOn)`
  - If turning on: inserts a `weekly_menu` row
  - If turning off: deletes the row
- **Quantity** — calls `updateMenuQuantity(week, productId, limit)` on input blur
  - Empty string → sets `quantity_limit = null` (unlimited)
  - Positive integer → sets `quantity_limit = value`

---

## Server Actions (`src/app/actions/menu.ts`)

```ts
toggleMenuEntry(week: string, productId: string, on: boolean): Promise<{ error?: string }>
updateMenuQuantity(week: string, productId: string, limit: number | null): Promise<{ error?: string }>
```

Both use `createAdminClient()` and call `revalidatePath('/admin/menu')`.

---

## Shop Changes (`src/app/shop/page.tsx`)

**Before:** fetches `products` where `available = true`, uses `products.weekly_quantity` for sold-out tracking.

**After:**
1. Fetch `weekly_menu` rows for the upcoming week
2. Fetch only those products (with `available = true` guard)
3. For sold-out tracking, use `weekly_menu.quantity_limit` instead of `products.weekly_quantity`
4. Products with `available = false` are excluded even if a `weekly_menu` row exists

If there are no `weekly_menu` rows for the upcoming week, the shop shows an empty state (no products available).

---

## Error Handling

- Server actions return `{ error?: string }` — errors surfaced as inline text below the affected row
- If fetching products or menu entries fails on page load, show an error banner (same pattern as other admin pages)

---

## Security

- Menu actions use `createAdminClient()` (service role) — admin-only route protected by existing admin layout auth
- No new public API surface

---

## Setup Required

1. Run DB migration to create `weekly_menu` table
2. No new env vars required
