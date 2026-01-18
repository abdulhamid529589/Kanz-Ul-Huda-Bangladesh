import { useState, useEffect } from 'react'
import { Key, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { API_URL } from '../utils/api'

const ResetPasswordPage = ({ onBackToLogin }) => {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const email = urlParams.get('email')
  const token = urlParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [validToken, setValidToken] = useState(false)

  // Verify reset token on mount
  useEffect(() => {
    verifyToken()
  }, [email, token])

  const verifyToken = async () => {
    if (!email || !token) {
      setError('Invalid reset link. Missing email or token.')
      setVerifying(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidToken(true)
      } else {
        setError(data.message || 'Invalid or expired reset link.')
      }
    } catch (err) {
      setError('Failed to verify reset token. Please try again.')
      console.error('Token verification error:', err)
    } finally {
      setVerifying(false)
    }
  }

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      setError('Please enter both password fields')
      return false
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Password must contain uppercase, lowercase, and numbers')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validatePasswords()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onBackToLogin()
        }, 3000)
      } else {
        setError(data.message || 'Failed to reset password. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Password reset error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    onBackToLogin()
  }

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (!validToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-red-600">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Link</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={handleBackToLogin} className="btn-primary">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-green-600">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Password Reset Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your password has been reset successfully. You will be redirected to login in a few
              seconds.
            </p>
            <button onClick={handleBackToLogin} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Reset form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-primary-600">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-2 sm:p-3 bg-primary-100 rounded-full mb-3 sm:mb-4">
            <Key className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Create a new password for your account
          </p>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && <div className="alert-error text-sm">{error}</div>}

          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10 text-base sm:text-base"
                placeholder="At least 8 characters"
                disabled={loading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must include uppercase, lowercase, and numbers
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10 text-base sm:text-base"
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Password Requirements:</div>
              <div className="space-y-1">
                <div
                  className={`text-xs flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <span>✓</span> Uppercase letter
                </div>
                <div
                  className={`text-xs flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <span>✓</span> Lowercase letter
                </div>
                <div
                  className={`text-xs flex items-center gap-2 ${/\d/.test(newPassword) ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <span>✓</span> Number
                </div>
                <div
                  className={`text-xs flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}
                >
                  <span>✓</span> At least 8 characters
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-8">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="spinner w-5 h-5 mr-2"></div>
                Resetting...
              </div>
            ) : (
              'Reset Password'
            )}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={loading}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
            >
              Back to Login
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">Digital Dawah Team Portal</p>
      </div>
    </div>
  )
}

export default ResetPasswordPage
