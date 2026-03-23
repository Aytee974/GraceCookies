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
