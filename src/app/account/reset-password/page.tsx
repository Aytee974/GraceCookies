'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/app/actions/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const result = await resetPassword(password)
    setLoading(false)

    if (result.error) {
      if (
        result.error.toLowerCase().includes('expired') ||
        result.error.toLowerCase().includes('invalid') ||
        result.error.toLowerCase().includes('session')
      ) {
        setError('This reset link has expired or is invalid. Please request a new one.')
      } else {
        setError(result.error)
      }
      return
    }

    router.push('/account')
    router.refresh()
  }

  return (
    <div className="flex flex-col pb-16">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-violet">Set New Password</h1>
        <p className="font-body text-sm text-gray-500 mt-2">
          Choose a strong password for your account.
        </p>
      </section>

      {/* Card */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-violet">Choose a new password</h2>
          </div>

          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-blush-dark px-3 py-2 text-sm focus:outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}{' '}
                  {error.includes('expired') && (
                    <a href="/account/forgot-password" className="underline font-semibold">
                      Request a new link
                    </a>
                  )}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-violet text-white font-semibold text-sm hover:bg-violet-dark transition-colors disabled:opacity-60"
              >
                {loading ? 'Saving…' : 'Update Password →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
