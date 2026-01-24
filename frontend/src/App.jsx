import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage from './pages/LoginPage'
import RegisterPage2FA from './pages/RegisterPage2FA'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Dashboard from './pages/Dashboard'
import MembersPage from './pages/MembersPage'
import SubmissionsPage from './pages/SubmissionsPage'
import ReportsPage from './pages/ReportsPage'
import PersonalReportsPage from './pages/PersonalReportsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import MemberProfilesPage from './pages/MemberProfilesPage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUserManagementPage from './pages/AdminUserManagementPage'
import AdminMemberManagementPage from './pages/AdminMemberManagementPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdvancedSearchPage from './pages/AdvancedSearchPage'
import RegistrationRequestPage from './pages/RegistrationRequestPage'
import MessagingPage from './pages/MessagingPage'
import Layout from './components/Layout'
import OfflineIndicator from './components/OfflineIndicator'
import { useServiceWorker } from './hooks/useServiceWorker'

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth()
  const { hasUpdate, updateServiceWorker } = useServiceWorker()
  const [showRegister, setShowRegister] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showRegistrationRequest, setShowRegistrationRequest] = useState(false)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show auth pages
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage2FA />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/registration-request" element={<RegistrationRequestPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Authenticated - show app with layout
  return (
    <>
      <OfflineIndicator hasUpdate={hasUpdate} onUpdate={updateServiceWorker} />
      <Layout>
        <Routes>
          {/* Public user routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/submissions" element={<SubmissionsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/personal-reports" element={<PersonalReportsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profiles" element={<MemberProfilesPage />} />
          <Route path="/settings" element={<ProfileSettingsPage />} />
          <Route path="/messaging" element={<MessagingPage />} />

          {/* Admin routes */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-users"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminUserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-members"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMemberManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/advanced-search" element={<AdvancedSearchPage />} />
          <Route
            path="/admin-analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </>
  )
}

// Root App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
