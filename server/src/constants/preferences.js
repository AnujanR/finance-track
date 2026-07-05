export const DATE_FILTER_PRESETS = ['today', 'week', 'month', '6months', 'custom']

export function defaultDateFilter() {
  const today = new Date().toISOString().slice(0, 10)
  return { preset: 'today', customFrom: today, customTo: today }
}

export function defaultPreferences() {
  return {
    expensesDateFilter: defaultDateFilter(),
    incomeDateFilter: defaultDateFilter(),
    transactionsDateFilter: defaultDateFilter(),
  }
}

export function mergePreferences(stored) {
  const plain =
    stored && typeof stored.toObject === 'function' ? stored.toObject() : stored
  const defaults = defaultPreferences()
  return {
    expensesDateFilter: { ...defaults.expensesDateFilter, ...plain?.expensesDateFilter },
    incomeDateFilter: { ...defaults.incomeDateFilter, ...plain?.incomeDateFilter },
    transactionsDateFilter: { ...defaults.transactionsDateFilter, ...plain?.transactionsDateFilter },
  }
}
