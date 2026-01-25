import { useState, useCallback } from 'react'
import { User, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { apiCall } from '../utils/api'

const ProfileSettingsPage = () => {
  const { token, user, logout } = useAuth()

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})
  const [profileMessage, setProfileMessage] = useState('')
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  // Validate profile form
  const validateProfileForm = useCallback(() => {
    const errors = {}
    if (!profileForm.fullName.trim()) errors.fullName = 'Full name is required'
    if (!profileForm.email.trim()) errors.email = 'Email is required'
    if (profileForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Invalid email format'
    }
    if (!profileForm.username.trim()) errors.username = 'Username is required'
    setProfileErrors(errors)
    return Object.keys(errors).length === 0
  }, [profileForm])

  // Validate password form
  const validatePasswordForm = useCallback(() => {
    const errors = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required'
    if (passwordForm.newPassword.length < 6)
      errors.newPassword = 'Password must be at least 6 characters'
    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Please confirm your password'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password'
    }
    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }, [passwordForm])

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfileForm()) return

    setProfileSubmitting(true)
    setProfileMessage('')

    try {
      const { ok, data } = await apiCall(
        `/users/${user._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            fullName: profileForm.fullName,
            email: profileForm.email,
            username: profileForm.username,
            phone: profileForm.phone,
          }),
        },
        token,
      )

      if (ok) {
        setProfileMessage('Profile updated successfully!')
        setTimeout(() => setProfileMessage(''), 3000)
      } else {
        setProfileMessage('Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setProfileMessage('An error occurred. Please try again.')
    } finally {
      setProfileSubmitting(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePasswordForm()) return

    setPasswordSubmitting(true)
    setPasswordMessage('')

    try {
      const { ok, data } = await apiCall(
        `/users/${user._id}/change-password`,
        {
          method: 'POST',
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
        token,
      )

      if (ok) {
        setPasswordMessage('Password changed successfully! Please log in again.')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setTimeout(() => {
          logout()
        }, 2000)
      } else {
        setPasswordMessage(
          data?.message || 'Failed to change password. Check your current password.',
        )
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordMessage('An error occurred. Please try again.')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Settings
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
          Manage your profile and security settings
        </p>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        className="card dark:bg-gray-800 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          Profile Information
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                  profileErrors.fullName
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your full name"
              />
              {profileErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{profileErrors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                  profileErrors.username
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your username"
              />
              {profileErrors.username && (
                <p className="text-red-500 text-xs mt-1">{profileErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                  profileErrors.email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Enter your email"
              />
              {profileErrors.email && (
                <p className="text-red-500 text-xs mt-1">{profileErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Enter your phone number (optional)"
              />
            </div>
          </div>

          {/* Role Display */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-900 dark:text-white font-medium capitalize">
                {user?.role || 'Member'}
              </p>
            </div>
          </div>

          {/* Success/Error Message */}
          {profileMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg flex items-center gap-2 ${
                profileMessage.includes('successfully')
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {profileMessage.includes('successfully') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {profileMessage}
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={profileSubmitting}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-700 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Password Section */}
      <motion.div
        className="card dark:bg-gray-800 dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                passwordErrors.currentPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your current password"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                passwordErrors.newPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter your new password"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all ${
                passwordErrors.confirmPassword
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Confirm your new password"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>

          {/* Success/Error Message */}
          {passwordMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg flex items-center gap-2 ${
                passwordMessage.includes('successfully')
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {passwordMessage.includes('successfully') ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {passwordMessage}
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={passwordSubmitting}
              className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Info Section */}
      <motion.div
        className="card bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> After changing your password, you'll be automatically logged out.
          You'll need to log in again with your new password.
        </p>
      </motion.div>
    </div>
  )
}

export default ProfileSettingsPage
