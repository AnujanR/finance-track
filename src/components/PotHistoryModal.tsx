import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Account, Category, Transaction } from '../types/entities'
import { formatCurrency, formatDate } from '../utils/format'
import { useFinance } from '../context/FinanceContext'
import { useAlert } from './AlertProvider'
import { usePagination } from '../hooks/usePagination'
import { TablePagination } from '@/components/ui/table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  const { updateTransaction, deleteTransaction } = useFinance()
  const { confirm, alert } = useAlert()
  const [editingTopUp, setEditingTopUp] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState({ amount: '', date: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  const {
    page: topUpPage,
    setPage: setTopUpPage,
    pageSize: topUpPageSize,
    totalPages: topUpTotalPages,
    totalItems: topUpTotalItems,
    paginatedItems: paginatedTopUps,
  } = usePagination(topUps)

  const {
    page: expensePage,
    setPage: setExpensePage,
    pageSize: expensePageSize,
    totalPages: expenseTotalPages,
    totalItems: expenseTotalItems,
    paginatedItems: paginatedExpenses,
  } = usePagination(expenses)

  const topUpLabel = (txn: Transaction) => {
    if (txn.type === 'transfer') return `From ${getPotName(txn.accountId)}`
    return txn.description
  }

  const expenseLabel = (txn: Transaction) => {
    if (txn.type === 'transfer') return `To ${getPotName(txn.toAccountId)}`
    return txn.description
  }

  const openEditTopUp = (txn: Transaction) => {
    setEditingTopUp(txn)
    setEditForm({
      amount: String(txn.amount),
      date: txn.date,
      notes: txn.notes ?? '',
    })
    setFormError(null)
  }

  const closeEditTopUp = () => {
    setEditingTopUp(null)
    setFormError(null)
  }

  const handleEditTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTopUp) return
    setFormError(null)

    const amount = parseFloat(editForm.amount)
    if (!amount || amount <= 0) {
      setFormError('Enter a valid amount')
      return
    }

    setSubmitting(true)
    try {
      await updateTransaction(editingTopUp.id, {
        amount,
        date: editForm.date,
        notes: editForm.notes.trim() || undefined,
      })
      closeEditTopUp()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update top-up')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTopUp = async (txn: Transaction) => {
    const proceed = await confirm({
      title: 'Delete top-up',
      description: `Remove this ${formatCurrency(txn.amount)} top-up from ${formatDate(txn.date)}? The pot balance will be adjusted.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!proceed) return

    try {
      await deleteTransaction(txn.id)
    } catch (err) {
      await alert({
        title: 'Could not delete',
        description: err instanceof Error ? err.message : 'Failed to delete top-up',
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 p-0 sm:w-full">
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
                      <th className="px-3 py-2.5 sm:px-4">Date</th>
                      <th className="px-3 py-2.5 sm:px-4">Description</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell sm:px-4">Note</th>
                      <th className="px-3 py-2.5 text-right sm:px-4">Amount</th>
                      <th className="px-3 py-2.5 text-right sm:px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topUps.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                          No top-ups yet
                        </td>
                      </tr>
                    ) : (
                      paginatedTopUps.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500 sm:px-4">
                            {formatDate(txn.date)}
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-slate-900 sm:px-4">
                            {topUpLabel(txn)}
                            {txn.notes && (
                              <p className="mt-0.5 text-xs font-normal text-slate-400 sm:hidden">
                                {txn.notes}
                              </p>
                            )}
                          </td>
                          <td className="hidden px-3 py-3 text-sm text-slate-500 sm:table-cell sm:px-4">
                            {txn.notes ?? '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold text-emerald-600 sm:px-4">
                            +{formatCurrency(txn.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right sm:px-4">
                            {txn.type === 'topup' ? (
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                  onClick={() => openEditTopUp(txn)}
                                  aria-label="Edit top-up"
                                >
                                  <Pencil size={15} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-500 hover:text-red-600"
                                  onClick={() => handleDeleteTopUp(txn)}
                                  aria-label="Delete top-up"
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <TablePagination
                  page={topUpPage}
                  totalPages={topUpTotalPages}
                  totalItems={topUpTotalItems}
                  pageSize={topUpPageSize}
                  onPageChange={setTopUpPage}
                />
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
                      <th className="px-3 py-2.5 sm:px-4">Date</th>
                      <th className="px-3 py-2.5 sm:px-4">Description</th>
                      <th className="hidden px-3 py-2.5 sm:table-cell sm:px-4">Category</th>
                      <th className="px-3 py-2.5 text-right sm:px-4">Amount</th>
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
                      paginatedExpenses.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500 sm:px-4">
                            {formatDate(txn.date)}
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-slate-900 sm:px-4">
                            {expenseLabel(txn)}
                            {txn.notes && (
                              <p className="mt-0.5 text-xs font-normal text-slate-400">{txn.notes}</p>
                            )}
                            <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                              {txn.type === 'expense' ? getCategoryName(txn.categoryId) : 'Transfer'}
                            </p>
                          </td>
                          <td className="hidden px-3 py-3 text-sm text-slate-600 sm:table-cell sm:px-4">
                            {txn.type === 'expense' ? getCategoryName(txn.categoryId) : 'Transfer'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold text-red-500 sm:px-4">
                            -{formatCurrency(txn.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <TablePagination
                  page={expensePage}
                  totalPages={expenseTotalPages}
                  totalItems={expenseTotalItems}
                  pageSize={expensePageSize}
                  onPageChange={setExpensePage}
                />
              </div>
            </section>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTopUp} onOpenChange={(open) => !open && closeEditTopUp()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Top-up</DialogTitle>
            <DialogDescription>{pot.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTopUp}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-topup-amount">Amount</Label>
                <Input
                  id="edit-topup-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  value={editForm.date}
                  onChange={(date) => setEditForm({ ...editForm, date })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-topup-notes">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="edit-topup-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeEditTopUp}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
