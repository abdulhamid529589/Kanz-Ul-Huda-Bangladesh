import { useState } from 'react'
import { Mail, ArrowLeft, LogIn } from 'lucide-react'
import { apiCall } from '../utils/api'

const LoginPage2FA = ({ onBackToOldLogin, onRegisterClick }) => {
  const [step, setStep] = useState('credentials') // 'credentials' or 'otp'
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')

  const handleCredentialsChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleOtpChange = (e) => {
    // Only allow numbers and max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(value)
    setError('')
  }

  const handleRequestOTP = async (e) => {
    e.preventDefault()

    if (!credentials.username.trim()) {
      setError('Username is required')
      return
    }

    if (!credentials.password.trim()) {
      setError('Password is required')
      return
    }

    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/login-request-otp', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      if (ok) {
        setUsername(credentials.username)
        setStep('otp')
        setError('')
      } else {
        setError(data.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/login-verify-otp', {
        method: 'POST',
        body: JSON.stringify({ username, otp }),
      })

      if (ok) {
        // Store token and redirect to dashboard
        localStorage.setItem('token', data.data.token)
        window.location.href = '/dashboard'
      } else {
        setError(data.message || 'OTP verification failed')
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/login-resend-otp', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })

      if (ok) {
        setError('')
        alert('New OTP sent to your email')
      } else {
        setError(data.message || 'Failed to resend OTP')
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border-t-4 border-primary-600">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block p-2 sm:p-3 bg-primary-100 rounded-full mb-3 sm:mb-4">
            <LogIn className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Kanz ul Huda
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Secure Login with 2FA</p>
        </div>

        {step === 'credentials' ? (
          // Credentials Entry
          <form onSubmit={handleRequestOTP} className="space-y-3 sm:space-y-4">
            {/* Error Message */}
            {error && <div className="alert-error text-sm">{error}</div>}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleCredentialsChange}
                className="input-field text-base sm:text-base"
                placeholder="Enter your username"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleCredentialsChange}
                className="input-field text-base sm:text-base"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 sm:mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Continue (Send OTP)'}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Not a member yet?{' '}
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  disabled={loading}
                >
                  Register
                </button>
              </p>
            </div>

            {/* Back to Old Login */}
            <button
              type="button"
              onClick={onBackToOldLogin}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 font-medium mt-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Use Password Login
            </button>
          </form>
        ) : (
          // OTP Verification
          <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
            {/* Success Message */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-primary-600" />
                <p className="text-sm font-medium text-primary-900">OTP Sent Successfully</p>
              </div>
              <p className="text-sm text-primary-800">
                We've sent a 6-digit code to your registered email.
              </p>
            </div>

            {/* Error Message */}
            {error && <div className="alert-error text-sm">{error}</div>}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP (6 digits) *
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                className="input-field text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Timer Info */}
            <p className="text-center text-sm text-gray-600">
              OTP expires in 10 minutes. Check your spam folder if you don't see the email.
            </p>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Resend OTP */}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              Didn't receive OTP? Resend
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('credentials')
                setOtp('')
                setError('')
                setCredentials({ username: '', password: '' })
              }}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-700 font-medium mt-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default LoginPage2FA
