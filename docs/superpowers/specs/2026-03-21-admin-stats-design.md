# Admin Statistics Dashboard — Design Spec

**Date:** 2026-03-21
**Status:** Ready for Review

---

## Overview

Add a `/admin/stats` page to the admin dashboard that gives Gracey a performance view across multiple weeks. The page shows four KPI cards, a weekly revenue bar chart, a best-selling products ranked list, and an average order value trend chart. Data is fetched server-side using the admin client — no new database tables required.

---

## Goals

- Show total revenue, total orders, average order value, and best week for a selected period
- Show revenue trend week-by-week as a bar chart
- Show which products sell most (ranked by quantity sold)
- Show average order value trend week-by-week
- Let admin switch between 4, 8, and 12-week lookback periods

---

## Non-Goals

- No CSV/export functionality
- No per-customer analytics
- No real-time updates (server-rendered on load)
- No charts library — pure CSS/HTML bars only (keeps bundle small)

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/app/admin/stats/page.tsx` | Server Component — fetches data, renders the full stats page |
| `src/app/admin/stats/RangeSelector.tsx` | Client Component — 4/8/12-week tab switcher (updates URL searchParam) |

### Modified files

| File | Change |
|---|---|
| `src/app/admin/AdminNav.tsx` | Add "Stats" nav link pointing to `/admin/stats` |

### Data fetching

All queries use `createAdminClient()` and run in the Server Component. No `'use server'` needed.

**Lookback range:** Controlled by `?weeks=` URL search param (4, 8, or 12). Default: 8. The page reads this param and computes the Monday dates for the selected number of past weeks (including the current week).

**Queries:**

1. **Weekly aggregates** — from `orders` table, filtered by `pickup_week IN (computed weeks)` and `status IN ('paid', 'ready', 'fulfilled')`:
   - Group by `pickup_week` → count of orders, sum of total per week

2. **Product sales** — from `order_items` joined with `products`, same week filter on the parent order:
   - Group by `product_id` / `product_name` → sum of quantity sold

Both queries are plain Supabase selects with `.in('pickup_week', weeks)`. Aggregation happens in TypeScript (not SQL) to keep the queries simple and avoid Supabase RPC.

---

## Page Layout

### KPI cards (top row, 4 columns)

| Card | Value | Delta |
|---|---|---|
| Total Revenue | Sum of all order totals in period | % change vs previous same-length period |
| Total Orders | Count of orders in period | % change vs prev period |
| Avg Order Value | Revenue ÷ Orders | % change vs prev period |
| Best Week | Pickup week date with highest revenue | Revenue · order count |

Deltas compare the selected period against the equal-length period immediately before it (e.g., 8-week range → compare to the 8 weeks prior). Delta shown as `↑ 18%` (green) or `↓ 5%` (red) or `—` if no prior data.

### Revenue bar chart (wide left column)

- One bar per week, height proportional to revenue
- Best week highlighted in gold (`#d4af37`), all others in violet (`#7c3aed`)
- Week label below each bar (e.g. "Mar 10")
- Revenue value above each bar
- Pure CSS — no chart library

### Best-selling products (narrow right column)

- Ranked list #1–#5 (or fewer if fewer products exist)
- Each row: rank (gold), product name, relative progress bar, quantity sold
- Bar width is proportional to #1 product (100% = top seller)

### Avg order value trend (full-width bottom row)

- One bar per week, height proportional to avg order value
- Best week highlighted in violet, others in lavender (`#ddd6fe`)
- Week label below, value above

### Range selector

- Three tabs: "4 weeks" | "8 weeks" | "12 weeks"
- Active tab has violet background
- Clicking updates `?weeks=` URL param via `router.push()` (Client Component)
- Page re-renders server-side with new data

---

## Week Computation

Weeks are always pickup-week Mondays. The helper function:

```ts
function getPastMondays(count: number): string[] {
  // Returns the `count` most recent Mondays (as YYYY-MM-DD ISO strings),
  // including the current week's Monday, in ascending order.
}
```

To fetch comparison period data, double the week list: fetch `count * 2` weeks, split in half — second half is current period, first half is comparison period.

---

## Styling

Follows existing admin UI patterns:
- White cards, `border border-gray-200`, `rounded-xl`
- `font-display` (Playfair Display) for KPI values and page title
- `text-violet` (`#7c3aed`) as primary accent
- Gold (`#d4af37`) for best-week highlight
- No new Tailwind classes beyond what already exists in the project

---

## Security

- All data fetched server-side via `createAdminClient()` (service role)
- Page is inside `/admin` — protected by the existing proxy auth guard
- No customer PII exposed on this page (names/emails not shown)

---

## Out of Scope

- Charts with hover tooltips or interactivity beyond range switching
- Revenue breakdown by product (only quantity sold, not revenue per product)
- Exporting data
- Date range picker (only fixed 4/8/12 week windows)
