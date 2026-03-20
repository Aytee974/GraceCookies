'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-gray-500 hover:text-violet">
      Sign Out
    </Button>
  )
}
