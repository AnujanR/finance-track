import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  ArrowDownLeft,
  Tags,
  PiggyBank,
  Target,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Pots', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/income', label: 'Income', icon: ArrowDownLeft },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Goals', icon: Target },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex w-64 flex-col bg-slate-900 text-white">
      <div className="flex items-center gap-2.5 border-b border-slate-700/50 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">FinTrack</h1>
          <p className="text-xs text-slate-400">Personal Finance</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700/50 px-4 py-4">
        <p className="truncate px-2 text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate px-2 text-xs text-slate-500">{user?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="mt-3 w-full justify-start gap-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
