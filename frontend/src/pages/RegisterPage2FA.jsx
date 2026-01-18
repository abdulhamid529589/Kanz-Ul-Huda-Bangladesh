import { useState } from 'react'
import { UserPlus, Mail, ArrowLeft } from 'lucide-react'
import { apiCall } from '../utils/api'

const RegisterPage2FA = ({ onBackToLogin }) => {
  const [step, setStep] = useState('form') // 'form' or 'otp'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    registrationCode: '',
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
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

  const handleRequestOtp = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (ok) {
        setEmail(formData.email)
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp,
        }),
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

  const handleResendOtp = async () => {
    setLoading(true)

    try {
      const { ok, data } = await apiCall('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (ok) {
        setError('')
        // Show success message
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

        {step === 'form' ? (
          // Registration Form
          <form onSubmit={handleRequestOtp} className="space-y-3 sm:space-y-4">
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
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
                placeholder="Minimum 8 characters (A-Z, a-z, 0-9)"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-base sm:text-base"
                placeholder="Re-enter your password"
                disabled={loading}
              />
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
              {loading ? 'Sending OTP...' : 'Continue (Send OTP)'}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium mt-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </form>
        ) : (
          // OTP Verification
          <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-6">
            {/* Success Message */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-primary-600" />
                <p className="text-sm font-medium text-primary-200">OTP Sent Successfully</p>
              </div>
              <p className="text-sm text-gray-200">
                We've sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert-error text-sm backdrop-blur-sm bg-red-500/20 border border-red-500/50">
                {error}
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">
                Enter OTP (6 digits) *
              </label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white/20 transition-all duration-200 text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Timer Info */}
            <p className="text-center text-sm text-gray-300">
              OTP expires in 10 minutes. Check your spam folder if you don't see the email.
            </p>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-bold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            {/* Resend OTP */}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="w-full text-center text-sm text-primary-300 hover:text-primary-200 font-medium disabled:opacity-50 transition-colors"
            >
              Didn't receive OTP? Resend
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep('form')
                setOtp('')
                setError('')
              }}
              className="w-full flex items-center justify-center gap-2 text-primary-300 hover:text-primary-200 font-medium mt-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Registration
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default RegisterPage2FA
