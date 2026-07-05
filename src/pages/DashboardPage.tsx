import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, PoundSterling, Wallet } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import {
  CategoryDonutChart,
  DailyExpensesBarChart,
  IncomeExpenseBarChart,
} from '../components/dashboard/DashboardCharts'
import { formatCurrency, formatDate } from '../utils/format'
import { getFilterPeriodLabel } from '../utils/dateFilters'
import { PageContainer } from '../components/layout/PageContainer'
import {
  aggregateByCategory,
  aggregateDailyExpenses,
  getCurrentMonthRange,
  getIncomeExpenseTotals,
} from '../utils/dashboardCharts'

export function DashboardPage() {
  const navigate = useNavigate()
  const { accounts, transactions, categories } = useFinance()

  const { from, to } = useMemo(() => getCurrentMonthRange(), [])
  const periodLabel = getFilterPeriodLabel(from, to)

  const chartData = useMemo(
    () => ({
      expenseSlices: aggregateByCategory(transactions, categories, 'expense', from, to),
      incomeSlices: aggregateByCategory(transactions, categories, 'income', from, to),
      dailyExpenses: aggregateDailyExpenses(transactions, from, to),
      totals: getIncomeExpenseTotals(transactions, from, to),
    }),
    [transactions, categories, from, to],
  )

  const stats = useMemo(() => {
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
    const { income, expenses } = chartData.totals

    return { netWorth, income, expenses, savings: income - expenses }
  }, [accounts, chartData.totals])

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions],
  )

  const getCategoryName = (categoryId?: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? 'Transfer'

  const handleExpenseCategoryClick = (slice: { categoryId?: string }) => {
    if (!slice.categoryId) return
    navigate(`/expenses?categoryId=${encodeURIComponent(slice.categoryId)}&preset=month`)
  }

  return (
    <PageContainer>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Overview of your financial health · {periodLabel}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={formatCurrency(stats.netWorth)}
          icon={PoundSterling}
        />
        <StatCard
          label="Income (this month)"
          value={formatCurrency(stats.income)}
          icon={ArrowDownLeft}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Expenses (this month)"
          value={formatCurrency(stats.expenses)}
          icon={ArrowUpRight}
          iconColor="bg-red-100 text-red-500"
        />
        <StatCard
          label="Net Savings (this month)"
          value={formatCurrency(stats.savings)}
          changeType={stats.savings >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoryDonutChart
          title="Expenses by Category"
          subtitle={periodLabel}
          data={chartData.expenseSlices}
          emptyMessage="No expenses recorded this month."
          onSliceClick={handleExpenseCategoryClick}
        />
        <CategoryDonutChart
          title="Income by Category"
          subtitle={periodLabel}
          data={chartData.incomeSlices}
          emptyMessage="No income recorded this month."
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DailyExpensesBarChart
            title="Daily Spending"
            subtitle={`Expense totals per day · ${periodLabel}`}
            data={chartData.dailyExpenses}
            emptyMessage="No daily spending recorded this month."
          />
        </div>
        <IncomeExpenseBarChart
          title="Income vs Expenses"
          subtitle={periodLabel}
          income={chartData.totals.income}
          expenses={chartData.totals.expenses}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Pots</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{account.name}</p>
                    <p className="text-xs capitalize text-slate-500">{account.type}</p>
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold ${account.balance < 0 ? 'text-red-500' : 'text-slate-900'}`}
                >
                  {formatCurrency(account.balance)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-400">No transactions yet.</p>
            ) : (
              recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{txn.description}</p>
                    <p className="text-xs text-slate-500">
                      {getCategoryName(txn.categoryId)} · {formatDate(txn.date)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      txn.type === 'income' || txn.type === 'topup'
                        ? 'text-emerald-600'
                        : txn.type === 'expense'
                          ? 'text-red-500'
                          : 'text-slate-600'
                    }`}
                  >
                    {txn.type === 'income' || txn.type === 'topup'
                      ? '+'
                      : txn.type === 'expense'
                        ? '-'
                        : ''}
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
