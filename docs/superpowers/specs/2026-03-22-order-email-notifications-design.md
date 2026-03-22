# Order Email Notifications — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

Add two automated plain-text emails via Resend to the order flow. Currently customers receive no email when they pay or when their order is ready. This spec adds a confirmation email on payment and a pickup-ready notification when the admin marks the order ready.

---

## Goals

- Send a plain-text order confirmation email when Stripe payment succeeds
- Send a plain-text "ready for pickup" email when admin marks order as ready
- Email failures must never break the order flow (fire-and-forget with error logging)
- No HTML templates — plain text only

---

## Non-Goals

- HTML/branded email templates
- Email for order cancellations or refunds
- SMS notifications
- Weekly menu announcement emails
- Email unsubscribe/preference management

---

## Architecture

### New files

| File | Responsibility |
|---|---|
| `src/lib/email.ts` | Resend client init, `sendOrderConfirmation(orderId)`, `sendOrderReady(orderId)` — all email logic in one place |

### Modified files

| File | Change |
|---|---|
| `src/app/api/webhooks/stripe/route.ts` | Call `sendOrderConfirmation(orderId)` after status updates to `paid` |
| `src/app/actions/admin.ts` | Call `sendOrderReady(orderId)` inside `updateOrderStatus()` when new status is `'ready'` |
| `.env.local.example` | Add `RESEND_API_KEY` and `EMAIL_FROM` |

### Data fetching

Both email functions receive an `orderId` and fetch everything they need internally via `createAdminClient()`:

```ts
const { data: order } = await admin
  .from('orders')
  .select('*, order_items(quantity, unit_price, products(name))')
  .eq('id', orderId)
  .single()
```

This keeps the call sites simple (just pass `orderId`) and keeps all email logic inside `email.ts`.

---

## Email Specs

### Email 1: Order Confirmed

**Trigger:** `src/app/api/webhooks/stripe/route.ts` — after `status = 'paid'` DB update

**Subject:** `Order confirmed — week of March 24`

**Body:**
```
Hi Grace,

Your order is confirmed and payment received. Here's what you ordered:

  Chocolate Chip Cookie ×2       $14.00
  Snickerdoodle ×1                $7.00
  ──────────────────────────────────────
  Subtotal                        $21.00
  NYC Tax (8.875%)                 $1.86
  Total                           $22.86

Pickup week: Monday, March 24
Location: Birch Coffee — 750 Columbus Ave, New York, NY 10025

View your order: https://graceycookies.com/order/[id]?token=[token]

See you soon!
Gracey
```

**First name:** Split `customer_name` on first space.
**Subtotal:** `sum(unit_price × quantity)` from `order_items`.
**Tax:** `total − subtotal` (both stored in DB).
**Pickup week label:** Format `pickup_week` (YYYY-MM-DD) as "Monday, March 24".

---

### Email 2: Ready for Pickup

**Trigger:** `src/app/actions/admin.ts` — inside `updateOrderStatus()` when `status === 'ready'`

**Subject:** `Your cookies are ready for pickup!`

**Body:**
```
Hi Grace,

Good news — your order is ready and waiting for you at:

  Birch Coffee
  750 Columbus Ave, New York, NY 10025
  Week of Monday, March 24

View your order: https://graceycookies.com/order/[id]?token=[token]

Gracey
```

---

## Environment Variables

```
RESEND_API_KEY=re_...          # From resend.com dashboard
EMAIL_FROM=hello@graceycookies.com  # Must be a verified domain in Resend
```

`NEXT_PUBLIC_BASE_URL` is already in the codebase and used for the order link.

---

## Error Handling

Both `sendOrderConfirmation` and `sendOrderReady` must:
- Be wrapped internally in `try/catch`
- Log errors with `console.error` on failure
- Never throw — email failure must not affect order status updates

---

## Setup Required (Manual)

1. Create a free account at resend.com
2. Add and verify your sending domain (DNS TXT record)
3. Generate an API key
4. Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.local`

---

## Security

- Email functions use `createAdminClient()` (service role) — no customer PII beyond what's needed for the email
- `access_token` is already stored in the DB and used for the order page link — no new secrets
- Resend API key is a server-only secret (never exposed to the client)
