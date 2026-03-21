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
        <p className="font-body text-lg text-gray-600 italic mt-3">
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
