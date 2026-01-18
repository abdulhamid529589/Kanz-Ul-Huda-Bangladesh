import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import AdminUserManagementPage from './pages/AdminUserManagementPage'
import AdminMemberManagementPage from './pages/AdminMemberManagementPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import Layout from './components/Layout'

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showRegister, setShowRegister] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

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

  // Not authenticated - show login or register
  if (!user) {
    // Check if URL contains reset password parameters
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('token') && urlParams.has('email')) {
      return (
        <ResetPasswordPage
          onBackToLogin={() => {
            // Clear URL and go back to login
            window.history.replaceState({}, document.title, window.location.pathname)
            setShowResetPassword(false)
          }}
        />
      )
    }

    return showRegister ? (
      <RegisterPage2FA onBackToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onRegisterClick={() => setShowRegister(true)} />
    )
  }

  // Authenticated - show app
  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'members' && <MembersPage />}
      {currentPage === 'submissions' && <SubmissionsPage />}
      {currentPage === 'reports' && <ReportsPage />}
      {currentPage === 'personal-reports' && <PersonalReportsPage />}
      {currentPage === 'leaderboard' && <LeaderboardPage />}
      {currentPage === 'profiles' && <MemberProfilesPage />}
      {currentPage === 'settings' && <ProfileSettingsPage />}
      {currentPage === 'admin-users' && user?.role === 'admin' && <AdminUserManagementPage />}
      {currentPage === 'admin-members' && user?.role === 'admin' && <AdminMemberManagementPage />}
      {currentPage === 'admin-settings' && user?.role === 'admin' && <AdminSettingsPage />}
    </Layout>
  )
}

// Root App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
