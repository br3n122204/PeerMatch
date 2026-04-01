import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiGetJson, ApiError } from '../api'

export default function DashboardPage() {
  const { status, user, role, logout } = useAuth()
  const [hint, setHint] = useState<string | null>(null)

  if (status === 'checking') {
    return (
      <div className="shell">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: '/dashboard' }} />
  }

  if (role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  const loadDashboard = async () => {
    setHint(null)
    try {
      const data = await apiGetJson<{ message?: string; ok?: boolean }>('/api/admin/dashboard')
      setHint(JSON.stringify(data, null, 2))
    } catch (err) {
      setHint(err instanceof ApiError ? err.message : 'Request failed.')
    }
  }

  const loadOverview = async () => {
    setHint(null)
    try {
      const data = await apiGetJson<{ message?: string }>('/api/admin/overview')
      setHint(JSON.stringify(data, null, 2))
    } catch (err) {
      setHint(err instanceof ApiError ? err.message : 'Request failed.')
    }
  }

  return (
    <div className="shell">
      <header className="top">
        <div>
          <p className="eyebrow">PeerMatch</p>
          <h1>Admin dashboard</h1>
          <p className="muted">
            {user?.name} · <span className="pill">{user?.role}</span>
          </p>
        </div>
        <button type="button" className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <section className="panel">
        <h2>Protected endpoints</h2>
        <p className="muted">
          JWT is stored in an HTTP-only cookie; role is mirrored in React state (and sessionStorage for refresh) after{' '}
          <code>/api/auth/me</code>.
        </p>
        <div className="row">
          <button type="button" className="primary" onClick={() => void loadDashboard()}>
            GET /api/admin/dashboard
          </button>
          <button type="button" className="primary" onClick={() => void loadOverview()}>
            GET /api/admin/overview
          </button>
        </div>
        {hint ? <pre className="hint">{hint}</pre> : null}
      </section>
    </div>
  )
}
