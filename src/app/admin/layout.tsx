import { AdminNav } from './AdminNav'
import { SignOutButton } from './SignOutButton'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="font-display text-base font-bold text-violet leading-tight">
            GF Gracey&rsquo;s
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>

        <div className="flex-1 px-3 py-4">
          <AdminNav />
        </div>

        <div className="px-3 py-4 border-t border-gray-100">
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
