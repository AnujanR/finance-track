import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns'
import type { BudgetPeriod, Transaction } from '../types/entities'
import { isDateInRange } from './dateFilters'

export function getBudgetPeriodRange(
  period: BudgetPeriod,
  referenceDate = new Date(),
): { from: string; to: string; label: string } {
  switch (period) {
    case 'weekly':
      return {
        from: format(startOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(referenceDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        label: 'This week',
      }
    case 'monthly':
      return {
        from: format(startOfMonth(referenceDate), 'yyyy-MM-dd'),
        to: format(endOfMonth(referenceDate), 'yyyy-MM-dd'),
        label: 'This month',
      }
    case 'yearly':
      return {
        from: format(startOfYear(referenceDate), 'yyyy-MM-dd'),
        to: format(endOfYear(referenceDate), 'yyyy-MM-dd'),
        label: 'This year',
      }
  }
}

export function getCategorySpentInPeriod(
  transactions: Transaction[],
  categoryId: string,
  period: BudgetPeriod,
  referenceDate = new Date(),
): number {
  const { from, to } = getBudgetPeriodRange(period, referenceDate)
  return transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.categoryId === categoryId &&
        isDateInRange(t.date, from, to),
    )
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getBudgetStatus(
  budgetAmount: number,
  spent: number,
): {
  remaining: number
  percent: number
  isOver: boolean
  isWarning: boolean
} {
  const remaining = budgetAmount - spent
  const percent = budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0
  return {
    remaining,
    percent,
    isOver: remaining < 0,
    isWarning: remaining >= 0 && percent >= 80,
  }
}

export function checkBudgetOverflow(
  transactions: Transaction[],
  categoryId: string,
  budgetAmount: number,
  period: BudgetPeriod,
  additionalAmount: number,
  excludeTransactionId?: string,
): { wouldExceed: boolean; spent: number; overBy: number } {
  const { from, to } = getBudgetPeriodRange(period)
  const spent = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.categoryId === categoryId &&
        t.id !== excludeTransactionId &&
        isDateInRange(t.date, from, to),
    )
    .reduce((sum, t) => sum + t.amount, 0)

  const projected = spent + additionalAmount
  return {
    wouldExceed: projected > budgetAmount,
    spent,
    overBy: Math.max(0, projected - budgetAmount),
  }
}
