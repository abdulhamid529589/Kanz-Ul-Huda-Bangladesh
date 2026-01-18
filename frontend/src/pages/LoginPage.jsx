import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

const LoginPage = ({ onRegisterClick }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      return
    }

    setLoading(true)

    const result = await login(username, password)

    if (!result.success) {
      setError(result.message || 'Login failed. Please try again.')
    }

    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-secondary-900 relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute bottom-0 left-1/2 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: '4s' }}
      ></div>

      {/* Content */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md border border-white/20 hover:border-white/40 transition-all duration-300">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-block p-3 sm:p-4 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full mb-4 sm:mb-6 shadow-lg">
            <div className="text-4xl sm:text-5xl">🕌</div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">Kanz ul Huda</h1>
          <p className="text-sm sm:text-base text-gray-200">Durood Collection System</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="alert-error text-sm backdrop-blur-sm bg-red-500/20 border border-red-500/50">
              {error}
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Enter your username"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Enter your password"
              disabled={loading}
            />
            <div className="mt-3 text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
                className="text-sm text-primary-300 hover:text-primary-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner w-5 h-5 mr-2"></div>
                Logging in...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                Login
              </div>
            )}
          </button>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-200">
              Not a member yet?{' '}
              <button
                onClick={onRegisterClick}
                className="text-primary-300 hover:text-primary-200 font-medium transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Register as Dawah Team Member
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-300 mt-8">Digital Dawah Team Portal</p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    </div>
  )
}

export default LoginPage
