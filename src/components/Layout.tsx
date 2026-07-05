import { useCallback, useState } from 'react'
import { Menu } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useFinance } from '../context/FinanceContext'
import { Button } from '@/components/ui/button'

export function Layout() {
  const { loading, error, refresh } = useFinance()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading your finances...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="font-semibold text-red-600">Connection Error</p>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <p className="mt-2 text-xs text-slate-400">
            Make sure the API server is running on port 3001
          </p>
          <button
            onClick={refresh}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={closeMobileNav} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">FinTrack</p>
            <p className="truncate text-xs text-slate-500">Personal Finance</p>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
