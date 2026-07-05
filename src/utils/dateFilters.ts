import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'

import type { DateFilterPreset } from '../types/entities'

export type { DateFilterPreset }

export const DATE_FILTER_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'custom', label: 'Custom Range' },
]

export function getDateRange(
  preset: DateFilterPreset,
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')

  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'week':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    case 'month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case '6months':
      return {
        from: format(subMonths(now, 6), 'yyyy-MM-dd'),
        to: today,
      }
    case 'custom':
      return {
        from: customFrom ?? today,
        to: customTo ?? today,
      }
  }
}

export function isDateInRange(dateStr: string, from: string, to: string): boolean {
  return dateStr >= from && dateStr <= to
}

export function getFilterPeriodLabel(from: string, to: string): string {
  if (from === to) return format(new Date(from + 'T00:00:00'), 'MMM d, yyyy')
  return `${format(new Date(from + 'T00:00:00'), 'MMM d, yyyy')} – ${format(new Date(to + 'T00:00:00'), 'MMM d, yyyy')}`
}
