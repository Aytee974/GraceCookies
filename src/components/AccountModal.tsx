'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Tab = 'signin' | 'signup'
type SignInMethod = 'password' | 'magic'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const [tab, setTab] = useState<Tab>('signin')
  const [signInMethod, setSignInMethod] = useState<SignInMethod>('password')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const overlayRef = useRef<HTMLDivElement>(null)

  // Reset form when tab changes
  useEffect(() => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setSignInMethod('password')
  }, [tab])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const emailRedirectTo = `${baseUrl}/auth/callback`

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (signInMethod === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      })
      setLoading(false)
      if (error) return setError(error.message)
      setSuccess('Check your email — we sent you a sign-in link.')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) return setError(error.message)
    onClose()
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    if (signInMethod === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          data: { first_name: firstName, last_name: lastName },
        },
      })
      setLoading(false)
      if (error) return setError(error.message)
      setSuccess('Check your email — we sent you a sign-up link.')
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { first_name: firstName, last_name: lastName },
      },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSuccess('Account created! Check your email to confirm.')
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4"
          style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
        >
          <h2 className="font-display text-xl font-bold text-violet">
            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t
                  ? 'text-violet border-violet'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-2">✉️</p>
              <p className="font-body text-sm text-gray-700 font-medium">{success}</p>
            </div>
          ) : (
            <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-3">
              {tab === 'signup' && signInMethod === 'password' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">First Name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="Grace"
                      className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">Last Name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="Smith"
                      className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                />
              </div>

              {signInMethod === 'password' && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-700">Password</label>
                    {tab === 'signin' && (
                      <Link
                        href="/account/forgot-password"
                        onClick={onClose}
                        className="text-xs text-violet hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet text-white font-semibold text-sm hover:bg-violet-dark transition-colors disabled:opacity-60"
              >
                {loading
                  ? 'Please wait…'
                  : tab === 'signin'
                  ? 'Sign In →'
                  : 'Create Account →'}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400 my-1">
                <span className="flex-1 h-px bg-gray-100" />
                or
                <span className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                type="button"
                onClick={() => setSignInMethod(signInMethod === 'password' ? 'magic' : 'password')}
                className="w-full py-2.5 rounded-xl border border-[#e9d5ff] text-violet font-semibold text-sm hover:bg-lavender transition-colors"
              >
                {signInMethod === 'password'
                  ? '✉️ Send me a magic link instead'
                  : '🔑 Use password instead'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 pb-5 text-center text-xs text-gray-400">
            {tab === 'signin' ? (
              <>No account?{' '}
                <button onClick={() => setTab('signup')} className="text-violet font-semibold">
                  Create one →
                </button>
              </>
            ) : (
              <>Already have one?{' '}
                <button onClick={() => setTab('signin')} className="text-violet font-semibold">
                  Sign in →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
