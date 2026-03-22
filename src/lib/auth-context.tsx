'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AccountModal } from '@/components/AccountModal'

interface AuthContextValue {
  user: User | null
  openAuthModal: () => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Initialise from current session
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))

    // Keep in sync with auth state changes — auto-close modal on sign-in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN') setModalOpen(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = useCallback(() => setModalOpen(true), [])
  const closeAuthModal = useCallback(() => setModalOpen(false), [])

  return (
    <AuthContext.Provider value={{ user, openAuthModal, closeAuthModal }}>
      {children}
      <AccountModal isOpen={modalOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  )
}
