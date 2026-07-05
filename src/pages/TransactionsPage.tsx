import { useMemo, useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency, formatDate } from '../utils/format'
import {
  DATE_FILTER_OPTIONS,
  getFilterPeriodLabel,
  isDateInRange,
} from '../utils/dateFilters'
import { usePersistedDateFilter } from '../hooks/usePersistedDateFilter'
import { usePagination } from '../hooks/usePagination'
import { TablePagination } from '@/components/ui/table-pagination'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'
import type { TransactionType } from '../types/entities'

const TYPE_FILTER_OPTIONS: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'topup', label: 'Top up' },
]

export function TransactionsPage() {
  const { transactions, accounts, categories } = useFinance()
  const { datePreset, customFrom, customTo, from, to, handlePresetChange, setCustomFrom, setCustomTo } =
    usePersistedDateFilter('transactions')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Unknown'
  const getCategoryName = (id?: string) =>
    id ? categories.find((c) => c.id === id)?.name ?? '—' : 'Transfer'

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter(
          (txn) =>
            isDateInRange(txn.date, from, to) &&
            (typeFilter === 'all' || txn.type === typeFilter),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, from, to, typeFilter],
  )

  const periodLabel = getFilterPeriodLabel(from, to)

  const {
    page,
    setPage,
    pageSize,
    totalPages,
    totalItems,
    paginatedItems: paginatedTransactions,
  } = usePagination(filteredTransactions)

  const typeBadge = (type: string) => {
    const styles = {
      income: 'bg-emerald-100 text-emerald-700',
      expense: 'bg-red-100 text-red-600',
      transfer: 'bg-slate-100 text-slate-600',
      topup: 'bg-emerald-100 text-emerald-700',
    }
    return styles[type as keyof typeof styles] ?? styles.transfer
  }

  return (
    <PageContainer>
      <PageHeader>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Transactions</h1>
          <p className="mt-1 text-slate-500">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {transactions.length !== filteredTransactions.length &&
              ` of ${transactions.length} total`}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{periodLabel}</p>
        </div>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <div className="mb-4 flex flex-wrap items-end gap-4">
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

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TYPE_FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={typeFilter === opt.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setTypeFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3">Date</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3">Description</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell sm:px-6 sm:py-3">Category</th>
                  <th className="hidden px-3 py-2.5 md:table-cell sm:px-6 sm:py-3">Account</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell sm:px-6 sm:py-3">Type</th>
                  <th className="px-3 py-2.5 text-right sm:px-6 sm:py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No transactions for this period{typeFilter !== 'all' ? ' and type' : ''}. Try
                      adjusting your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500 sm:px-6 sm:py-4">
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-900 sm:px-6 sm:py-4">
                        {txn.description}
                        {txn.toAccountId && (
                          <span className="ml-1 text-xs text-slate-400">
                            → {getAccountName(txn.toAccountId)}
                          </span>
                        )}
                        <p className="mt-0.5 text-xs capitalize text-slate-500 sm:hidden">
                          {txn.type} · {getAccountName(txn.accountId)}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-slate-600 lg:table-cell sm:px-6 sm:py-4">
                        {getCategoryName(txn.categoryId)}
                      </td>
                      <td className="hidden px-3 py-3 text-sm text-slate-600 md:table-cell sm:px-6 sm:py-4">
                        {getAccountName(txn.accountId)}
                      </td>
                      <td className="hidden px-3 py-3 sm:table-cell sm:px-6 sm:py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadge(txn.type)}`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-3 text-right text-sm font-semibold sm:px-6 sm:py-4 ${
                          txn.type === 'income' || txn.type === 'topup'
                            ? 'text-emerald-600'
                            : txn.type === 'expense'
                              ? 'text-red-500'
                              : 'text-slate-600'
                        }`}
                      >
                        {txn.type === 'income' || txn.type === 'topup'
                          ? '+'
                          : txn.type === 'expense'
                            ? '-'
                            : ''}
                        {formatCurrency(txn.amount)}
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
    </PageContainer>
  )
}
