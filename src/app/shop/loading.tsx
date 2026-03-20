export default function ShopLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="h-10 bg-lavender rounded w-48 animate-pulse mb-2" />
        <div className="h-5 bg-lavender rounded w-72 animate-pulse" />
      </div>
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 bg-lavender rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-blush rounded-2xl overflow-hidden shadow-sm animate-pulse"
          >
            <div className="h-48 bg-lavender" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-lavender rounded w-3/4" />
              <div className="h-4 bg-lavender rounded w-full" />
              <div className="h-4 bg-lavender rounded w-5/6" />
              <div className="flex justify-between items-center pt-1">
                <div className="h-6 bg-lavender rounded w-16" />
                <div className="h-9 bg-lavender rounded w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
