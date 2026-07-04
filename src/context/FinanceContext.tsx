import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Account, Budget, Category, Goal, Transaction } from '../types/entities'
import { api } from '../api/client'

interface FinanceContextValue {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  loading: boolean
  error: string | null
  addTransaction: (txn: Omit<Transaction, 'id'>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  topUpPot: (potId: string, amount: number, date?: string, notes?: string) => Promise<void>
  transferPot: (
    fromPotId: string,
    toPotId: string,
    amount: number,
    date?: string,
    notes?: string,
  ) => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<void>
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>
  updateBudget: (id: string, budget: Partial<Omit<Budget, 'id'>>) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>
  updateGoal: (id: string, goal: Partial<Omit<Goal, 'id'>>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  contributeToGoal: (id: string, amount: number) => Promise<void>
  refresh: () => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [accs, cats, txns, buds, gls] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(),
        api.getGoals(),
      ])
      setAccounts(accs)
      setCategories(cats)
      setTransactions(txns)
      setBudgets(buds)
      setGoals(gls)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addTransaction = async (txn: Omit<Transaction, 'id'>) => {
    await api.createTransaction(txn)
    await refresh()
  }

  const deleteTransaction = async (id: string) => {
    await api.deleteTransaction(id)
    await refresh()
  }

  const topUpPot = async (potId: string, amount: number, date?: string, notes?: string) => {
    const pot = accounts.find((a) => a.id === potId)
    await addTransaction({
      type: 'topup',
      accountId: potId,
      amount,
      description: `Top up — ${pot?.name ?? 'pot'}`,
      date: date ?? new Date().toISOString().split('T')[0],
      notes,
    })
  }

  const transferPot = async (
    fromPotId: string,
    toPotId: string,
    amount: number,
    date?: string,
    notes?: string,
  ) => {
    const from = accounts.find((a) => a.id === fromPotId)
    const to = accounts.find((a) => a.id === toPotId)
    await addTransaction({
      type: 'transfer',
      accountId: fromPotId,
      toAccountId: toPotId,
      amount,
      description: `Transfer: ${from?.name ?? 'pot'} → ${to?.name ?? 'pot'}`,
      date: date ?? new Date().toISOString().split('T')[0],
      notes,
    })
  }

  const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>) => {
    const { balance, ...rest } = account
    const created = await api.createAccount({ ...rest, balance: 0 })
    if (balance > 0) {
      await api.createTransaction({
        type: 'topup',
        accountId: created.id,
        amount: balance,
        description: `Opening balance — ${created.name}`,
        date: new Date().toISOString().split('T')[0],
        notes: 'Initial allocation',
      })
    }
    await refresh()
  }

  const addCategory = async (category: Omit<Category, 'id'>) => {
    await api.createCategory(category)
    await refresh()
  }

  const addBudget = async (budget: Omit<Budget, 'id'>) => {
    await api.createBudget(budget)
    await refresh()
  }

  const updateBudget = async (id: string, budget: Partial<Omit<Budget, 'id'>>) => {
    await api.updateBudget(id, budget)
    await refresh()
  }

  const deleteBudget = async (id: string) => {
    await api.deleteBudget(id)
    await refresh()
  }

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    await api.createGoal(goal)
    await refresh()
  }

  const updateGoal = async (id: string, goal: Partial<Omit<Goal, 'id'>>) => {
    await api.updateGoal(id, goal)
    await refresh()
  }

  const deleteGoal = async (id: string) => {
    await api.deleteGoal(id)
    await refresh()
  }

  const contributeToGoal = async (id: string, amount: number) => {
    const goal = goals.find((g) => g.id === id)
    if (!goal) return
    await api.updateGoal(id, { currentAmount: goal.currentAmount + amount })
    await refresh()
  }

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        loading,
        error,
        addTransaction,
        deleteTransaction,
        topUpPot,
        transferPot,
        addAccount,
        addCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        refresh,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
