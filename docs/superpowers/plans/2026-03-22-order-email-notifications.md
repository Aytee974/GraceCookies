# Order Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a plain-text order confirmation email on payment and a "ready for pickup" email when the admin marks an order ready, via Resend.

**Architecture:** A single `src/lib/email.ts` module owns all email logic — Resend client init, data fetching, and both send functions. The stripe webhook and `updateOrderStatus` action each call one function with just an `orderId`; all email work stays inside `email.ts`. Failures are caught internally and never propagate.

**Tech Stack:** Resend SDK (`resend` npm package), Supabase admin client, Next.js server-side (no React — plain text emails only)

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/lib/email.ts` |
| Create | `src/__tests__/email.test.ts` |
| Modify | `src/app/api/webhooks/stripe/route.ts` |
| Modify | `src/app/actions/orders.ts` |
| Modify | `.env.local.example` |

> **Note:** The spec references `src/app/actions/admin.ts` but `updateOrderStatus` lives in `src/app/actions/orders.ts`. That is the file to modify.

---

## Task 1: Install resend and update env example

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 1: Install the resend package**

  ```bash
  npm install resend
  ```

  Expected: `resend` appears in `package.json` dependencies.

- [ ] **Step 2: Add env vars to `.env.local.example`**

  Append these two lines to `.env.local.example`:

  ```
  RESEND_API_KEY=re_...
  EMAIL_FROM=hello@graceycookies.com
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add package.json package-lock.json .env.local.example
  git commit -m "chore: install resend, add RESEND_API_KEY and EMAIL_FROM to env example"
  ```

---

## Task 2: TDD — pure helper functions in email.ts

The send functions contain formatting logic that can be tested without network calls. Extract this logic as pure functions and test them first.

**Files:**
- Create: `src/__tests__/email.test.ts`
- Create: `src/lib/email.ts` (pure helpers only at this stage)

### Step 1: Write the failing tests

- [ ] **Create `src/__tests__/email.test.ts`**

  ```typescript
  // Pure helper functions — copied from src/lib/email.ts for unit testing
  // (same pattern as utils.test.ts)

  function getFirstName(customerName: string): string {
    return customerName.split(' ')[0]
  }

  function formatPickupWeekLabel(pickupWeek: string): string {
    // pickupWeek is YYYY-MM-DD, always a Monday
    const [year, month, day] = pickupWeek.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatLineItem(name: string, quantity: number, unitPrice: number): string {
    const label = `${name} ×${quantity}`
    const price = `$${(unitPrice * quantity).toFixed(2)}`
    const totalWidth = 42
    const padding = totalWidth - label.length - price.length
    return `  ${label}${' '.repeat(Math.max(1, padding))}${price}`
  }

  function calcSubtotal(items: { quantity: number; unit_price: number }[]): number {
    return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  }

  // --- getFirstName ---
  describe('getFirstName', () => {
    it('returns the first word of a full name', () => {
      expect(getFirstName('Grace Smith')).toBe('Grace')
    })

    it('returns the whole string if there is no space', () => {
      expect(getFirstName('Grace')).toBe('Grace')
    })

    it('handles names with multiple words', () => {
      expect(getFirstName('Grace Anne Smith')).toBe('Grace')
    })
  })

  // --- formatPickupWeekLabel ---
  describe('formatPickupWeekLabel', () => {
    it('formats a Monday date as "Monday, March 24"', () => {
      expect(formatPickupWeekLabel('2025-03-24')).toBe('Monday, March 24')
    })

    it('formats a different Monday correctly', () => {
      expect(formatPickupWeekLabel('2025-01-06')).toBe('Monday, January 6')
    })
  })

  // --- formatLineItem ---
  describe('formatLineItem', () => {
    it('includes the product name, quantity, and total price', () => {
      const line = formatLineItem('Chocolate Chip Cookie', 2, 7.00)
      expect(line).toContain('Chocolate Chip Cookie ×2')
      expect(line).toContain('$14.00')
    })

    it('includes the product name, quantity, and total price for a single item', () => {
      const line = formatLineItem('Snickerdoodle', 1, 7.00)
      expect(line).toContain('Snickerdoodle ×1')
      expect(line).toContain('$7.00')
    })
  })

  // --- calcSubtotal ---
  describe('calcSubtotal', () => {
    it('sums quantity × unit_price across all items', () => {
      const items = [
        { quantity: 2, unit_price: 7.00 },
        { quantity: 1, unit_price: 7.00 },
      ]
      expect(calcSubtotal(items)).toBeCloseTo(21.00)
    })

    it('returns 0 for an empty order', () => {
      expect(calcSubtotal([])).toBe(0)
    })

    it('handles a single item', () => {
      expect(calcSubtotal([{ quantity: 3, unit_price: 5.50 }])).toBeCloseTo(16.50)
    })
  })
  ```

- [ ] **Step 2: Run to confirm tests fail**

  ```bash
  npx jest src/__tests__/email.test.ts --no-coverage
  ```

  Expected: PASS — the helpers are defined inline in the test file (same pattern as `utils.test.ts`), so tests pass immediately. This is intentional: we validate the logic before wiring it into `email.ts`.

- [ ] **Step 3: Create `src/lib/email.ts` with the pure helpers**

  ```typescript
  import { Resend } from 'resend'
  import { createAdminClient } from '@/lib/supabase/admin'

  const resend = new Resend(process.env.RESEND_API_KEY)

  // --- Pure helpers (also copied into email.test.ts for unit testing) ---

  export function getFirstName(customerName: string): string {
    return customerName.split(' ')[0]
  }

  export function formatPickupWeekLabel(pickupWeek: string): string {
    const [year, month, day] = pickupWeek.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  export function formatLineItem(name: string, quantity: number, unitPrice: number): string {
    const label = `${name} ×${quantity}`
    const price = `$${(unitPrice * quantity).toFixed(2)}`
    const totalWidth = 42
    const padding = totalWidth - label.length - price.length
    return `  ${label}${' '.repeat(Math.max(1, padding))}${price}`
  }

  export function calcSubtotal(items: { quantity: number; unit_price: number }[]): number {
    return items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  }

  // --- Send functions (implemented in Task 3) ---

  export async function sendOrderConfirmation(_orderId: string): Promise<void> {
    // TODO: implement in Task 3
  }

  export async function sendOrderReady(_orderId: string): Promise<void> {
    // TODO: implement in Task 4
  }
  ```

- [ ] **Step 4: Run tests to confirm they pass**

  ```bash
  npx jest src/__tests__/email.test.ts --no-coverage
  ```

  Expected: PASS (4 suites, all green)

- [ ] **Step 5: Commit**

  ```bash
  git add src/__tests__/email.test.ts src/lib/email.ts
  git commit -m "feat: add email helper functions with tests (send stubs pending)"
  ```

---

## Task 3: Implement sendOrderConfirmation

**Files:**
- Modify: `src/lib/email.ts` (replace the stub)

- [ ] **Step 1: Replace the sendOrderConfirmation stub**

  Replace the stub body with:

  ```typescript
  export async function sendOrderConfirmation(orderId: string): Promise<void> {
    try {
      const admin = createAdminClient()
      const { data: order, error } = await admin
        .from('orders')
        .select('*, order_items(quantity, unit_price, products(name))')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        console.error('sendOrderConfirmation: failed to fetch order', error)
        return
      }

      const firstName = getFirstName(order.customer_name)
      const pickupLabel = formatPickupWeekLabel(order.pickup_week)

      type RawItem = { quantity: number; unit_price: number; products: { name: string } | null }
      const items: RawItem[] = (order.order_items as RawItem[]) ?? []
      const subtotal = calcSubtotal(items)
      const tax = order.total - subtotal
      const divider = '  ' + '─'.repeat(40)
      const itemLines = items
        .map((item) => formatLineItem(item.products?.name ?? 'Item', item.quantity, item.unit_price))
        .join('\n')

      const body = `Hi ${firstName},

Your order is confirmed and payment received. Here's what you ordered:

${itemLines}
${divider}
  Subtotal${' '.repeat(32 - 'Subtotal'.length)}$${subtotal.toFixed(2)}
  NYC Tax (8.875%)${' '.repeat(32 - 'NYC Tax (8.875%)'.length)}$${tax.toFixed(2)}
  Total${' '.repeat(32 - 'Total'.length)}$${order.total.toFixed(2)}

Pickup week: ${pickupLabel}
Location: Birch Coffee — 750 Columbus Ave, New York, NY 10025

View your order: ${process.env.NEXT_PUBLIC_BASE_URL}/order/${order.id}?token=${order.access_token}

See you soon!
Gracey`

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: order.customer_email,
        subject: `Order confirmed — week of ${pickupLabel}`,
        text: body,
      })
    } catch (err) {
      console.error('sendOrderConfirmation: unexpected error', err)
    }
  }
  ```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests still PASS

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/email.ts
  git commit -m "feat: implement sendOrderConfirmation"
  ```

---

## Task 4: Implement sendOrderReady

**Files:**
- Modify: `src/lib/email.ts` (replace the stub)

- [ ] **Step 1: Replace the sendOrderReady stub**

  Replace the stub body with:

  ```typescript
  export async function sendOrderReady(orderId: string): Promise<void> {
    try {
      const admin = createAdminClient()
      const { data: order, error } = await admin
        .from('orders')
        .select('id, customer_name, customer_email, pickup_week, access_token')
        .eq('id', orderId)
        .single()

      if (error || !order) {
        console.error('sendOrderReady: failed to fetch order', error)
        return
      }

      const firstName = getFirstName(order.customer_name)
      const pickupLabel = formatPickupWeekLabel(order.pickup_week)

      const body = `Hi ${firstName},

Good news — your order is ready and waiting for you at:

  Birch Coffee
  750 Columbus Ave, New York, NY 10025
  Week of ${pickupLabel}

View your order: ${process.env.NEXT_PUBLIC_BASE_URL}/order/${order.id}?token=${order.access_token}

Gracey`

      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: order.customer_email,
        subject: 'Your cookies are ready for pickup!',
        text: body,
      })
    } catch (err) {
      console.error('sendOrderReady: unexpected error', err)
    }
  }
  ```

- [ ] **Step 2: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 3: Commit**

  ```bash
  git add src/lib/email.ts
  git commit -m "feat: implement sendOrderReady"
  ```

---

## Task 5: Wire sendOrderConfirmation into the Stripe webhook

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Add the import**

  At the top of `src/app/api/webhooks/stripe/route.ts`, add:

  ```typescript
  import { sendOrderConfirmation } from '@/lib/email'
  ```

- [ ] **Step 2: Call sendOrderConfirmation after the DB update succeeds**

  After the `if (error) { ... }` block (line 44–47) and before the closing `}` of the `if (orderId)` block, add:

  ```typescript
      await sendOrderConfirmation(orderId)
  ```

  The updated `if (orderId)` block should look like:

  ```typescript
      if (orderId) {
        const admin = createAdminClient()
        const { error } = await admin
          .from('orders')
          .update({ status: 'paid', stripe_payment_id: paymentIntentId })
          .eq('id', orderId)

        if (error) {
          console.error('Failed to update order status:', error)
          return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
        }

        await sendOrderConfirmation(orderId)
      }
  ```

- [ ] **Step 3: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/api/webhooks/stripe/route.ts
  git commit -m "feat: send order confirmation email on stripe payment success"
  ```

---

## Task 6: Wire sendOrderReady into updateOrderStatus

**Files:**
- Modify: `src/app/actions/orders.ts`

- [ ] **Step 1: Add the import**

  At the top of `src/app/actions/orders.ts`, add:

  ```typescript
  import { sendOrderReady } from '@/lib/email'
  ```

- [ ] **Step 2: Call sendOrderReady when status becomes 'ready'**

  After the `if (error) { throw ... }` block and before `revalidatePath`, add:

  ```typescript
    if (status === 'ready') {
      await sendOrderReady(orderId)
    }
  ```

  The full updated function should look like:

  ```typescript
  export async function updateOrderStatus(
    orderId: string,
    status: 'ready' | 'fulfilled'
  ) {
    const admin = createAdminClient()

    const { error } = await admin
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`)
    }

    if (status === 'ready') {
      await sendOrderReady(orderId)
    }

    revalidatePath('/admin')
  }
  ```

- [ ] **Step 3: Run the full test suite**

  ```bash
  npx jest --no-coverage
  ```

  Expected: all tests PASS

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/actions/orders.ts
  git commit -m "feat: send ready-for-pickup email when order status set to ready"
  ```

---

## Setup Reminder (Manual — not part of implementation)

Before testing end-to-end in a real environment:

1. Create an account at resend.com
2. Add and verify your sending domain (DNS TXT record)
3. Generate an API key
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_...
   EMAIL_FROM=hello@graceycookies.com
   ```
