import { FormEvent, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api'

export default function LoginPage() {
  const { status, user, role, login } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (status === 'checking') {
    return (
      <div className="shell narrow">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (status === 'authenticated' && user && role === 'admin') {
    return <Navigate to={from} replace />
  }

  if (status === 'authenticated' && user && role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Enter email and password.')
      return
    }
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.')
      return
    }
  }

  return (
    <div className="shell narrow">
      <h1>PeerMatch Admin</h1>
      <p className="muted">Sign in with a seeded or promoted admin account.</p>

      <form className="form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="primary">
          Sign in
        </button>
      </form>
    </div>
  )
}
