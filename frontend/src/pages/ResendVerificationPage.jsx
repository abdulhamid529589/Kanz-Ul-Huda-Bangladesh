import { useState } from 'react'
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiCall } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const ResendVerificationPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleResend = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Please enter your email address')
      return
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await apiCall('/admin/users/resend-verification-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSent(true)
        showSuccess('Verification email sent! Check your inbox.')
      } else {
        const errorMsg = res.data?.message || 'Failed to send verification email'
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to send verification email'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Sent!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please check your inbox and click the link to verify your email. The link will expire in
            7 days.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Mail className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Resend Verification Email
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Enter the email address associated with your account to receive a new verification link.
          </p>
        </div>

        <form onSubmit={handleResend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="flex gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Resend Verification Email
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Tip:</strong> Check your spam folder if you don't see the email. Make sure to
            verify your email within 7 days.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResendVerificationPage
