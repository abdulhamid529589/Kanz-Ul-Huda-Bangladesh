import { useState } from 'react'
import { UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { apiCall } from '../utils/api'
import { showSuccess, showError } from '../utils/toast'
import { useAuth } from '../context/AuthContext'

const RegisterPage2FA = ({ onBackToLogin }) => {
  const { refreshUser } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    registrationCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required')
      return false
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      setError('Please enter a valid email')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.registrationCode.trim()) {
      setError('Registration code is required')
      return false
    }
    return true
  }

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (ok) {
        // Store token
        localStorage.setItem('token', data.data.token)
        showSuccess('Registration successful! Welcome aboard!')
        
        // Refresh user context to load the authenticated state
        await refreshUser()
      } else {
        setError(data.message || 'Registration failed. Please try again.')
        showError(data.message || 'Registration failed')
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      showError('Registration error: ' + err.message)
    } finally {
      setLoading(false)
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
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-3 sm:p-4 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full mb-4 sm:mb-6 shadow-lg">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Join Our Team</h1>
          <p className="text-sm sm:text-base text-gray-200">Register as Dawah Team Member</p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
          {/* Error Message */}
          {error && (
            <div className="alert-error text-sm backdrop-blur-sm bg-red-500/20 border border-red-500/50">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Enter your full name"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Choose a username (3+ characters)"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
                placeholder="Minimum 8 characters (A-Z, a-z, 0-9)"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
                placeholder="Re-enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Registration Code */}
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-2">
              Registration Code *
            </label>
            <input
              type="text"
              name="registrationCode"
              value={formData.registrationCode}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
              placeholder="Enter registration code"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>

          {/* Back to Login */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full flex items-center justify-center gap-2 text-primary-300 hover:text-primary-200 font-medium mt-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage2FA
