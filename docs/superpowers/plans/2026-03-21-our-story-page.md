# Our Story Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a static `/our-story` page with a personal letter from Gracey, linked from the nav bar and footer.

**Architecture:** Three independent file changes — a new Server Component page at `src/app/our-story/page.tsx`, a one-line addition to the `navLinks` array in `NavBar.tsx`, and a new `<a>` element in `Footer.tsx`. No data fetching, no new dependencies.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4 (@theme tokens), Google Fonts (already loaded via root layout).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/our-story/page.tsx` | Create | The full Our Story page — hero section + letter card |
| `src/components/NavBar.tsx` | Modify | Add Our Story to `navLinks` array |
| `src/components/Footer.tsx` | Modify | Add Our Story plain-text link between socials and copyright |

---

## Task 1: Create the Our Story page

**Files:**
- Create: `src/app/our-story/page.tsx`

### Background

The project uses Next.js 15 App Router. Pages in `src/app/` are Server Components by default (no `'use client'` needed). The root `layout.tsx` wraps every page in `<NavBar>`, `<main>`, and `<Footer>` automatically — the page component only needs to return the content that goes inside `<main>`.

Tailwind CSS v4 is used. Custom tokens are defined in `globals.css` via `@theme`:
- `text-violet` → #7c3aed
- `font-display` → Playfair Display
- `font-body` → Inter

The hero uses the same inline `style` prop pattern as the homepage (`src/app/page.tsx` line 61).

- [ ] **Step 1: Create the page file**

Create `src/app/our-story/page.tsx` with this exact content:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Our Story | GF Gracey's Cookies",
  description:
    "The story behind GF Gracey's — why we bake gluten-free and what drives every batch.",
}

export default function OurStoryPage() {
  return (
    <div className="flex flex-col pb-16">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28"
        style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-violet leading-tight">
          Our Story
        </h1>
        <p className="font-body text-lg text-gray-500 italic mt-3">
          Why we bake the way we do.
        </p>
      </section>

      {/* Letter card */}
      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 -mt-12">
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(124,58,237,.08)] px-8 sm:px-14 py-12">
          {/* TODO: replace with Gracey's real story */}
          <p className="font-body text-base sm:text-lg leading-relaxed text-gray-700 mb-5">
            When I was first told I couldn&apos;t eat gluten, my first thought wasn&apos;t about
            pasta or bread. It was about cookies. The kind you grow up with — warm, a little too
            sweet, the ones that make a Tuesday feel like a celebration.
          </p>
          <p className="font-body text-base sm:text-lg leading-relaxed text-gray-700 mb-5">
            I tried everything I could find. Rice flour bricks. Chalky protein bars masquerading
            as dessert. Things that were technically edible but brought no joy. And I thought: this
            isn&apos;t right. Food should bring people together, not remind you of what you&apos;re
            missing.
          </p>
          <p className="font-body text-base sm:text-lg leading-relaxed text-gray-700 mb-5">
            So I started baking. Quietly, in my own kitchen, with too many failed batches and a
            lot of patience. I wanted to make something that didn&apos;t taste like a compromise.
            Something I&apos;d be proud to serve to anyone — celiac or not.
          </p>
          <p className="font-body text-base sm:text-lg leading-relaxed text-gray-700 mb-5">
            That&apos;s still what drives every batch at GF Gracey&apos;s. Not dietary labels. Not
            trends. Just the belief that everyone deserves a cookie worth eating.
          </p>
          <p className="font-body text-base sm:text-lg leading-relaxed text-gray-700 mb-5">
            Thank you for being here.
          </p>
          <p className="font-display italic text-xl text-violet mt-8">
            &mdash; Gracey
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the page renders**

Run the dev server and open http://localhost:3000/our-story in a browser.

```bash
npm run dev
```

Check:
- Hero section visible with lavender-to-blush gradient
- "Our Story" title in Playfair Display, violet
- White letter card overlapping the hero by ~3rem
- Placeholder letter text renders correctly
- No TypeScript errors in the terminal

- [ ] **Step 3: Commit**

```bash
git add src/app/our-story/page.tsx
git commit -m "feat: add Our Story page with placeholder letter"
```

---

## Task 2: Add Our Story to the NavBar

**Files:**
- Modify: `src/components/NavBar.tsx` (lines 7–9, the `navLinks` array)

### Background

`NavBar.tsx` is a Client Component (`'use client'`). Navigation links are driven by the `navLinks` array at the top of the file. Both the desktop nav and the mobile hamburger dropdown use the same array via `.map()` — adding one entry here updates both automatically. The cart icon is rendered separately after the map and is unaffected.

- [ ] **Step 1: Add the Our Story link to `navLinks`**

In `src/components/NavBar.tsx`, find the `navLinks` array (lines 7–9):

```ts
const navLinks = [
  { label: 'Shop', href: '/shop' },
]
```

Change it to:

```ts
const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Our Story', href: '/our-story' },
]
```

- [ ] **Step 2: Verify in browser**

With the dev server still running (or restart it), check http://localhost:3000:
- Desktop: "Shop" and "Our Story" appear in the nav bar, left of the cart icon
- Mobile (resize window to < 640px): both links appear in the hamburger dropdown; tapping "Our Story" closes the menu and navigates to `/our-story`

- [ ] **Step 3: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add Our Story link to nav bar"
```

---

## Task 3: Add Our Story link to the Footer

**Files:**
- Modify: `src/components/Footer.tsx` (between lines 41 and 43)

### Background

`Footer.tsx` is a Server Component. Its outer container is a `flex flex-col` div. The structure is:
1. The social/contact links `<div>` (closes at line 41)
2. The copyright `<p>` (line 43)

The new link goes between these two as a direct child of the outer flex column. All existing footer links use raw hex classes (`text-[#7c3aed] hover:text-[#6d28d9]`) — the new link must match this pattern exactly. Do **not** use semantic tokens (`text-violet`) here.

- [ ] **Step 1: Add the Our Story anchor element**

In `src/components/Footer.tsx`, find the closing of the social links div and the copyright paragraph (around lines 41–43):

```tsx
        </div>

        <p className="font-body text-sm text-violet">
```

Insert a new `<a>` element between them:

```tsx
        </div>

        <a
          href="/our-story"
          className="font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
        >
          Our Story
        </a>

        <p className="font-body text-sm text-violet">
```

- [ ] **Step 2: Verify in browser**

Check http://localhost:3000 (any page, since the footer is on every page):
- "Our Story" text link appears between the social icons row and the copyright line
- It is violet, underline-free, and turns darker on hover
- Clicking it navigates to `/our-story`

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add Our Story link to footer"
```

---

## Done

All three tasks complete. The `/our-story` route is live, linked from both nav and footer, with placeholder letter content ready for Gracey to replace.

**To replace the placeholder text:** edit `src/app/our-story/page.tsx` and swap out the five `<p>` elements and the sign-off `<p>` between the `{/* TODO */}` comment and the closing `</div>` of the letter card.
