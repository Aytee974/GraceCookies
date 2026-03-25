import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

// --- Pure helpers (also copied into email.test.ts for unit testing) ---

export function getFirstName(customerName: string): string {
  return customerName.split(' ')[0]
}

export function formatPickupWeekLabel(pickupWeek: string): string {
  const [year, month, day] = pickupWeek.split('-').map(Number)
  const date = new Date(`${pickupWeek}T00:00:00Z`)
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

// --- Send functions (implemented in later tasks) ---

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

export async function sendOrderReady(orderId: string): Promise<void> {
  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, customer_name, customer_email, pickup_week, access_token')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('sendOrderReady: failed to fetch order', error)
    throw new Error(`sendOrderReady: failed to fetch order ${orderId}`)
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

  const { error: sendError } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: order.customer_email,
    subject: 'Your cookies are ready for pickup!',
    text: body,
  })

  if (sendError) {
    console.error('sendOrderReady: resend error', sendError)
    throw new Error(`sendOrderReady: failed to send email for order ${orderId}`)
  }
}
