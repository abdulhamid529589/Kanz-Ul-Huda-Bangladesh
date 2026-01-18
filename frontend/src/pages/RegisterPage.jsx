import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { UserPlus, ArrowLeft } from 'lucide-react'

const RegisterPage = ({ onBackToLogin }) => {
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
  const { register } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('') // Clear error on input change
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    const result = await register(formData)

    if (!result.success) {
      setError(result.message || 'Registration failed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-primary-600">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-2 sm:p-3 bg-primary-100 rounded-full mb-3 sm:mb-4">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Join Our Team
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Register as Dawah Team Member</p>
        </div>

        {/* Registration Form */}
        <div className="space-y-3 sm:space-y-4">
          {/* Error Message */}
          {error && <div className="alert-error text-sm">{error}</div>}

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="Enter your full name"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="Choose a username (min 3 chars)"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="your.email@example.com"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="Min 8 characters with uppercase, lowercase, number"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="Re-enter your password"
              disabled={loading}
            />
          </div>

          {/* Registration Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Code *
            </label>
            <input
              type="text"
              name="registrationCode"
              value={formData.registrationCode}
              onChange={handleChange}
              className="input-field text-base sm:text-base"
              placeholder="Enter team registration code"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Contact your team leader for the registration code
            </p>
          </div>

          {/* Submit Button */}
          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner w-5 h-5 mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Register'
            )}
          </button>

          {/* Back to Login */}
          <button
            onClick={onBackToLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          By registering, you agree to join the Kanz ul Huda Digital Dawah Team
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
