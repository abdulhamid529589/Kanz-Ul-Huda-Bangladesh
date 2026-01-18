import { useState } from 'react'
import { X, Mail, ArrowLeft } from 'lucide-react'
import { API_URL } from '../utils/api'

const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setEmail('')
        // Auto-close after 5 seconds
        setTimeout(() => {
          onClose()
          onBackToLogin()
        }, 5000)
      } else {
        setError(data.message || 'Failed to process request. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Forgot password error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setError('')
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Reset Password</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-200 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {/* Error Message */}
            {error && (
              <div className="alert-error text-sm backdrop-blur-sm bg-red-500/20 border border-red-500/50">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200"
                  placeholder="your.email@example.com"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => {
                handleClose()
                onBackToLogin()
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-primary-300 hover:text-primary-200 font-medium transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-200 font-medium">✓ Email Sent Successfully!</p>
            </div>

            <p className="text-gray-200 text-sm">
              If an account exists with this email, you will receive a password reset link shortly.
            </p>

            <p className="text-gray-200 text-sm">
              Please check your email and follow the link to reset your password. The link will
              expire in 30 minutes.
            </p>

            <button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-6"
            ></button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal
