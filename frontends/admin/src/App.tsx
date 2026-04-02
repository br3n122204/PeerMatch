import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './components/AdminLayout'
import RequireAdmin from './components/RequireAdmin'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import TaskModerationPage from './pages/TaskModerationPage'
import UserManagementPage from './pages/UserManagementPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

function HomeRedirect() {
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<AdminDashboardPage />} />
              <Route path="/tasks" element={<Navigate to="/tasks/pending" replace />} />
              <Route path="/tasks/pending" element={<TaskModerationPage />} />
              <Route path="/tasks/flagged" element={<TaskModerationPage />} />
              <Route path="/tasks/approved" element={<TaskModerationPage />} />
              <Route path="/tasks/*" element={<Navigate to="/tasks/pending" replace />} />
              <Route path="/usermanagement/*" element={<UserManagementPage />} />
              <Route
                path="/users"
                element={<Navigate to="/usermanagement/allusers" replace />}
              />
            </Route>
          </Route>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
