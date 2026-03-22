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

// --- Send functions (implemented in later tasks) ---

export async function sendOrderConfirmation(_orderId: string): Promise<void> {
  // TODO: implement in Task 3
}

export async function sendOrderReady(_orderId: string): Promise<void> {
  // TODO: implement in Task 4
}
