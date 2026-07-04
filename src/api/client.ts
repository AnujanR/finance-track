import type { Account, Budget, Category, Goal, Transaction, User } from '../types/entities'

const BASE = '/api'
const TOKEN_KEY = 'fintrack_token'

let authToken: string | null = localStorage.getItem(TOKEN_KEY)
let onUnauthorized: (() => void) | null = null

export function getAuthToken() {
  return authToken
}

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      if (res.status === 401 && authToken && !path.startsWith('/auth/')) {
        onUnauthorized?.()
      }
      throw new Error(body.error || `Request failed: ${res.status}`)
    }
    return res.json()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. The server may be unreachable.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => request<{ user: User }>('/auth/me'),

  getAccounts: () => request<Account[]>('/accounts'),
  createAccount: (data: Omit<Account, 'id' | 'createdAt'>) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),

  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: Omit<Category, 'id'>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  getTransactions: () => request<Transaction[]>('/transactions'),
  createTransaction: (data: Omit<Transaction, 'id'>) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),

  getBudgets: () => request<Budget[]>('/budgets'),
  createBudget: (data: Omit<Budget, 'id'>) =>
    request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  updateBudget: (id: string, data: Partial<Omit<Budget, 'id'>>) =>
    request<Budget>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBudget: (id: string) =>
    request<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' }),

  getGoals: () => request<Goal[]>('/goals'),
  createGoal: (data: Omit<Goal, 'id'>) =>
    request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, data: Partial<Omit<Goal, 'id'>>) =>
    request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGoal: (id: string) =>
    request<{ message: string }>(`/goals/${id}`, { method: 'DELETE' }),
}
