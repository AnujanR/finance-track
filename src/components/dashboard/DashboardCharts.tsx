import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { formatCurrency } from '../../utils/format'
import type { ChartSlice, DailyBar } from '../../utils/dashboardCharts'

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: ChartSlice }[]
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{item.name ?? item.payload?.name}</p>
      <p className="text-slate-600">{formatCurrency(item.value ?? 0)}</p>
    </div>
  )
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value?: number; payload?: DailyBar }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const bar = payload[0]?.payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-slate-900">{bar?.date ?? label}</p>
      <p className="text-red-500">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-slate-400 sm:h-64">{message}</div>
  )
}

function ChartFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-56 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryDonutChart({
  title,
  subtitle,
  data,
  emptyMessage,
  onSliceClick,
}: {
  title: string
  subtitle: string
  data: ChartSlice[]
  emptyMessage: string
  onSliceClick?: (slice: ChartSlice) => void
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {subtitle}
          {onSliceClick && data.length > 0 && ' · Click a slice to view details'}
        </p>
      </CardHeader>
      <CardBody>
        {data.length === 0 ? (
          <EmptyChart message={emptyMessage} />
        ) : (
          <ChartFrame>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                className={onSliceClick ? 'cursor-pointer outline-none' : undefined}
                onClick={(_, index) => {
                  const slice = data[index]
                  if (slice?.categoryId) onSliceClick?.(slice)
                }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.categoryId ?? entry.name}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                    className={onSliceClick && entry.categoryId ? 'cursor-pointer' : undefined}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
              />
            </PieChart>
          </ChartFrame>
        )}
      </CardBody>
    </Card>
  )
}

export function DailyExpensesBarChart({
  title,
  subtitle,
  data,
  emptyMessage,
}: {
  title: string
  subtitle: string
  data: DailyBar[]
  emptyMessage: string
}) {
  const hasSpending = data.some((d) => d.amount > 0)

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </CardHeader>
      <CardBody>
        {!hasSpending ? (
          <EmptyChart message={emptyMessage} />
        ) : (
          <ChartFrame>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `£${v}`}
                width={48}
              />
              <Tooltip content={<DailyTooltip />} />
              <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartFrame>
        )}
      </CardBody>
    </Card>
  )
}

export function IncomeExpenseBarChart({
  title,
  subtitle,
  income,
  expenses,
}: {
  title: string
  subtitle: string
  income: number
  expenses: number
}) {
  const data = [
    { name: 'Income', amount: income, fill: '#10b981' },
    { name: 'Expenses', amount: expenses, fill: '#ef4444' },
  ]

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </CardHeader>
      <CardBody>
        {income === 0 && expenses === 0 ? (
          <EmptyChart message="No income or expenses this month yet." />
        ) : (
          <ChartFrame>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `£${v}`}
                width={48}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={80}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        )}
      </CardBody>
    </Card>
  )
}
