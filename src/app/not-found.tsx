import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl font-display font-bold text-lavender-dark mb-4">404</p>
      <h2 className="font-display text-2xl font-bold text-violet mb-2">
        Page not found
      </h2>
      <p className="font-body text-gray-500 mb-6 max-w-sm">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors"
      >
        Back to home
      </Link>
    </div>
  )
}
