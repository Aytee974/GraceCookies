'use client'

import type { Metadata } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordReset } from '@/app/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await sendPasswordReset(email)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
  }

  return (
    <div className="flex flex-col pb-16">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-violet">Forgot Password</h1>
        <p className="font-body text-sm text-gray-500 mt-2">
          Enter your email and we'll send you a reset link.
        </p>
      </section>

      {/* Card */}
      <div className="max-w-md mx-auto w-full px-4 sm:px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-violet">Reset your password</h2>
          </div>

          <div className="px-6 py-6">
            {success ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-3">✉️</p>
                <p className="font-body text-sm font-medium text-gray-700">
                  Check your email for a reset link.
                </p>
                <p className="font-body text-xs text-gray-400 mt-1">
                  Didn't get it? Check your spam folder.
                </p>
                <Link
                  href="/"
                  className="inline-block mt-5 text-sm font-semibold text-violet hover:underline"
                >
                  ← Back to home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Remember it?{' '}
                  <Link href="/" className="text-violet font-semibold hover:underline">
                    Sign in →
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
