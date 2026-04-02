import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiGetJson, apiPostJson, apiSend, ApiError, type AuthUser } from '../api'

type MeResponse = { user: AuthUser }

export type AuthStatus = 'checking' | 'guest' | 'authenticated'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  role: string | null
  refreshSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const ROLE_STORAGE_KEY = 'peermatch_admin_role'

function persistRole(role: string | null) {
  if (typeof sessionStorage === 'undefined') return
  if (role) sessionStorage.setItem(ROLE_STORAGE_KEY, role)
  else sessionStorage.removeItem(ROLE_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<AuthUser | null>(null)

  const refreshSession = useCallback(async () => {
    try {
      const { user: next } = await apiGetJson<MeResponse>('/api/admin/auth/me')
      setUser(next)
      setStatus('authenticated')
      persistRole(next.role)
    } catch (err) {
      setUser(null)
      setStatus('guest')
      persistRole(null)
      if (err instanceof ApiError && err.status !== 401 && err.status !== 403) {
        throw err
      }
    }
  }, [])

  useEffect(() => {
    void refreshSession().catch(() => {})
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    await apiPostJson<{ user: AuthUser }>('/api/admin/auth/login', { email, password })
    const { user: next } = await apiGetJson<MeResponse>('/api/admin/auth/me')
    setUser(next)
    setStatus('authenticated')
    persistRole(next.role)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiSend('/api/admin/auth/logout', 'POST')
    } catch {
      /* cookie cleared server-side or network error */
    }
    setUser(null)
    setStatus('guest')
    persistRole(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      role: user?.role ?? null,
      refreshSession,
      login,
      logout,
    }),
    [status, user, refreshSession, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
