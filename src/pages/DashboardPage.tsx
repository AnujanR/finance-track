import { useMemo } from 'react'
import { ArrowDownLeft, ArrowUpRight, DollarSign, Wallet } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { StatCard } from '../components/ui/StatCard'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { formatCurrency, formatDate } from '../utils/format'

export function DashboardPage() {
  const { accounts, transactions, categories } = useFinance()

  const stats = useMemo(() => {
    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0)
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return { netWorth, income, expenses, savings: income - expenses }
  }, [accounts, transactions])

  const recentTransactions = transactions.slice(0, 5)

  const getCategoryName = (categoryId?: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? 'Transfer'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Overview of your financial health</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Worth"
          value={formatCurrency(stats.netWorth)}
          change="+2.4% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(stats.income)}
          icon={ArrowDownLeft}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(stats.expenses)}
          icon={ArrowUpRight}
          iconColor="bg-red-100 text-red-500"
        />
        <StatCard
          label="Net Savings"
          value={formatCurrency(stats.savings)}
          changeType={stats.savings >= 0 ? 'positive' : 'negative'}
          icon={Wallet}
          iconColor="bg-blue-100 text-blue-600"
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
                <p className={`text-sm font-semibold ${account.balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
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
            {recentTransactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{txn.description}</p>
                  <p className="text-xs text-slate-500">
                    {getCategoryName(txn.categoryId)} · {formatDate(txn.date)}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    txn.type === 'income' || txn.type === 'topup'
                      ? 'text-emerald-600'
                      : txn.type === 'expense'
                        ? 'text-red-500'
                        : 'text-slate-600'
                  }`}
                >
                  {txn.type === 'income' || txn.type === 'topup' ? '+' : txn.type === 'expense' ? '-' : ''}
                  {formatCurrency(txn.amount)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
