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

  if (status === 'ready') {
    await sendOrderReady(orderId)
  }

  revalidatePath('/admin')
}
