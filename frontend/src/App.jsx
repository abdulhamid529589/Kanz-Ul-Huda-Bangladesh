import { useState, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import Layout from './components/Layout'
import OfflineIndicator from './components/OfflineIndicator'
import { useServiceWorker } from './hooks/useServiceWorker'

// Lazy load all pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage2FA = lazy(() => import('./pages/RegisterPage2FA'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const MembersPage = lazy(() => import('./pages/MembersPage'))
const SubmissionsPage = lazy(() => import('./pages/SubmissionsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const PersonalReportsPage = lazy(() => import('./pages/PersonalReportsPage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const MemberProfilesPage = lazy(() => import('./pages/MemberProfilesPage'))
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminUserManagementPage = lazy(() => import('./pages/AdminUserManagementPage'))
const AdminMemberManagementPage = lazy(() => import('./pages/AdminMemberManagementPage'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))
const AdvancedSearchPage = lazy(() => import('./pages/AdvancedSearchPage'))
const RegistrationRequestPage = lazy(() => import('./pages/RegistrationRequestPage'))
const MessagingPage = lazy(() => import('./pages/MessagingPage'))

// Loading fallback component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="spinner w-12 h-12 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
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
    return <LoadingSpinner />
  }

  // Not authenticated - show auth pages
  if (!user) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage2FA />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/registration-request" element={<RegistrationRequestPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  // Authenticated - show app with layout
  return (
    <SocketProvider>
      <OfflineIndicator hasUpdate={hasUpdate} onUpdate={updateServiceWorker} />
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </Layout>
    </SocketProvider>
  )
}

// Root App Component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
