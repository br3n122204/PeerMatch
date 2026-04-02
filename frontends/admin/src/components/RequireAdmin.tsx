import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RequireAdmin() {
  const { status, role } = useAuth()

  if (status === 'checking') {
    return (
      <div className="admin-auth-check">
        <p className="admin-auth-check__text">Checking session…</p>
      </div>
    )
  }

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />
  }

  if (role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
