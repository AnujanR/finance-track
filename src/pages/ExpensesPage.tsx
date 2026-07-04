import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Trash2 } from 'lucide-react'
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
  getDateRange,
  getFilterPeriodLabel,
  isDateInRange,
  type DateFilterPreset,
} from '../utils/dateFilters'
import { checkBudgetOverflow } from '../utils/budget'
import { useAlert } from '../components/AlertProvider'

const today = () => format(new Date(), 'yyyy-MM-dd')

export function ExpensesPage() {
  const { transactions, accounts, categories, budgets, addTransaction, deleteTransaction } =
    useFinance()
  const { confirm, alert } = useAlert()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('today')
  const [customFrom, setCustomFrom] = useState(today())
  const [customTo, setCustomTo] = useState(today())
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: today(),
    categoryId: '',
    accountId: '',
    notes: '',
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const { from, to } = useMemo(() => {
    const range = getDateRange(datePreset, customFrom, customTo)
    return range.from <= range.to ? range : { from: range.to, to: range.from }
  }, [datePreset, customFrom, customTo])

  const expenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && isDateInRange(t.date, from, to))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, from, to],
  )

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const periodLabel = getFilterPeriodLabel(from, to)

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const resetForm = () => {
    setForm({
      description: '',
      amount: '',
      date: today(),
      categoryId: expenseCategories[0]?.id ?? '',
      accountId: accounts[0]?.id ?? '',
      notes: '',
    })
    setFormError(null)
  }

  const openForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handlePresetChange = (preset: DateFilterPreset) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      const range = getDateRange(preset)
      setCustomFrom(range.from)
      setCustomTo(range.to)
    }
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

    const budget = budgets.find((b) => b.categoryId === form.categoryId)
    if (budget) {
      const { wouldExceed, overBy } = checkBudgetOverflow(
        transactions,
        form.categoryId,
        budget.amount,
        budget.period,
        amount,
      )
      if (wouldExceed) {
        const catName = getCategoryName(form.categoryId)
        const proceed = await confirm({
          title: 'Over budget',
          description: `This will put you ${formatCurrency(overBy)} over your ${budget.period} budget for ${catName}. Add this expense anyway?`,
          confirmLabel: 'Add anyway',
          variant: 'warning',
        })
        if (!proceed) return
      }
    }

    setSubmitting(true)
    try {
      await addTransaction({
        type: 'expense',
        description: form.description.trim(),
        amount,
        date: form.date,
        accountId: form.accountId,
        categoryId: form.categoryId,
        notes: form.notes.trim() || undefined,
      })
      setShowForm(false)
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, description: string) => {
    const proceed = await confirm({
      title: 'Delete expense',
      description: `Are you sure you want to delete "${description}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!proceed) return
    try {
      await deleteTransaction(id)
    } catch (err) {
      await alert({
        title: 'Could not delete expense',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daily Expenses</h1>
          <p className="mt-1 text-slate-500">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-red-500">{formatCurrency(totalSpent)}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{periodLabel}</p>
        </div>
        <Button onClick={openForm}>+ Add Expense</Button>
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
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No expenses for this period. Try a different filter or add a new expense.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {expense.description}
                        {expense.notes && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">{expense.notes}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getCategoryName(expense.categoryId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {getAccountName(expense.accountId)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-red-500">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id, expense.description)}
                          className="text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Log a new expense and deduct it from a pot.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g. Coffee, Groceries, Uber"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
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
                    {expenseCategories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No categories — add some in Categories
                      </SelectItem>
                    ) : (
                      expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pay from pot</Label>
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
                <Label htmlFor="notes">
                  Notes <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="notes"
                  placeholder="Any extra details"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
