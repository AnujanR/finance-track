import { useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { useFinance } from '../context/FinanceContext'
import type { DateFilterPreset } from '../types/entities'
import { getDateRange } from '../utils/dateFilters'
import { resolveDateFilterRange } from '../utils/preferences'

type DateFilterPage = 'expenses' | 'income' | 'transactions'

const DATE_FILTER_KEYS = {
  expenses: 'expensesDateFilter',
  income: 'incomeDateFilter',
  transactions: 'transactionsDateFilter',
} as const

const today = () => format(new Date(), 'yyyy-MM-dd')

export function usePersistedDateFilter(page: DateFilterPage) {
  const { preferences, updatePreferences } = useFinance()
  const key = DATE_FILTER_KEYS[page]
  const filter = preferences[key]

  const { from, to } = useMemo(() => resolveDateFilterRange(filter), [filter])

  const handlePresetChange = useCallback(
    (preset: DateFilterPreset) => {
      if (preset === 'custom') {
        updatePreferences({
          [key]: {
            preset,
            customFrom: filter.customFrom ?? today(),
            customTo: filter.customTo ?? today(),
          },
        })
        return
      }

      const range = getDateRange(preset)
      updatePreferences({
        [key]: { preset, customFrom: range.from, customTo: range.to },
      })
    },
    [filter.customFrom, filter.customTo, key, updatePreferences],
  )

  const setCustomFrom = useCallback(
    (customFrom: string) => {
      updatePreferences({
        [key]: {
          preset: 'custom',
          customFrom,
          customTo: filter.customTo ?? today(),
        },
      })
    },
    [filter.customTo, key, updatePreferences],
  )

  const setCustomTo = useCallback(
    (customTo: string) => {
      updatePreferences({
        [key]: {
          preset: 'custom',
          customFrom: filter.customFrom ?? today(),
          customTo,
        },
      })
    },
    [filter.customFrom, key, updatePreferences],
  )

  return {
    datePreset: filter.preset,
    customFrom: filter.customFrom ?? today(),
    customTo: filter.customTo ?? today(),
    from,
    to,
    handlePresetChange,
    setCustomFrom,
    setCustomTo,
  }
}
