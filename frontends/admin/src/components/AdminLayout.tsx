import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { apiGetJson, ApiError } from '../api'
import { useAuth } from '../context/AuthContext'
import type { AdminOutletContext, AdminStats } from '../types/admin'

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  )
}

function IconTasks({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 12l2 2 4-4M8 6h8M6 4h12v16H6V4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zm8 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `admin-nav__link${isActive ? ' admin-nav__link--active' : ''}`

export default function AdminLayout() {
  const { logout } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const reloadStats = useCallback(async () => {
    setStatsError(null)
    try {
      const data = await apiGetJson<AdminStats>('/api/admin/stats')
      setStats(data)
    } catch (e) {
      setStatsError(e instanceof ApiError ? e.message : 'Failed to load stats.')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reloadStats()
  }, [reloadStats])

  const outletCtx: AdminOutletContext = {
    stats,
    statsLoading,
    statsError,
    reloadStats,
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand__logo" aria-hidden>
            PM
          </div>
          <div className="admin-brand__text">
            <span className="admin-brand__title">PeerMatch</span>
            <span className="admin-brand__subtitle">Admin Portal</span>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Main">
          <NavLink to="/dashboard" className={navClass} end>
            <IconDashboard className="admin-nav__icon" />
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={navClass}>
            <IconTasks className="admin-nav__icon" />
            Task Moderation
          </NavLink>
          <NavLink to="/usermanagement" className={navClass}>
            <IconUsers className="admin-nav__icon" />
            User Management
          </NavLink>
        </nav>

        <div className="admin-sidebar__footer">
          <p className="admin-sidebar__footer-label">Active Users</p>
          <p className="admin-sidebar__footer-value">
            {statsLoading ? '…' : (stats?.activeUsers ?? 0).toLocaleString()}
          </p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-search">
            <IconSearch className="admin-search__icon" />
            <input
              type="search"
              className="admin-search__input"
              placeholder="Search tasks or users..."
              aria-label="Search tasks or users"
            />
          </div>
          <div className="admin-topbar__actions">
            <button type="button" className="admin-icon-btn" aria-label="Notifications">
              <IconBell />
            </button>
            <button type="button" className="admin-icon-btn" aria-label="Settings">
              <IconSettings />
            </button>
            <button type="button" className="admin-icon-btn" aria-label="Sign out" onClick={() => void logout()}>
              <IconLogout />
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet context={outletCtx} />
        </main>
      </div>
    </div>
  )
}
