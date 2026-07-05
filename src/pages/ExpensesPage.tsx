import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
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
import { checkBudgetOverflow } from '../utils/budget'
import { useAlert } from '../components/AlertProvider'
import type { DateFilterPreset, Transaction } from '../types/entities'
import { usePersistedDateFilter } from '../hooks/usePersistedDateFilter'
import { usePagination } from '../hooks/usePagination'
import { TablePagination } from '@/components/ui/table-pagination'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'

const today = () => format(new Date(), 'yyyy-MM-dd')

const VALID_PRESETS: DateFilterPreset[] = ['today', 'week', 'month', '6months', 'custom']

export function ExpensesPage() {
  const { transactions, accounts, categories, budgets, addTransaction, updateTransaction, deleteTransaction, updatePreferences } =
    useFinance()
  const [searchParams, setSearchParams] = useSearchParams()
  const appliedUrlFilters = useRef(false)
  const { confirm, alert } = useAlert()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')
  const { datePreset, customFrom, customTo, from, to, handlePresetChange, setCustomFrom, setCustomTo } =
    usePersistedDateFilter('expenses')
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: today(),
    categoryId: '',
    accountId: '',
    notes: '',
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  useEffect(() => {
    if (appliedUrlFilters.current) return

    const categoryId = searchParams.get('categoryId')
    const preset = searchParams.get('preset') as DateFilterPreset | null
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    if (!categoryId && !preset && !(fromParam && toParam)) return

    appliedUrlFilters.current = true

    if (categoryId) setCategoryFilter(categoryId)

    if (preset && VALID_PRESETS.includes(preset)) {
      handlePresetChange(preset)
    } else if (fromParam && toParam) {
      updatePreferences({
        expensesDateFilter: { preset: 'custom', customFrom: fromParam, customTo: toParam },
      })
    }

    setSearchParams({}, { replace: true })
  }, [searchParams, handlePresetChange, updatePreferences, setSearchParams])

  const expenses = useMemo(
    () =>
      transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            isDateInRange(t.date, from, to) &&
            (categoryFilter === 'all' || t.categoryId === categoryFilter),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, from, to, categoryFilter],
  )

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : '—'

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const periodLabel = getFilterPeriodLabel(from, to)
  const categoryFilterLabel =
    categoryFilter === 'all' ? null : getCategoryName(categoryFilter)

  const {
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedExpenses,
  } = usePagination(expenses)

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
    setEditingExpense(null)
  }

  const openForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (expense: Transaction) => {
    setEditingExpense(expense)
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date,
      categoryId: expense.categoryId ?? expenseCategories[0]?.id ?? '',
      accountId: expense.accountId,
      notes: expense.notes ?? '',
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

    const budget = budgets.find((b) => b.categoryId === form.categoryId)
    if (budget) {
      const { wouldExceed, overBy } = checkBudgetOverflow(
        transactions,
        form.categoryId,
        budget.amount,
        budget.period,
        amount,
        editingExpense?.id,
      )
      if (wouldExceed) {
        const catName = getCategoryName(form.categoryId)
        const proceed = await confirm({
          title: 'Over budget',
          description: `This will put you ${formatCurrency(overBy)} over your ${budget.period} budget for ${catName}. ${editingExpense ? 'Update' : 'Add'} this expense anyway?`,
          confirmLabel: editingExpense ? 'Update anyway' : 'Add anyway',
          variant: 'warning',
        })
        if (!proceed) return
      }
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
      if (editingExpense) {
        await updateTransaction(editingExpense.id, payload)
      } else {
        await addTransaction({
          type: 'expense',
          ...payload,
        })
      }
      closeForm()
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
    <PageContainer>
      <PageHeader>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Daily Expenses</h1>
          <p className="mt-1 text-slate-500">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-red-500">{formatCurrency(totalSpent)}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {periodLabel}
            {categoryFilterLabel && (
              <>
                {' · '}
                <span className="font-medium text-slate-600">{categoryFilterLabel}</span>
              </>
            )}
          </p>
        </div>
        <Button onClick={openForm} className="w-full sm:w-auto">
          + Add Expense
        </Button>
      </PageHeader>

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
          <div className="w-full space-y-2 sm:w-48">
            <Label className="text-xs text-slate-500">From</Label>
            <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Start date" />
          </div>
          <div className="w-full space-y-2 sm:w-48">
            <Label className="text-xs text-slate-500">To</Label>
            <DatePicker value={customTo} onChange={setCustomTo} placeholder="End date" />
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-56">
          <Label className="text-xs text-slate-500">Category</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {expenseCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {categoryFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setCategoryFilter('all')}>
            Clear category
          </Button>
        )}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3">Date</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3">Description</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell sm:px-6 sm:py-3">Category</th>
                  <th className="hidden px-3 py-2.5 md:table-cell sm:px-6 sm:py-3">Pot</th>
                  <th className="px-3 py-2.5 text-right sm:px-6 sm:py-3">Amount</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      {categoryFilter !== 'all'
                        ? `No expenses in ${categoryFilterLabel ?? 'this category'} for this period.`
                        : 'No expenses for this period. Try a different filter or add a new expense.'}
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500 sm:px-6 sm:py-4">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-900 sm:px-6 sm:py-4">
                        {expense.description}
                        {expense.notes && (
                          <p className="mt-0.5 text-xs font-normal text-slate-400">{expense.notes}</p>
                        )}
                        <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                          {getCategoryName(expense.categoryId)} · {getAccountName(expense.accountId)}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-slate-600 sm:table-cell sm:px-6 sm:py-4">
                        {getCategoryName(expense.categoryId)}
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-slate-600 md:table-cell sm:px-6 sm:py-4">
                        {getAccountName(expense.accountId)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-sm font-semibold text-red-500 sm:px-6 sm:py-4">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-3 py-3 text-right sm:px-6 sm:py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(expense)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-700"
                            title="Edit expense"
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense.id, expense.description)}
                            className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            title="Delete expense"
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
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Update this expense entry.'
                : 'Log a new expense and deduct it from a pot.'}
            </DialogDescription>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <Button type="button" variant="ghost" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editingExpense ? 'Update Expense' : 'Save Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
