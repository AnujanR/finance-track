import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  iconColor?: string
}

export function StatCard({ label, value, change, changeType = 'neutral', icon: Icon, iconColor = 'bg-brand-100 text-brand-600' }: StatCardProps) {
  const changeColors = {
    positive: 'text-emerald-600',
    negative: 'text-red-500',
    neutral: 'text-slate-500',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl">{value}</p>
          {change && (
            <p className={`mt-1 text-sm ${changeColors[changeType]}`}>{change}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
