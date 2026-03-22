# Customer Accounts — Design Spec

**Date:** 2026-03-21
**Status:** Ready for Review

---

## Overview

Add customer accounts to GF Gracey's Cookies. Customers can sign up / log in via email+password or magic link. The nav bar gains an account button (top right). Checkout pre-fills name and email for logged-in users. A `/account` page shows profile and order history.

Guest checkout remains fully supported — auth is an offer, not a gate.

---

## Goals

- Let customers create accounts and log in (email+password or magic link)
- Pre-fill checkout form with account details
- Show order history on `/account`
- Account button in nav bar (sign-in state + logged-in state)

---

## Non-Goals

- No social login (Google, Apple, etc.)
- No email preferences / notifications
- No admin management of customer accounts
- No profile editing UI (read-only profile display)
- No password reset UI (Supabase handles this via email)

---

## Auth Provider

### Technology
Supabase Auth via the existing `@supabase/ssr` setup (`src/lib/supabase/server.ts` and `src/lib/supabase/client.ts`). No new dependencies required.

### User data storage
First name and last name are stored in Supabase Auth `user_metadata` (`{ first_name, last_name }`). No new database tables are needed.

### Auth methods
- Email + password (Supabase built-in, bcrypt-hashed)
- Magic link (Supabase built-in, expires in 1 hour, single-use)

---

## Architecture

### Middleware (`src/middleware.ts`) — REQUIRED

`@supabase/ssr` requires a Next.js middleware file to refresh the session cookie on every request. Without it, the JWT expires (default: 1 hour) and server-side auth checks silently return "not logged in" for active users.

The middleware must:
- Create a Supabase server client that reads and writes cookies from the `request`/`response` objects (not `next/headers`)
- Call `supabase.auth.getUser()` to trigger session refresh
- Return the modified response with the refreshed cookies

Refer to `node_modules/next/dist/docs/` for the exact current `@supabase/ssr` middleware pattern (per AGENTS.md). The middleware should match all routes except `_next/static`, `_next/image`, `favicon.ico`, and the `/admin` subtree (which has its own auth flow).

Add `src/middleware.ts` to the matcher config.

### Auth Context (`src/lib/auth-context.tsx`)
A client-side React context that:
- Holds the current Supabase `User | null`
- Exposes `openAuthModal()` and `closeAuthModal()` functions
- Exposes `signOut()` function
- Listens to `onAuthStateChange` to keep user state in sync

Provides the `useAuth()` hook consumed by NavBar, checkout page, and account page.

### AuthProvider placement
`src/app/layout.tsx` wraps **all body content** (NavBar, main, Footer) with `<AuthProvider>`. The root layout is a Server Component — it can render `<AuthProvider>` (a Client Component) as a child without issue.

**Important:** `<AuthProvider>` must be the outer wrapper around `<NavBar />`, `<main>`, and `<Footer />` together — not just `<main>`. NavBar consumes `useAuth()` and will throw a context error if it is outside the provider boundary.

```tsx
// layout.tsx — correct wrapping
<body className="...">
  <AuthProvider>
    <NavBar />
    <main className="flex-1">{children}</main>
    <Footer />
  </AuthProvider>
</body>
```

### AccountModal (`src/components/AccountModal.tsx`)
Client Component. Rendered inside `<AuthProvider>` (e.g. as a child of AuthProvider itself) so it shares modal open/close state. Contains:
- Two tabs: **Sign In** | **Create Account**
- Sign In tab: email + password fields + "Send me a magic link" button
- Create Account tab: first name, last name, email, password + "Sign up with a magic link" option
- On success: modal closes, `onAuthStateChange` fires, NavBar updates automatically

**Magic link `emailRedirectTo`:** Both magic link call sites (sign-in and sign-up) must pass:
```ts
emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
```
Without this, Supabase sends the user to its own hosted redirect URL, the `/auth/callback` route is never hit, and the session cookie is never set. `NEXT_PUBLIC_BASE_URL` must be set in `.env.local` (e.g. `http://localhost:3000` for dev, the production URL for prod).

### Magic link callback (`src/app/auth/callback/route.ts`)
GET route that exchanges the Supabase `code` param for a session cookie. Required for magic links and email confirmation to work with SSR. Follows the standard `@supabase/ssr` pattern.

- Reads `code` from URL search params
- Calls `supabase.auth.exchangeCodeForSession(code)`
- Redirects to `next` param or `/`

For the sign-up magic link flow, after the code is exchanged the user lands on `/` (or `next` if specified). The `/account` page can be set as `next` in the `emailRedirectTo` if desired, but `/` is acceptable for the MVP.

---

## Nav Bar Changes (`src/components/NavBar.tsx`)

The NavBar is already a Client Component. Add auth state via `useAuth()`.

**Logged-out state:** Show a pill button `[👤 Sign in]` — violet background, opens `AccountModal`.

**Logged-in state:** Show a pill button with user initials + "My Account" — links to `/account`. Initials derived from `user_metadata.first_name` and `user_metadata.last_name`. Fallback to first character of `user.email` for magic-link-only users who did not go through the Create Account form (which requires name fields).

Button is positioned to the right of the nav links, left of the cart icon — same on desktop and mobile dropdown.

---

## Checkout Page Changes (`src/app/checkout/page.tsx`)

The checkout page is currently a Client Component. It gains auth awareness via `useAuth()`.

### Logged-out state
Show a banner above the "Your Details" form card:
- Background: lavender (`#f3e8ff`), border: `#e9d5ff`
- Text: "⚡ Faster checkout with an account" + sub-text "We'll pre-fill your details and save your order history."
- "Sign in" button — opens `AccountModal`
- Banner can be dismissed (hidden for the session via local state), it does not block checkout

### Logged-in state
- Show a green "Signed in as [email]" indicator above the form
- Pre-fill `firstName`, `lastName`, and `email` fields from `user_metadata` and `user.email` on mount (via `useEffect` when `user` changes)
- Phone field remains empty (not stored in profile)
- Pre-filled fields use the `Input` component with a conditional `className` prop for light violet background (`bg-[#f3e8ff] border-[#c4b5fd]`). If the existing `Input` component does not accept a `className` prop on the `<input>` element, it must be extended to accept `inputClassName` or similar before this can be implemented.

---

## Account Page (`src/app/account/page.tsx`)

Server Component. Reads the Supabase session server-side via `createClient()` from `src/lib/supabase/server.ts`.

**If not logged in:** Redirect to `/`. This is acceptable UX for the MVP — customers who click a magic link and land here after the callback will already be authenticated.

**If logged in:** Render the account page with:

### Hero section
- Lavender/blush gradient (same inline style as homepage/Our Story: `linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)`)
- Large violet avatar circle with user initials
- User's full name (`first_name last_name`)
- User's email

### Profile card
- Read-only display of first name, last name, email
- No edit button (out of scope)

### Order History card
- Fetched server-side by calling `getOrdersByEmail(user.email)` directly (plain async import, no `'use server'` needed since it is called from a Server Component)
- Displayed newest-first
- Each row: order date, items summary (product name × qty), pickup week, total, status badge
- If no orders: empty state "No orders yet — start shopping!"

### Sign Out button (`src/app/account/SignOutButton.tsx`)
Separate Client Component (so the page stays a Server Component). On click:
1. Calls `supabase.signOut()` from the browser client
2. Calls `router.refresh()` to invalidate the server-side session cache
3. Calls `router.push('/')` to return to homepage

The `router.refresh()` call before redirect ensures the root layout re-renders without a stale session cookie. Without it, the NavBar may briefly still show "My Account" before the next hard navigation.

---

## Order History Data Fetching

New module: `src/app/actions/account.ts`

```ts
// Plain async function — called from Server Component, no 'use server' needed
export async function getOrdersByEmail(email: string) {
  // Uses createAdminClient() — service role, server-side only
  // Returns orders with items and product names, ordered by created_at DESC
}
```

This preserves the existing security model: the service role key never leaves the server, anon users retain zero DB access to orders.

The `orders` table already has a `customer_email` column — no schema changes needed.

---

## Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `src/middleware.ts` | Create | Session refresh on every request — required for SSR auth |
| `src/lib/auth-context.tsx` | Create | AuthProvider, useAuth hook, AccountModal state |
| `src/components/AccountModal.tsx` | Create | Sign in / Create account modal |
| `src/app/auth/callback/route.ts` | Create | Magic link + email confirmation callback |
| `src/app/account/page.tsx` | Create | Server Component account page |
| `src/app/account/SignOutButton.tsx` | Create | Client Component sign-out button |
| `src/app/actions/account.ts` | Create | getOrdersByEmail plain async function |
| `src/app/layout.tsx` | Modify | Wrap NavBar + main + Footer with AuthProvider |
| `src/components/NavBar.tsx` | Modify | Add account button (uses useAuth) |
| `src/app/checkout/page.tsx` | Modify | Add auth banner + pre-fill logic |
| `src/components/ui/Input.tsx` | Modify (if needed) | Add inputClassName prop for pre-fill styling |

---

## Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
Set to the production URL on deployment. Used as the base for `emailRedirectTo` in magic link calls.

---

## Security Notes

- Service role key only used in `src/app/actions/account.ts` via `createAdminClient()` — never exposed to the client
- Anon key cannot read orders (unchanged from existing setup)
- Magic links expire in 1 hour, are single-use (Supabase default)
- Passwords hashed by Supabase (bcrypt) — never stored or logged by the app
- Order history fetched by email match server-side — customers only see orders matching their verified Supabase email
- Supabase requires email confirmation before issuing a session (default behaviour) — this prevents a user from signing up with someone else's email and accessing their order history. Confirm this setting is enabled in the Supabase project dashboard (Auth → Settings → "Enable email confirmations")

---

## Out of Scope

- Profile editing
- Password change UI (Supabase sends reset emails automatically)
- Order cancellation
- Admin view of customer accounts
- Social login providers
