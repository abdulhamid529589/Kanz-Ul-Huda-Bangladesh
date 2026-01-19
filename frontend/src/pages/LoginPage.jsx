import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

const LoginPage = ({ onRegisterClick, onRegistrationRequestClick }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
      ></motion.div>
      <motion.div
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
      ></motion.div>
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        className="absolute bottom-0 left-1/2 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
      ></motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-white/10 backdrop-blur-2xl rounded-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md border border-white/20 hover:border-white/40 transition-all duration-300"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 sm:mb-10"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block p-3 sm:p-4 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full mb-4 sm:mb-6 shadow-2xl"
          >
            <div className="text-4xl sm:text-5xl">🕌</div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-bold text-primary-600 mb-2 sm:mb-3"
          >
            Kanz ul Huda Bangladesh
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base text-white text-bold font-medium"
          >
            Durood Collection System
          </motion.p>
        </motion.div>

        {/* Login Form */}
        <motion.div className="space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert-error text-sm bg-red-100 border border-red-400 rounded-xl text-red-800"
            >
              {error}
            </motion.div>
          )}

          {/* Username Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="block text-sm font-semibold text-gray mb-3">Username</label>
            <motion.input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-200 text-base sm:text-base font-medium"
              placeholder="Enter your username"
              disabled={loading}
              autoFocus
              whileFocus={{ scale: 1.02 }}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="block text-sm font-semibold text-gray mb-3">Password</label>
            <div className="relative">
              <motion.input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-200 text-base sm:text-base font-medium"
                placeholder="Enter your password"
                disabled={loading}
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </div>
            <motion.div className="mt-3 text-right">
              <motion.button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                disabled={loading}
                whileHover={{ x: 5 }}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot Password?
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            onClick={handleSubmit}
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="w-full mt-8 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="spinner w-5 h-5"
                ></motion.div>
                Logging in...
              </div>
            ) : (
              <motion.div
                className="flex items-center justify-center gap-2"
                whileHover={{ gap: 8 }}
              >
                <LogIn className="w-5 h-5" />
                Login
              </motion.div>
            )}
          </motion.button>

          {/* Register Links */}
          <motion.div
            className="space-y-3 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-gray-200">
              Not a member yet?{' '}
              <motion.button
                onClick={onRegistrationRequestClick}
                whileHover={{ color: '#86efac' }}
                className="text-primary-300 hover:text-primary-200 font-semibold transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Submit Registration Request
              </motion.button>
            </p>
            <p className="text-xs text-gray-300">or</p>
            <p className="text-sm text-gray-200">
              Already approved?{' '}
              <motion.button
                onClick={onRegisterClick}
                whileHover={{ color: '#fbbf24' }}
                className="text-secondary-300 hover:text-secondary-200 font-semibold transition-colors disabled:opacity-50"
                disabled={loading}
              >
                Create Account
              </motion.button>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-gray-300 mt-8 font-medium"
        >
          Digital Dawah Team Portal
        </motion.p>
      </motion.div>

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
