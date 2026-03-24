'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendOrderReady } from '@/lib/email'

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

  revalidatePath('/admin')
}

export async function sendConfirmationEmail(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient()

  // Atomic claim — prevents double-send from concurrent clicks
  const { data, error: claimError } = await admin
    .from('orders')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('confirmation_sent_at', null)
    .select('id')

  if (claimError) {
    throw new Error(`sendConfirmationEmail: claim failed: ${claimError.message}`)
  }

  if (!data || data.length === 0) {
    // No row updated — already claimed/sent by another request
    return { success: false, error: 'already_sent' }
  }

  try {
    await sendOrderReady(orderId)
  } catch (err) {
    // Best-effort rollback — not a true DB transaction
    await admin
      .from('orders')
      .update({ confirmation_sent_at: null })
      .eq('id', orderId)
    console.error('sendConfirmationEmail: email failed, rolled back claim', err)
    return { success: false, error: 'email_failed' }
  }

  revalidatePath('/admin/confirmation')
  revalidatePath('/admin')
  return { success: true }
}

export async function sendAllConfirmationEmails(
  week: string
): Promise<{ sent: number; failed: number }> {
  const admin = createAdminClient()

  const { data: orders, error: fetchError } = await admin
    .from('orders')
    .select('id')
    .eq('status', 'ready')
    .eq('pickup_week', week)
    .is('confirmation_sent_at', null)

  if (fetchError) {
    throw new Error(`sendAllConfirmationEmails: fetch failed: ${fetchError.message}`)
  }

  if (!orders || orders.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  for (const order of orders) {
    const result = await sendConfirmationEmail(order.id)
    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  revalidatePath('/admin/confirmation')
  revalidatePath('/admin')
  return { sent, failed }
}
