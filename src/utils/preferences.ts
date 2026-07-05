import { format } from 'date-fns'
import type { AppPreferences, DateFilterPreference } from '../types/entities'
import { getDateRange } from './dateFilters'

export function defaultDateFilterPreference(): DateFilterPreference {
  const today = format(new Date(), 'yyyy-MM-dd')
  return { preset: 'today', customFrom: today, customTo: today }
}

export function defaultAppPreferences(): AppPreferences {
  return {
    expensesDateFilter: defaultDateFilterPreference(),
    incomeDateFilter: defaultDateFilterPreference(),
    transactionsDateFilter: defaultDateFilterPreference(),
  }
}

export function mergeAppPreferences(stored?: Partial<AppPreferences>): AppPreferences {
  const defaults = defaultAppPreferences()
  return {
    expensesDateFilter: { ...defaults.expensesDateFilter, ...stored?.expensesDateFilter },
    incomeDateFilter: { ...defaults.incomeDateFilter, ...stored?.incomeDateFilter },
    transactionsDateFilter: { ...defaults.transactionsDateFilter, ...stored?.transactionsDateFilter },
  }
}

export function applyPartialAppPreferences(
  current: AppPreferences,
  partial: Partial<AppPreferences>,
): AppPreferences {
  return mergeAppPreferences({
    expensesDateFilter: partial.expensesDateFilter
      ? { ...current.expensesDateFilter, ...partial.expensesDateFilter }
      : current.expensesDateFilter,
    incomeDateFilter: partial.incomeDateFilter
      ? { ...current.incomeDateFilter, ...partial.incomeDateFilter }
      : current.incomeDateFilter,
    transactionsDateFilter: partial.transactionsDateFilter
      ? { ...current.transactionsDateFilter, ...partial.transactionsDateFilter }
      : current.transactionsDateFilter,
  })
}

export function resolveDateFilterRange(filter: DateFilterPreference): { from: string; to: string } {
  const range = getDateRange(filter.preset, filter.customFrom, filter.customTo)
  return range.from <= range.to ? range : { from: range.to, to: range.from }
}
