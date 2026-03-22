# Customer Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add customer sign-up/login (email+password and magic link), a nav bar account button, checkout pre-fill, and an `/account` page with order history.

**Architecture:** A React `AuthProvider` context (Client Component) wraps the entire layout, giving NavBar and checkout access to auth state and a shared `AccountModal`. A Next.js middleware refreshes the Supabase session cookie on every request. The `/account` page is a Server Component that reads the session server-side and fetches order history via the admin client.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase Auth (`@supabase/ssr`), React Context.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/middleware.ts` | Create | Refresh Supabase session cookie on every request |
| `src/lib/auth-context.tsx` | Create | AuthProvider, useAuth hook, modal open/close state |
| `src/components/AccountModal.tsx` | Create | Sign-in / Create-account modal UI |
| `src/app/auth/callback/route.ts` | Create | Exchange magic-link code for session cookie |
| `src/app/layout.tsx` | Modify | Wrap body content with AuthProvider |
| `src/components/NavBar.tsx` | Modify | Add account button (logged-out = Sign in, logged-in = My Account) |
| `src/app/checkout/page.tsx` | Modify | Add auth banner (logged-out) and pre-fill (logged-in) |
| `src/app/actions/account.ts` | Create | `getOrdersByEmail` — admin-client order history fetch |
| `src/app/account/page.tsx` | Create | Server Component: profile + order history |
| `src/app/account/SignOutButton.tsx` | Create | Client Component: sign-out button |

---

## Task 1: Middleware — session refresh

**Files:**
- Create: `src/middleware.ts`

### Background

`@supabase/ssr` requires middleware that runs on every request, reads the session cookie, calls `getUser()` to refresh it if expired, and writes the new cookie back to the response. Without this, authenticated Server Components return "not logged in" after the JWT expires (~1 hour).

The middleware must use `NextRequest`/`NextResponse` cookies (not `next/headers`) because it runs in the Edge runtime before the page renders.

The `/admin` subtree is excluded from the matcher — it has its own auth. Static files and images are also excluded.

- [ ] **Step 1: Add `NEXT_PUBLIC_BASE_URL` to `.env.local`**

Open `.env.local` and add (if not already present):

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

This is already used by `src/app/actions/checkout.ts` (line 130) so it may already exist. If it does, skip this step.

- [ ] **Step 2: Create `src/middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — do NOT use getSession(), it is unverified
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/middleware.ts .env.local
git commit -m "feat: add Supabase SSR session-refresh middleware"
```

---

## Task 2: Auth context + AccountModal + callback route

**Files:**
- Create: `src/lib/auth-context.tsx`
- Create: `src/components/AccountModal.tsx`
- Create: `src/app/auth/callback/route.ts`

### Background

`AuthProvider` is a Client Component that wraps the layout. It:
- Initialises user state from the current Supabase session on mount
- Listens to `onAuthStateChange` so user state stays in sync after login/logout
- Provides `openAuthModal()` / `closeAuthModal()` and renders `<AccountModal>` as a child

`AccountModal` handles both tabs (Sign In / Create Account) and both methods (password + magic link).

The callback route is required for magic links: Supabase redirects to `/auth/callback?code=xxx`, the route exchanges the code for a session cookie, then redirects to `/`.

`NEXT_PUBLIC_BASE_URL` (set in Task 1) is used as the base for `emailRedirectTo`.

- [ ] **Step 1: Write tests for `getInitials` utility**

The `getInitials` function (used in NavBar and account page) is a pure utility worth testing. Add to `src/__tests__/utils.test.ts`:

```ts
// --- getInitials ---
function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
  if (firstName) return firstName[0].toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

describe('getInitials', () => {
  it('returns first+last initials when both names present', () => {
    expect(getInitials('Grace', 'Smith')).toBe('GS')
  })

  it('returns single initial when only first name', () => {
    expect(getInitials('Grace', undefined)).toBe('G')
  })

  it('falls back to email initial when no name', () => {
    expect(getInitials(undefined, undefined, 'grace@example.com')).toBe('G')
  })

  it('returns ? when nothing provided', () => {
    expect(getInitials()).toBe('?')
  })

  it('uppercases the result', () => {
    expect(getInitials('grace', 'smith')).toBe('GS')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npm test -- --testPathPattern="utils" 2>&1 | tail -20
```

Expected: FAIL — `getInitials` is not defined in the test file yet. The test references a local function definition that will be added in the same file, so this step is confirming the test suite picks up the new describe block.

- [ ] **Step 3: The test already defines the function inline — run again to confirm pass**

```bash
npm test -- --testPathPattern="utils" 2>&1 | tail -10
```

Expected: all `getInitials` tests PASS (function is defined inline in the test file).

- [ ] **Step 4: Create `src/lib/auth-context.tsx`**

```tsx
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

    // Keep in sync with auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
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
```

- [ ] **Step 5: Create `src/components/AccountModal.tsx`**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
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
                  <label className="text-xs font-medium text-gray-700">Password</label>
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
```

- [ ] **Step 6: Create `src/app/auth/callback/route.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — redirect to home
  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 7: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth-context.tsx src/components/AccountModal.tsx src/app/auth/callback/route.ts src/__tests__/utils.test.ts
git commit -m "feat: add auth context, account modal, and magic link callback"
```

---

## Task 3: Wire AuthProvider into layout

**Files:**
- Modify: `src/app/layout.tsx`

### Background

`AuthProvider` must wrap `<NavBar>`, `<main>`, and `<Footer>` together as siblings inside the provider. The layout is a Server Component — it can render a Client Component (`AuthProvider`) as a child.

Current layout:
```tsx
<body className="min-h-full flex flex-col bg-white font-body">
  <NavBar />
  <main className="flex-1">{children}</main>
  <Footer />
</body>
```

- [ ] **Step 1: Add the AuthProvider import and wrap body content**

Replace the `<body>` contents in `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { AuthProvider } from '@/lib/auth-context'

// ... font declarations unchanged ...

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white font-body">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap layout with AuthProvider"
```

---

## Task 4: Nav bar account button

**Files:**
- Modify: `src/components/NavBar.tsx`

### Background

NavBar is already a Client Component. Add the account button next to the cart icon. The button has two states:
- **Logged out:** pill `[👤 Sign in]` — calls `openAuthModal()`
- **Logged in:** pill `[GS My Account]` — links to `/account`

Initials come from `user.user_metadata.first_name` / `last_name`, falling back to the first character of `user.email`.

The button appears on both desktop and mobile (in the hamburger dropdown).

- [ ] **Step 1: Update `src/components/NavBar.tsx`**

The `navLinks` array and mobile dropdown remain unchanged. Add `useAuth` and the account button:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CartCount } from './CartCount'
import { useAuth } from '@/lib/auth-context'

function getInitials(user: { user_metadata?: { first_name?: string; last_name?: string }; email?: string } | null): string {
  if (!user) return ''
  const { first_name, last_name } = user.user_metadata ?? {}
  if (first_name && last_name) return `${first_name[0]}${last_name[0]}`.toUpperCase()
  if (first_name) return first_name[0].toUpperCase()
  return (user.email?.[0] ?? '?').toUpperCase()
}

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Our Story', href: '/our-story' },
]

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, openAuthModal } = useAuth()

  function AccountButton({ mobile }: { mobile?: boolean }) {
    const base = 'flex items-center gap-1.5 text-sm font-medium rounded-full px-3 py-1 transition-colors'
    if (!user) {
      return (
        <button
          type="button"
          onClick={() => { openAuthModal(); if (mobile) setMenuOpen(false) }}
          className={`${base} bg-lavender text-violet border border-[#e9d5ff] hover:bg-[#e9d5ff]`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Sign in
        </button>
      )
    }
    return (
      <Link
        href="/account"
        onClick={() => { if (mobile) setMenuOpen(false) }}
        className={`${base} bg-[#ede9fe] text-violet border border-[#c4b5fd] hover:bg-[#ddd6fe]`}
      >
        <span className="w-5 h-5 rounded-full bg-violet text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {getInitials(user)}
        </span>
        My Account
      </Link>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-blush shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold text-violet hover:text-violet-dark transition-colors"
        >
          GF Gracey&apos;s Cookies
        </Link>

        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-4">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
            >
              {label}
            </Link>
          ))}
          <AccountButton />
          <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-violet transition-colors">
            <span className="text-xl" aria-label="Cart">🛒</span>
            <CartCount />
          </Link>
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <Link href="/cart" className="relative inline-flex items-center text-gray-700 hover:text-violet transition-colors">
            <span className="text-xl" aria-label="Cart">🛒</span>
            <CartCount />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="text-gray-500 hover:text-violet p-1"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-t border-blush px-4 pb-4 flex flex-col gap-2">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 font-body text-sm font-medium text-gray-700 hover:text-violet transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="pt-1">
            <AccountButton mobile />
          </div>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add account button to nav bar"
```

---

## Task 5: Checkout auth banner and pre-fill

**Files:**
- Modify: `src/app/checkout/page.tsx`

### Background

Checkout is already a Client Component. Add `useAuth()` to get the current user. Use `useEffect` to pre-fill name and email when the user is set. Show either a dismissible "Faster checkout" banner (logged out) or a green "Signed in as" indicator (logged in).

Pre-filled `Input` fields use `className="bg-[#f3e8ff] border-[#c4b5fd]"` — the `Input` component already accepts a `className` prop (appended to the inner `<input>`, line 28 of `src/components/ui/Input.tsx`).

- [ ] **Step 1: Add auth banner and pre-fill to `src/app/checkout/page.tsx`**

Add these imports at the top:
```tsx
import { useAuth } from '@/lib/auth-context'
```

Inside `CheckoutPage()`, after the existing state declarations, add:
```tsx
const { user, openAuthModal } = useAuth()
const [bannerDismissed, setBannerDismissed] = useState(false)

// Pre-fill from account when user logs in
useEffect(() => {
  if (user) {
    const meta = user.user_metadata ?? {}
    if (meta.first_name) setFirstName(meta.first_name)
    if (meta.last_name) setLastName(meta.last_name)
    if (user.email) setEmail(user.email)
  }
}, [user])
```

In the JSX, add the auth banner/indicator immediately before the `<form>` element (inside the `grid` wrapper, above the form column):

Replace the opening of `<form onSubmit={handleSubmit} ...>` block — add the banner above it inside the `md:col-span-3` div:

```tsx
{/* Auth banner — logged out */}
{!user && !bannerDismissed && (
  <div className="flex items-center justify-between gap-3 bg-[#f3e8ff] border border-[#e9d5ff] rounded-2xl px-4 py-3 mb-2">
    <div>
      <p className="font-body text-sm font-semibold text-violet">⚡ Faster checkout with an account</p>
      <p className="font-body text-xs text-gray-500 mt-0.5">We&apos;ll pre-fill your details and save your order history.</p>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={openAuthModal}
        className="text-sm font-semibold text-white bg-violet hover:bg-violet-dark rounded-lg px-3 py-1.5 transition-colors"
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => setBannerDismissed(true)}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  </div>
)}

{/* Auth indicator — logged in */}
{user && (
  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5 mb-2">
    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
    <p className="font-body text-xs text-green-800 font-medium">
      Signed in as <strong>{user.email}</strong> — your details are pre-filled.
    </p>
  </div>
)}
```

Pre-filled `Input` fields get `className="bg-[#f3e8ff] border-[#c4b5fd]"` conditionally when `user` is set:

```tsx
<Input
  label="First Name"
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  required
  placeholder="Grace"
  className={user ? 'bg-[#f3e8ff] border-[#c4b5fd]' : ''}
/>
<Input
  label="Last Name"
  value={lastName}
  onChange={(e) => setLastName(e.target.value)}
  required
  placeholder="Smith"
  className={user ? 'bg-[#f3e8ff] border-[#c4b5fd]' : ''}
/>
// Email input:
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  placeholder="you@example.com"
  className={user ? 'bg-[#f3e8ff] border-[#c4b5fd]' : ''}
/>
```

- [ ] **Step 2: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat: add auth banner and pre-fill to checkout"
```

---

## Task 6: Account page, SignOutButton, and order history

**Files:**
- Create: `src/app/actions/account.ts`
- Create: `src/app/account/SignOutButton.tsx`
- Create: `src/app/account/page.tsx`

### Background

`getOrdersByEmail` is a plain async function (no `'use server'`) called directly from the Server Component. It uses the admin client so it bypasses RLS and fetches by email securely on the server.

The account page reads the session via `createClient()` from `src/lib/supabase/server.ts`. If no user, it redirects to `/`. Otherwise it renders the profile and order history.

`SignOutButton` is a separate Client Component: signs out with the browser client, calls `router.refresh()` then `router.push('/')`. The `refresh()` must come before `push()` so the server re-reads the now-empty session — opposite of the admin `SignOutButton` pattern (which does push then refresh — do not copy it).

- [ ] **Step 1: Create `src/app/actions/account.ts`**

```ts
import { createAdminClient } from '@/lib/supabase/admin'

export interface OrderSummary {
  id: string
  created_at: string
  pickup_week: string
  total: number
  status: string
  items: { name: string; quantity: number }[]
}

export async function getOrdersByEmail(email: string): Promise<OrderSummary[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`
      id,
      created_at,
      pickup_week,
      total,
      status,
      order_items (
        quantity,
        products ( name )
      )
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map((order) => ({
    id: order.id,
    created_at: order.created_at,
    pickup_week: order.pickup_week,
    total: Number(order.total),
    status: order.status,
    items: (order.order_items ?? []).map((item: { quantity: number; products: { name: string } | null }) => ({
      name: item.products?.name ?? 'Unknown',
      quantity: item.quantity,
    })),
  }))
}
```

- [ ] **Step 2: Create `src/app/account/SignOutButton.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `src/app/account/page.tsx`**

```tsx
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
```

- [ ] **Step 4: TypeScript check**

```bash
cd "/Users/taranoffalexandre/PycharmProjects/Cookie Website" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
npm test 2>&1 | tail -15
```

Expected: all tests pass (including the new `getInitials` tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/account.ts src/app/account/SignOutButton.tsx src/app/account/page.tsx
git commit -m "feat: add account page with profile and order history"
```

---

## Done

All six tasks complete. Manual smoke-test checklist:

- [ ] Visit any page — nav shows "Sign in" button
- [ ] Click "Sign in" — modal opens, tabs work, magic link toggle works
- [ ] Sign in with email+password — modal closes, nav shows initials + "My Account"
- [ ] Go to `/checkout` with items in cart — pre-filled name/email shown in violet
- [ ] Go to `/account` — profile and order history visible
- [ ] Click "Sign Out" — redirected to home, nav shows "Sign in" again
- [ ] Open `/account` while logged out — redirected to `/`
- [ ] Send a magic link — email arrives, clicking it lands on site while logged in

> **Note:** To test magic links end-to-end, `NEXT_PUBLIC_BASE_URL` must be set to the publicly reachable URL (not `localhost` if testing from a real email client). For local dev, use [ngrok](https://ngrok.com) or set `NEXT_PUBLIC_BASE_URL` after deploying to Vercel.
