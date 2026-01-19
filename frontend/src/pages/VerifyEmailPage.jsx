import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiCall } from '../utils/api'
import { showError, showSuccess } from '../utils/toast'

const VerifyEmailPage = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token provided')
        setLoading(false)
        return
      }

      try {
        const res = await apiCall(`/admin/users/verify-email/${token}`, {
          method: 'POST',
        })

        if (res.ok) {
          setVerified(true)
          showSuccess('Email verified successfully! Your account is now active.')
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login')
          }, 3000)
        } else {
          setError(res.data?.message || 'Failed to verify email')
          showError(res.data?.message || 'Failed to verify email')
        }
      } catch (error) {
        setError(error.message || 'Failed to verify email')
        showError(error.message || 'Failed to verify email')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        {loading ? (
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your email address...
            </p>
          </div>
        ) : verified ? (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your email has been verified successfully. Your account is now active and ready to
              use.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login page in 3 seconds...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 w-full px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error || 'Unable to verify your email. The link may be expired or invalid.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Back to Login
              </button>
              <button
                onClick={() => navigate('/resend-verification')}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Resend Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
