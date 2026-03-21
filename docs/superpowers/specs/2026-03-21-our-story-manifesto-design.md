# Our Story / Manifesto Page — Design Spec

**Date:** 2026-03-21
**Status:** Ready for Final Approval

---

## Overview

Add a new `/our-story` page to GF Gracey's Cookies website. This page tells the personal story behind the brand — why gluten-free, why homemade, why it matters — in a warm, first-person letter format. It serves as the brand's emotional anchor and helps customers connect with the baker behind the cookies.

---

## Goals

- Give customers a reason to trust and care about the brand beyond the product
- Share the personal gluten-intolerance/celiac origin story authentically
- Feel like a heartfelt letter, not a marketing page

---

## Non-Goals

- No e-commerce functionality on this page
- No structured "values" section or pull quotes — pure flowing letter
- Not a blog or news section

---

## Navigation

### NavBar
- Add "Our Story" to the `navLinks` array in `NavBar.tsx`, positioned before the cart icon
- Use `{ label: 'Our Story', href: '/our-story' }` — same pattern as the existing Shop link
- No active-link highlighting needed (none exists for Shop either — keep consistent)
- On mobile, it appears in the hamburger dropdown automatically — the existing `navLinks.map()` loop in the dropdown already handles it, including the `onClick={() => setMenuOpen(false)}` behaviour. No extra code needed.

### Footer
- Add a plain `<a>` element (no SVG icon) to `/our-story` labeled "Our Story"
- Place it as a direct child of the outer `flex flex-col` container in `Footer.tsx`, between the closing `</div>` of the social links group and the `<p>` copyright element
- Use `font-body text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors` — matching the raw-hex pattern already used by every other link in `Footer.tsx` (the file consistently uses raw hex, not semantic tokens)

---

## Page Route

`/our-story` → `src/app/our-story/page.tsx`

- **Server Component** — no `'use client'` directive; no data fetching required
- Exports a page-level `metadata` object (Next.js App Router merges this with the root layout metadata)

---

## Layout

### Hero Section
- Lavender-to-blush gradient background, matching the homepage hero exactly. Use the same inline style prop as `page.tsx` line 61: `style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)' }}`
- Padding: `py-20 sm:py-28` — generous but shorter than the homepage hero
- Centered text
- Title: "Our Story" — `font-display text-4xl sm:text-5xl font-bold text-violet`
- Subtitle: "Why we bake the way we do." — `font-body text-lg text-gray-500 italic mt-3`

### Letter Card
- White card, rounded-2xl, soft violet shadow: `shadow-[0_4px_20px_rgba(124,58,237,.08)]`
- Overlaps the hero by `-mt-12` (negative top margin); the hero's bottom padding absorbs this so the gradient is not cut off
- Below the card: plain white background (no additional section)
- Max width: `max-w-2xl mx-auto`, horizontal padding `px-8 sm:px-14`, vertical `py-12`
- Body text: `font-body text-base sm:text-lg leading-relaxed text-gray-700`
- Paragraphs: `mb-5` spacing
- Sign-off: `font-display italic text-xl text-violet mt-8`

### Tailwind tokens
For the new `our-story/page.tsx`, use the project's Tailwind v4 `@theme` semantic tokens:
- `text-violet`, `bg-lavender`, `border-blush` — **not** raw hex values
- The root `globals.css` (`@theme` block) defines these via `--color-violet` (#7c3aed), `--color-lavender` (#f3e8ff), `--color-blush` (#fce7f3), `--color-violet-dark` (#6d28d9)

**Exception — Footer.tsx modifications only:** `Footer.tsx` consistently uses raw hex (`text-[#7c3aed] hover:text-[#6d28d9]`) throughout its existing links. The new "Our Story" footer link must match that existing pattern exactly. Do not switch the new link to semantic tokens; do not migrate the existing footer links — that is out of scope for this ticket.

---

## Content

The letter content is **placeholder** at launch. A `{/* TODO: replace with Gracey's real story */}` comment in the JSX marks where the real text goes. The placeholder follows the approved narrative arc:

1. The diagnosis moment — the cookie thought
2. The disappointment with existing GF products
3. Starting to bake in her own kitchen
4. What drives every batch today
5. Sign-off from Gracey

The real letter will be written by the user and swapped in later.

---

## Metadata

```ts
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Our Story | GF Gracey's Cookies",
  description: "The story behind GF Gracey's — why we bake gluten-free and what drives every batch.",
}
```

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/app/our-story/page.tsx` | New static Server Component page |
| `src/components/NavBar.tsx` | Add `{ label: 'Our Story', href: '/our-story' }` to `navLinks` array |
| `src/components/Footer.tsx` | Add "Our Story" plain-text link row between socials and copyright |

---

## Out of Scope

- Images or photos on the Our Story page
- Contact form
- Admin CMS for editing the letter content
