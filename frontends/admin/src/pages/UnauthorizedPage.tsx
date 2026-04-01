import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function UnauthorizedPage() {
  const { status, user, role, logout } = useAuth()
  const navigate = useNavigate()

  if (status === 'checking') {
    return (
      <div className="shell">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="shell">
      <h1>PeerMatch Admin</h1>
      <p className="warn">
        Signed in as <strong>{user?.email}</strong>, but this area is only for administrators.
      </p>
      <p className="muted">API routes under <code>/api/admin</code> also return 403 for non-admins.</p>
      <div className="row" style={{ marginTop: '1rem' }}>
        <button type="button" className="primary" onClick={() => void logout()}>
          Sign out
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            void logout().then(() => navigate('/login', { replace: true }))
          }}
        >
          Switch account
        </button>
      </div>
    </div>
  )
}
