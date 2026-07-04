import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
import { formatCurrency, formatDate } from '../utils/format'

export function TransactionsPage() {
  const { transactions, accounts, categories } = useFinance()

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : 'Transfer'

  const typeBadge = (type: string) => {
    const styles = {
      income: 'bg-emerald-100 text-emerald-700',
      expense: 'bg-red-100 text-red-600',
      transfer: 'bg-slate-100 text-slate-600',
      topup: 'bg-emerald-100 text-emerald-700',
    }
    return styles[type as keyof typeof styles] ?? styles.transfer
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-slate-500">{transactions.length} total transactions</p>
        </div>
        <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700">
          + Add Transaction
        </button>
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {txn.description}
                      {txn.toAccountId && (
                        <span className="ml-1 text-xs text-slate-400">
                          → {getAccountName(txn.toAccountId)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getCategoryName(txn.categoryId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {getAccountName(txn.accountId)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadge(txn.type)}`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${
                      txn.type === 'income' || txn.type === 'topup' ? 'text-emerald-600' : txn.type === 'expense' ? 'text-red-500' : 'text-slate-600'
                    }`}>
                      {txn.type === 'income' || txn.type === 'topup' ? '+' : txn.type === 'expense' ? '-' : ''}
                      {formatCurrency(txn.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
