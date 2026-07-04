import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react'
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
import { formatCurrency, formatPercent } from '../utils/format'
import {
  getBudgetPeriodRange,
  getBudgetStatus,
  getCategorySpentInPeriod,
} from '../utils/budget'
import { useAlert } from '../components/AlertProvider'
import type { Budget, BudgetPeriod, Category } from '../types/entities'

const today = () => format(new Date(), 'yyyy-MM-dd')

const periodOptions: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

type BudgetRow = {
  category: Category
  budget: Budget | null
  spent: number
  remaining: number
  percent: number
  isOver: boolean
  isWarning: boolean
  periodLabel: string
}

export function BudgetsPage() {
  const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget } = useFinance()
  const { confirm, alert } = useAlert()
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly' as BudgetPeriod,
    startDate: today(),
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const budgetRows: BudgetRow[] = useMemo(() => {
    return expenseCategories.map((category) => {
      const budget = budgets.find((b) => b.categoryId === category.id) ?? null
      const period = budget?.period ?? 'monthly'
      const spent = getCategorySpentInPeriod(transactions, category.id, period)
      const periodLabel = getBudgetPeriodRange(period).label

      if (!budget) {
        return {
          category,
          budget: null,
          spent,
          remaining: 0,
          percent: 0,
          isOver: false,
          isWarning: false,
          periodLabel,
        }
      }

      const status = getBudgetStatus(budget.amount, spent)
      return {
        category,
        budget,
        spent,
        remaining: status.remaining,
        percent: status.percent,
        isOver: status.isOver,
        isWarning: status.isWarning,
        periodLabel,
      }
    })
  }, [expenseCategories, budgets, transactions])

  const summary = useMemo(() => {
    const withBudget = budgetRows.filter((r) => r.budget)
    const totalLimit = withBudget.reduce((sum, r) => sum + (r.budget?.amount ?? 0), 0)
    const totalSpent = withBudget.reduce((sum, r) => sum + r.spent, 0)
    const overCount = withBudget.filter((r) => r.isOver).length
    const warningCount = withBudget.filter((r) => r.isWarning).length
    const unsetCount = budgetRows.filter((r) => !r.budget).length
    return { totalLimit, totalSpent, overCount, warningCount, unsetCount }
  }, [budgetRows])

  const resetForm = (categoryId?: string) => {
    setForm({
      categoryId: categoryId ?? expenseCategories[0]?.id ?? '',
      amount: '',
      period: 'monthly',
      startDate: today(),
    })
    setFormError(null)
    setEditingBudget(null)
  }

  const openAdd = (categoryId?: string) => {
    resetForm(categoryId)
    setShowForm(true)
  }

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setForm({
      categoryId: budget.categoryId,
      amount: String(budget.amount),
      period: budget.period,
      startDate: budget.startDate,
    })
    setFormError(null)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const amount = parseFloat(form.amount)
    if (!form.categoryId) {
      setFormError('Select a category')
      return
    }
    if (!amount || amount <= 0) {
      setFormError('Enter a valid budget amount')
      return
    }

    const duplicate = budgets.find(
      (b) => b.categoryId === form.categoryId && b.id !== editingBudget?.id,
    )
    if (duplicate) {
      setFormError('This category already has a budget — edit it instead')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        categoryId: form.categoryId,
        amount,
        period: form.period,
        startDate: form.startDate,
      }
      if (editingBudget) {
        await updateBudget(editingBudget.id, payload)
      } else {
        await addBudget(payload)
      }
      setShowForm(false)
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save budget')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (budget: Budget, categoryName: string) => {
    const proceed = await confirm({
      title: 'Remove budget',
      description: `Remove the spending limit for "${categoryName}"?`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    })
    if (!proceed) return
    try {
      await deleteBudget(budget.id)
    } catch (err) {
      await alert({
        title: 'Could not remove budget',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const categoriesAvailableForNew = expenseCategories.filter(
    (c) => !budgets.some((b) => b.categoryId === c.id),
  )

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="mt-1 text-slate-500">Set spending limits so you don&apos;t overspend</p>
        </div>
        <Button onClick={() => openAdd()} disabled={categoriesAvailableForNew.length === 0}>
          + Add Budget
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardBody className="py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Monthly limits set</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalLimit)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Spent (budgeted)</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.totalSpent)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs font-medium uppercase text-slate-500">Over budget</p>
            <p className={`mt-1 text-2xl font-bold ${summary.overCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {summary.overCount}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <p className="text-xs font-medium uppercase text-slate-500">No limit set</p>
            <p className={`mt-1 text-2xl font-bold ${summary.unsetCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {summary.unsetCount}
            </p>
          </CardBody>
        </Card>
      </div>

      {expenseCategories.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-400">
            Add expense categories first, then set a budget for each one.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {budgetRows.map((row) => (
            <Card
              key={row.category.id}
              className={row.isOver ? 'border-red-200' : row.isWarning ? 'border-amber-200' : ''}
            >
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: row.category.color }}
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">{row.category.name}</h3>
                      <p className="text-xs text-slate-500">
                        {row.budget
                          ? `${row.budget.period} · ${row.periodLabel}`
                          : `No limit · ${row.periodLabel} spent ${formatCurrency(row.spent)}`}
                      </p>
                    </div>
                  </div>
                  {row.budget && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400"
                        onClick={() => openEdit(row.budget!)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(row.budget!, row.category.name)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                {row.budget ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{formatCurrency(row.spent)} spent</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(row.budget.amount)} limit
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          row.isOver
                            ? 'bg-red-500'
                            : row.isWarning
                              ? 'bg-amber-500'
                              : 'bg-brand-500'
                        }`}
                        style={{ width: `${row.percent}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={row.isOver ? 'font-medium text-red-500' : 'text-emerald-600'}>
                        {row.isOver
                          ? `${formatCurrency(Math.abs(row.remaining))} over budget`
                          : `${formatCurrency(row.remaining)} remaining`}
                      </span>
                      <span className="text-slate-400">{formatPercent(row.percent)}</span>
                    </div>
                    {row.isOver && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle size={14} />
                        You&apos;ve exceeded this budget — slow down spending here
                      </div>
                    )}
                    {!row.isOver && row.isWarning && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        <AlertTriangle size={14} />
                        Almost at limit — {formatCurrency(row.remaining)} left
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-sm text-slate-500">
                      Spent {formatCurrency(row.spent)} {row.periodLabel.toLowerCase()} with no limit
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => openAdd(row.category.id)}
                    >
                      Set budget
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
            <DialogDescription>
              Set a spending limit for a category. You&apos;ll be warned when you exceed it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(categoryId) => setForm({ ...form, categoryId })}
                  disabled={!!editingBudget}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingBudget ? expenseCategories : categoriesAvailableForNew).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-amount">Spending limit</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 500"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Period</Label>
                <Select
                  value={form.period}
                  onValueChange={(period) => setForm({ ...form, period: period as BudgetPeriod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Spending is tracked per calendar {form.period === 'weekly' ? 'week' : form.period === 'yearly' ? 'year' : 'month'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Start date</Label>
                <DatePicker
                  value={form.startDate}
                  onChange={(startDate) => setForm({ ...form, startDate })}
                />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editingBudget ? 'Update Budget' : 'Save Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
