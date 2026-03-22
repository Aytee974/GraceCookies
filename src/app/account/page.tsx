import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrdersByEmail } from '@/app/actions/account'
import { SignOutButton } from './SignOutButton'

export const metadata: Metadata = {
  title: "My Account | GF Gracey's Cookies",
  description: 'Your account and order history.',
}

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  return (email?.[0] ?? '?').toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatPickup(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-CA', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pending',    className: 'bg-gray-100 text-gray-600' },
  paid:      { label: 'Paid',       className: 'bg-blue-50 text-blue-700' },
  ready:     { label: 'Ready',      className: 'bg-yellow-50 text-yellow-700' },
  fulfilled: { label: 'Picked up', className: 'bg-[#f3e8ff] text-violet' },
  cancelled: { label: 'Cancelled',  className: 'bg-red-50 text-red-600' },
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const meta = user.user_metadata ?? {}
  const firstName: string = meta.first_name ?? ''
  const lastName: string = meta.last_name ?? ''
  const initials = getInitials(firstName, lastName, user.email)
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user.email

  const orders = await getOrdersByEmail(user.email!)

  return (
    <div className="flex flex-col pb-16">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-4 py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <div className="w-16 h-16 rounded-full bg-violet text-white font-display text-2xl font-bold flex items-center justify-center mb-3">
          {initials}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-violet">{displayName}</h1>
        <p className="font-body text-sm text-gray-500 mt-1">{user.email}</p>
      </section>

      {/* Content */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 -mt-8 flex flex-col gap-4">

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-violet">My Profile</h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-3 gap-4">
            {[
              { label: 'First Name', value: firstName || '—' },
              { label: 'Last Name', value: lastName || '—' },
              { label: 'Email', value: user.email ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="font-body text-sm font-medium text-gray-800 break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order history */}
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="font-display text-lg font-bold text-violet">Order History</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-4xl mb-3">🍪</p>
              <p className="font-body text-sm text-gray-500 mb-4">No orders yet — start shopping!</p>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={order.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-gray-800 truncate">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                      </p>
                      <p className="font-body text-xs text-gray-400 mt-0.5">
                        {formatDate(order.created_at)} · Pickup {formatPickup(order.pickup_week)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="font-display font-bold text-gold text-sm">
                        ${order.total.toFixed(2)}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <SignOutButton />
      </div>
    </div>
  )
}
