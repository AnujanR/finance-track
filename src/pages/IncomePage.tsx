import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Trash2, Pencil } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '../utils/format'
import {
  DATE_FILTER_OPTIONS,
  getFilterPeriodLabel,
  isDateInRange,
} from '../utils/dateFilters'
import { useAlert } from '../components/AlertProvider'
import type { Transaction } from '../types/entities'
import { usePersistedDateFilter } from '../hooks/usePersistedDateFilter'
import { usePagination } from '../hooks/usePagination'
import { TablePagination } from '@/components/ui/table-pagination'

const today = () => format(new Date(), 'yyyy-MM-dd')

export function IncomePage() {
  const { transactions, accounts, categories, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const { confirm, alert } = useAlert()
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { datePreset, customFrom, customTo, from, to, handlePresetChange, setCustomFrom, setCustomTo } =
    usePersistedDateFilter('income')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: today(),
    categoryId: '',
    accountId: '',
    notes: '',
  })

  const incomeCategories = categories.filter((c) => c.type === 'income')

  const incomeItems = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income' && isDateInRange(t.date, from, to))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, from, to],
  )

  const totalEarned = incomeItems.reduce((sum, item) => sum + item.amount, 0)
  const periodLabel = getFilterPeriodLabel(from, to)

  const {
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedIncome,
  } = usePagination(incomeItems)

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const resetForm = () => {
    setForm({
      description: '',
      amount: '',
      date: today(),
      categoryId: incomeCategories[0]?.id ?? '',
      accountId: accounts[0]?.id ?? '',
      notes: '',
    })
    setFormError(null)
    setEditingIncome(null)
  }

  const openForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (item: Transaction) => {
    setEditingIncome(item)
    setForm({
      description: item.description,
      amount: String(item.amount),
      date: item.date,
      categoryId: item.categoryId ?? incomeCategories[0]?.id ?? '',
      accountId: item.accountId,
      notes: item.notes ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const amount = parseFloat(form.amount)
    if (!form.description.trim()) {
      setFormError('Description is required')
      return
    }
    if (!amount || amount <= 0) {
      setFormError('Enter a valid amount')
      return
    }
    if (!form.accountId) {
      setFormError('Select a pot')
      return
    }
    if (!form.categoryId) {
      setFormError('Select a category')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        description: form.description.trim(),
        amount,
        date: form.date,
        accountId: form.accountId,
        categoryId: form.categoryId,
        notes: form.notes.trim() || undefined,
      }
      if (editingIncome) {
        await updateTransaction(editingIncome.id, payload)
      } else {
        await addTransaction({
          type: 'income',
          ...payload,
        })
      }
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save income')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, description: string) => {
    const proceed = await confirm({
      title: 'Delete income',
      description: `Are you sure you want to delete "${description}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!proceed) return
    try {
      await deleteTransaction(id)
    } catch (err) {
      await alert({
        title: 'Could not delete income',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Income</h1>
          <p className="mt-1 text-slate-500">
            {incomeItems.length} entr{incomeItems.length !== 1 ? 'ies' : 'y'} ·{' '}
            <span className="font-semibold text-emerald-600">{formatCurrency(totalEarned)}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{periodLabel}</p>
        </div>
        <Button onClick={openForm}>+ Add Income</Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {DATE_FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={datePreset === opt.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handlePresetChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {datePreset === 'custom' && (
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="w-48 space-y-2">
            <Label className="text-xs text-slate-500">From</Label>
            <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Start date" />
          </div>
          <div className="w-48 space-y-2">
            <Label className="text-xs text-slate-500">To</Label>
            <DatePicker value={customTo} onChange={setCustomTo} placeholder="End date" />
          </div>
        </div>
      )}

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Pot</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomeItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No income for this period. Try a different filter or add new income.
                    </td>
                  </tr>
                ) : (
                  paginatedIncome.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {formatDate(item.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.description}
                        {item.notes && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">{item.notes}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getCategoryName(item.categoryId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getAccountName(item.accountId)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                        +{formatCurrency(item.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700"
                            title="Edit income"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.description)}
                            className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            title="Delete income"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? 'Edit Income' : 'Add Income'}</DialogTitle>
            <DialogDescription>
              {editingIncome
                ? 'Update this income entry.'
                : 'Log money received and deposit it into a pot.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-description">Description</Label>
                <Input
                  id="income-description"
                  placeholder="e.g. Salary, Freelance, Refund"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Amount</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <DatePicker value={form.date} onChange={(date) => setForm({ ...form, date })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No income categories — add some in Categories
                      </SelectItem>
                    ) : (
                      incomeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deposit to pot</Label>
                <Select
                  value={form.accountId}
                  onValueChange={(accountId) => setForm({ ...form, accountId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pot" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No pots — add some in Pots
                      </SelectItem>
                    ) : (
                      accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-notes">
                  Notes <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="income-notes"
                  placeholder="Any extra details"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Saving…' : editingIncome ? 'Update Income' : 'Save Income'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
