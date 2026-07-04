/** Authenticated app user. */
export interface User {
  id: string
  name: string
  email: string
}

/** Financial account (bank, card, cash, investment). */
export type AccountType = 'checking' | 'savings' | 'credit' | 'cash' | 'investment'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  color: string
  createdAt: string
}

/** Income or expense category for tagging transactions. */
export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  color: string
  icon: string
}

/** Money movement — income, expense, transfer, or top-up into a pot. */
export type TransactionType = 'income' | 'expense' | 'transfer' | 'topup'

export interface Transaction {
  id: string
  accountId: string
  categoryId?: string
  toAccountId?: string
  amount: number
  type: TransactionType
  description: string
  date: string
  notes?: string
}

/** Spending limit for a category over a time period. */
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly'

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: string
}

/** Savings target with optional deadline and linked account. */
export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  accountId?: string
  color: string
}
