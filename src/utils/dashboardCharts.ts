import { eachDayOfInterval, format } from 'date-fns'
import type { Category, Transaction } from '../types/entities'
import { getDateRange, isDateInRange } from './dateFilters'

export type ChartSlice = { name: string; value: number; color: string; categoryId?: string }

export type DailyBar = { date: string; label: string; amount: number }

const FALLBACK_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

function parseLocalDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getCurrentMonthRange() {
  return getDateRange('month')
}

export function filterTransactionsInRange(
  transactions: Transaction[],
  from: string,
  to: string,
  type?: Transaction['type'],
) {
  return transactions.filter(
    (t) => isDateInRange(t.date, from, to) && (type === undefined || t.type === type),
  )
}

export function aggregateByCategory(
  transactions: Transaction[],
  categories: Category[],
  categoryType: Category['type'],
  from: string,
  to: string,
): ChartSlice[] {
  const filtered = filterTransactionsInRange(transactions, from, to, categoryType)
  const totals = new Map<string, number>()

  for (const txn of filtered) {
    if (!txn.categoryId) continue
    totals.set(txn.categoryId, (totals.get(txn.categoryId) ?? 0) + txn.amount)
  }

  return [...totals.entries()]
    .map(([categoryId, value], index) => {
      const category = categories.find((c) => c.id === categoryId)
      return {
        name: category?.name ?? 'Other',
        value,
        color: category?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        categoryId,
      }
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function aggregateDailyExpenses(
  transactions: Transaction[],
  from: string,
  to: string,
): DailyBar[] {
  const expenses = filterTransactionsInRange(transactions, from, to, 'expense')
  const totals = new Map<string, number>()

  for (const txn of expenses) {
    totals.set(txn.date, (totals.get(txn.date) ?? 0) + txn.amount)
  }

  const start = parseLocalDate(from)
  const end = parseLocalDate(to)

  return eachDayOfInterval({ start, end }).map((day) => {
    const date = format(day, 'yyyy-MM-dd')
    return {
      date,
      label: format(day, 'd'),
      amount: totals.get(date) ?? 0,
    }
  })
}

export function getIncomeExpenseTotals(transactions: Transaction[], from: string, to: string) {
  const income = filterTransactionsInRange(transactions, from, to, 'income').reduce(
    (sum, t) => sum + t.amount,
    0,
  )
  const topups = filterTransactionsInRange(transactions, from, to, 'topup').reduce(
    (sum, t) => sum + t.amount,
    0,
  )
  const expenses = filterTransactionsInRange(transactions, from, to, 'expense').reduce(
    (sum, t) => sum + t.amount,
    0,
  )

  return {
    income: income + topups,
    expenses,
  }
}
