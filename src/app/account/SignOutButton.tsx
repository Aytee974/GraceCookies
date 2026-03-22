'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()  // invalidate server-side session cache FIRST
    router.push('/')
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors font-body"
    >
      Sign Out
    </button>
  )
}
