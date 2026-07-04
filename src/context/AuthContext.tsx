import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '../types/entities'
import { api, getAuthToken, setAuthToken, setOnUnauthorized } from '../api/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setOnUnauthorized(logout)
  }, [logout])

  useEffect(() => {
    async function loadSession() {
      try {
        const { user: me } = await api.me()
        setUser(me)
      } catch {
        setAuthToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    if (getAuthToken()) loadSession()
    else setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { user: loggedIn, token } = await api.login(email, password)
    setAuthToken(token)
    setUser(loggedIn)
  }

  const register = async (name: string, email: string, password: string) => {
    const { user: registered, token } = await api.register(name, email, password)
    setAuthToken(token)
    setUser(registered)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
