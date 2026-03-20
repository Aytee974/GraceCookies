'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-5xl mb-4">😔</p>
      <h2 className="font-display text-2xl font-bold text-violet mb-2">
        Something went wrong
      </h2>
      <p className="font-body text-gray-500 mb-6 max-w-sm">
        We hit an unexpected error. Please try again.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg bg-gold text-white hover:bg-gold-dark transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
