'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CartItem } from '@/lib/types'

function getNextMondays(count: number): Date[] {
  const mondays: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find next Monday
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon...
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const firstMonday = new Date(today)
  firstMonday.setDate(today.getDate() + daysUntilMonday)

  for (let i = 0; i < count; i++) {
    const d = new Date(firstMonday)
    d.setDate(firstMonday.getDate() + i * 7)
    mondays.push(d)
  }
  return mondays
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface CheckoutInput {
  cart: CartItem[]
  firstName: string
  lastName: string
  email: string
  phone: string
  pickupWeek: string // YYYY-MM-DD (a Monday)
}

export async function placeOrder(input: CheckoutInput): Promise<{ url: string } | { error: string }> {
  const { cart, firstName, lastName, email, phone, pickupWeek } = input

  if (!cart || cart.length === 0) {
    return { error: 'Your cart is empty.' }
  }

  // Validate pickup week is an upcoming Monday
  const validMondays = getNextMondays(4).map(toISODate)
  if (!validMondays.includes(pickupWeek)) {
    return { error: 'Please select a valid pickup week.' }
  }

  // Validate products are still available
  try {
    const supabase = await createClient()
    const productIds = cart.map((item) => item.product.id)
    const { data: products, error } = await supabase
      .from('products')
      .select('id, available, price, name')
      .in('id', productIds)

    if (error) return { error: 'Could not verify product availability.' }

    for (const item of cart) {
      const dbProduct = products?.find((p) => p.id === item.product.id)
      if (!dbProduct || !dbProduct.available) {
        return { error: `"${item.product.name}" is no longer available.` }
      }
    }

    // Build line items using db prices
    const lineItems = cart.map((item) => {
      const dbProduct = products!.find((p) => p.id === item.product.id)!
      return {
        productId: item.product.id,
        name: dbProduct.name,
        quantity: item.quantity,
        unitPrice: Number(dbProduct.price),
      }
    })

    const total = lineItems.reduce((s, li) => s + li.unitPrice * li.quantity, 0)

    // Create order with admin client
    const admin = createAdminClient()
    const accessToken = crypto.randomUUID()
    const customerName = `${firstName} ${lastName}`.trim()

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        pickup_week: pickupWeek,
        total,
        status: 'pending',
        access_token: accessToken,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return { error: 'Could not create your order. Please try again.' }
    }

    const orderId = order.id

    // Insert order items
    const { error: itemsError } = await admin.from('order_items').insert(
      lineItems.map((li) => ({
        order_id: orderId,
        product_id: li.productId,
        quantity: li.quantity,
        unit_price: li.unitPrice,
      }))
    )

    if (itemsError) {
      // Cleanup order
      await admin.from('orders').delete().eq('id', orderId)
      return { error: 'Could not save order items. Please try again.' }
    }

    // Create Stripe checkout session
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map((li) => ({
        price_data: {
          currency: 'cad',
          product_data: { name: li.name },
          unit_amount: Math.round(li.unitPrice * 100),
        },
        quantity: li.quantity,
      })),
      success_url: `${baseUrl}/order/${orderId}?token=${accessToken}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: { orderId, accessToken },
      customer_email: email,
    })

    return { url: session.url! }
  } catch (err) {
    console.error('Checkout error:', err)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getNextPickupWeeks(): Promise<string[]> {
  return getNextMondays(4).map(toISODate)
}
