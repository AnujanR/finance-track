import { useMemo } from 'react'
import type { Account, Category, Transaction } from '../types/entities'
import { formatCurrency, formatDate } from '../utils/format'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PotHistoryModalProps {
  pot: Account
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  onClose: () => void
}

function sortByDateDesc(a: Transaction, b: Transaction) {
  return b.date.localeCompare(a.date)
}

export function PotHistoryModal({
  pot,
  transactions,
  categories,
  accounts,
  onClose,
}: PotHistoryModalProps) {
  const getPotName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const { topUps, expenses, totalIn, totalOut } = useMemo(() => {
    const topUps = transactions
      .filter(
        (t) =>
          (t.type === 'topup' && t.accountId === pot.id) ||
          (t.type === 'income' && t.accountId === pot.id) ||
          (t.type === 'transfer' && t.toAccountId === pot.id),
      )
      .sort(sortByDateDesc)

    const expenses = transactions
      .filter(
        (t) =>
          (t.type === 'expense' && t.accountId === pot.id) ||
          (t.type === 'transfer' && t.accountId === pot.id),
      )
      .sort(sortByDateDesc)

    return {
      topUps,
      expenses,
      totalIn: topUps.reduce((sum, t) => sum + t.amount, 0),
      totalOut: expenses.reduce((sum, t) => sum + t.amount, 0),
    }
  }, [transactions, pot.id])

  const topUpLabel = (txn: Transaction) => {
    if (txn.type === 'transfer') return `From ${getPotName(txn.accountId)}`
    return txn.description
  }

  const expenseLabel = (txn: Transaction) => {
    if (txn.type === 'transfer') return `To ${getPotName(txn.toAccountId)}`
    return txn.description
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0">
        <DialogHeader>
          <DialogTitle>{pot.name} — History</DialogTitle>
          <DialogDescription>
            Balance: {formatCurrency(pot.balance)} · In: {formatCurrency(totalIn)} · Out:{' '}
            {formatCurrency(totalOut)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto">
          <section className="mb-8">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Top-up history
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Note</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topUps.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                        No top-ups yet
                      </td>
                    </tr>
                  ) : (
                    topUps.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {topUpLabel(txn)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{txn.notes ?? '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-emerald-600">
                          +{formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-600">
              Expense history
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Description</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                        No expenses yet
                      </td>
                    </tr>
                  ) : (
                    expenses.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {expenseLabel(txn)}
                          {txn.notes && (
                            <p className="mt-0.5 text-xs font-normal text-slate-400">{txn.notes}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {txn.type === 'expense' ? getCategoryName(txn.categoryId) : 'Transfer'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-red-500">
                          -{formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
