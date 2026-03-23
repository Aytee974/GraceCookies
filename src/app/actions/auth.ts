'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/account/reset-password`,
  })

  if (error) return { error: error.message }
  return {}
}

export async function resetPassword(password: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return {}
}
