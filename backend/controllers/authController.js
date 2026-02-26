import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import OTPVerification from '../models/OTPVerification.js'
import LoginOTP from '../models/LoginOTP.js'
import PasswordReset from '../models/PasswordReset.js'
import Settings from '../models/Settings.js'
import RegistrationRequest from '../models/RegistrationRequest.js'
import { generateAccessToken, generateRefreshToken, generateToken } from '../middleware/auth.js'
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
  sendErrorResponse,
} from '../utils/errorHandler.js'
import logger from '../utils/logger.js'
import {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from '../utils/emailService.js'

/**
 * @desc    Request registration - Step 1: Send OTP
 * @route   POST /api/auth/request-otp
 * @access  Public
 */
export const requestOTP = asyncHandler(async (req, res) => {
  try {
    const { username, password, fullName, email, registrationCode } = req.body

    logger.info('OTP request received', { email, username })

    // Get registration code from database, fallback to .env
    let codeSettings
    try {
      codeSettings = await Settings.findOne({ key: 'registrationCode' })
    } catch (dbError) {
      logger.error('Error fetching registration code from database', { error: dbError.message })
      codeSettings = null
    }
    const REGISTRATION_CODE =
      codeSettings?.value || process.env.REGISTRATION_CODE || 'KANZULHUDA2026'

    if (registrationCode !== REGISTRATION_CODE) {
      throw new AppError('Invalid registration code. Please contact the administrator.', 400)
    }

    // Get current registration code version
    let versionSettings
    try {
      versionSettings = await Settings.findOne({ key: 'registrationCodeVersion' })
    } catch (dbError) {
      logger.error('Error fetching registration code version', { error: dbError.message })
      versionSettings = null
    }
    const currentCodeVersion = versionSettings?.value || 1

    // Check if username already exists
    const usernameExists = await User.findOne({ username: username.toLowerCase() })
    if (usernameExists) {
      throw new AppError('Username already exists', 400)
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() })
    if (emailExists) {
      throw new AppError('Email already exists', 400)
    }

    // Check if email has an approved registration request
    let registrationRequest
    try {
      registrationRequest = await RegistrationRequest.findOne({
        email: email.toLowerCase(),
      })
    } catch (dbError) {
      logger.error('Error checking registration request', { email, error: dbError.message })
      throw new AppError('Database error. Please try again later.', 500)
    }

    if (!registrationRequest || registrationRequest.status !== 'approved') {
      throw new AppError(
        'Your email is not approved for registration. Please submit a registration request first.',
        403,
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    logger.info('OTP generated', { email, otp: otp.substring(0, 3) + '***' })

    // Delete any existing OTP for this email
    try {
      await OTPVerification.deleteOne({ email: email.toLowerCase() })
    } catch (dbError) {
      logger.error('Error deleting existing OTP', { email, error: dbError.message })
    }

    // Create OTP record
    let otpRecord
    try {
      otpRecord = await OTPVerification.create({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        otp,
        expiresAt,
        registrationData: {
          password,
          fullName,
          registrationCode,
          registrationCodeVersion: currentCodeVersion,
        },
      })
      logger.info('OTP record created', { email, otpId: otpRecord._id })
    } catch (dbError) {
      logger.error('Error creating OTP record', { email, error: dbError.message })
      throw new AppError('Database error while creating OTP. Please try again.', 500)
    }

    // Send OTP email
    try {
      logger.info('Attempting to send OTP email', { email })
      await sendOTPEmail(email, otp, fullName)
      logger.info('OTP email sent successfully', { email })
    } catch (emailError) {
      logger.error('Failed to send OTP email', {
        email,
        error: emailError.message,
        code: emailError.code,
        stack: emailError.stack,
      })
      // Delete the OTP record if email sending fails
      try {
        await OTPVerification.deleteOne({ _id: otpRecord._id })
      } catch (deleteError) {
        logger.error('Error deleting OTP record after email failure', {
          error: deleteError.message,
        })
      }
      throw new AppError(
        'Failed to send OTP email. Please verify your email address and try again.',
        500,
      )
    }

    logger.info('OTP sent for registration', { email, username: username.toLowerCase() })

    sendSuccessResponse(res, 200, 'OTP sent to your email. Valid for 10 minutes.', {
      email: email.toLowerCase(),
    })
  } catch (error) {
    // Re-throw the error to be caught by asyncHandler
    throw error
  }
})

/**
 * @desc    Verify OTP and complete registration - Step 2
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body

  if (!email || !otp) {
    throw new AppError('Email and OTP are required', 400)
  }

  // Find OTP record
  const otpRecord = await OTPVerification.findOne({
    email: email.toLowerCase(),
  })

  if (!otpRecord) {
    throw new AppError('No OTP found for this email. Please request a new one.', 400)
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiresAt) {
    await OTPVerification.deleteOne({ _id: otpRecord._id })
    throw new AppError('OTP has expired. Please request a new one.', 400)
  }

  // Check OTP attempts
  if (otpRecord.attempts >= 5) {
    await OTPVerification.deleteOne({ _id: otpRecord._id })
    throw new AppError('Too many incorrect attempts. Please request a new OTP.', 429)
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1
    await otpRecord.save()
    throw new AppError(`Incorrect OTP. ${5 - otpRecord.attempts} attempts remaining.`, 400)
  }

  // OTP verified - now create the user
  const { password, fullName, registrationCode, registrationCodeVersion } =
    otpRecord.registrationData
  const username = otpRecord.username

  // Check if this is the first user (make them admin)
  const userCount = await User.countDocuments()
  const role = userCount === 0 ? 'admin' : 'collector'

  // Create user
  const user = await User.create({
    username,
    password,
    fullName,
    email: email.toLowerCase(),
    role,
    status: 'active',
    registrationCodeVersion,
  })

  logger.info('New user registered with 2FA', { username: user.username, role: user.role })

  // Delete OTP record after successful verification
  await OTPVerification.deleteOne({ _id: otpRecord._id })

  // Send welcome email
  await sendWelcomeEmail(email, fullName, username)

  // Generate token
  const token = generateToken(user._id)
  const userResponse = user.toJSON()

  sendSuccessResponse(res, 201, `Registration successful! You are registered as ${role}.`, {
    token,
    user: userResponse,
  })
})

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  // Find OTP record
  const otpRecord = await OTPVerification.findOne({
    email: email.toLowerCase(),
  })

  if (!otpRecord) {
    throw new AppError('No registration found for this email.', 400)
  }

  // Generate new OTP
  const newOtp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  otpRecord.otp = newOtp
  otpRecord.expiresAt = expiresAt
  otpRecord.attempts = 0
  await otpRecord.save()

  // Send new OTP email
  try {
    await sendOTPEmail(email, newOtp, otpRecord.registrationData.fullName)
  } catch (error) {
    throw new AppError('Failed to send OTP email. Please try again.', 500)
  }

  logger.info('OTP resent for registration', { email })

  sendSuccessResponse(res, 200, 'New OTP sent to your email. Valid for 10 minutes.')
})

/**
 * @desc    Register new user (Dawah team member) - LEGACY (kept for backward compatibility)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  try {
    const { username, password, fullName, email, phone, registrationCode } = req.body

    logger.info('Registration request received', { email, username, phone })

    // Get registration code from database, fallback to .env
    let codeSettings
    try {
      codeSettings = await Settings.findOne({ key: 'registrationCode' })
    } catch (dbError) {
      logger.error('Error fetching registration code from database', { error: dbError.message })
      codeSettings = null
    }
    const REGISTRATION_CODE =
      codeSettings?.value || process.env.REGISTRATION_CODE || 'KANZULHUDA2026'

    if (registrationCode !== REGISTRATION_CODE) {
      throw new AppError('Invalid registration code. Please contact the administrator.', 400)
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username: username.toLowerCase() })
    if (usernameExists) {
      throw new AppError('Username already exists', 400)
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() })
    if (emailExists) {
      throw new AppError('Email already exists', 400)
    }

    // Check if email has an approved registration request
    let registrationRequest
    try {
      registrationRequest = await RegistrationRequest.findOne({
        email: email.toLowerCase(),
      })
    } catch (dbError) {
      logger.error('Error checking registration request', { email, error: dbError.message })
      throw new AppError('Database error. Please try again later.', 500)
    }

    if (!registrationRequest || registrationRequest.status !== 'approved') {
      throw new AppError(
        'Your email is not approved for registration. Please submit a registration request first.',
        403,
      )
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments()
    const role = userCount === 0 ? 'admin' : 'collector'

    // Create user
    let user
    try {
      user = await User.create({
        username: username.toLowerCase(),
        password,
        fullName,
        email: email.toLowerCase(),
        phone,
        role,
        status: 'active',
      })
      logger.info('New user registered', {
        username: user.username,
        email: user.email,
        role: user.role,
      })
    } catch (dbError) {
      logger.error('Error creating user', { email, username, error: dbError.message })
      throw new AppError('Failed to create user account. Please try again.', 500)
    }

    // Generate token
    const token = generateToken(user._id)

    // Remove password from response
    const userResponse = user.toJSON()

    logger.info('Registration successful', { username: user.username, role: user.role })

    sendSuccessResponse(res, 201, `Registration successful! You are registered as ${role}.`, {
      token,
      user: userResponse,
    })
  } catch (error) {
    throw error
  }
})

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body

  // Find user and include password for comparison
  const user = await User.findOne({ username: username.toLowerCase() }).select('+password')

  if (!user) {
    logger.warn('Login attempt with invalid username', { username: username.toLowerCase() })
    throw new AppError('Invalid credentials', 401)
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Your account is inactive. Please contact administrator.', 403)
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password)

  if (!isPasswordMatch) {
    logger.warn('Login attempt with invalid password', { username: user.username })
    throw new AppError('Invalid credentials', 401)
  }

  // Update last login
  user.lastLogin = new Date()

  // Check if this user is the main admin (based on MAIN_ADMIN_EMAIL)
  if (user.role === 'admin' && process.env.MAIN_ADMIN_EMAIL) {
    user.isMainAdmin = user.email === process.env.MAIN_ADMIN_EMAIL.toLowerCase()
  } else {
    user.isMainAdmin = false
  }

  // Generate access and refresh tokens
  const accessToken = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  // Store refresh token in database
  user.refreshToken = refreshToken
  await user.save()

  logger.info('User logged in', {
    username: user.username,
    userId: user._id,
    isMainAdmin: user.isMainAdmin,
  })

  // Remove password from response
  const userResponse = user.toJSON()

  sendSuccessResponse(res, 200, 'Login successful', {
    accessToken,
    refreshToken,
    user: userResponse,
  })
})

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check if this user is the main admin (based on MAIN_ADMIN_EMAIL)
  if (user.role === 'admin' && process.env.MAIN_ADMIN_EMAIL) {
    user.isMainAdmin = user.email === process.env.MAIN_ADMIN_EMAIL.toLowerCase()
  } else {
    user.isMainAdmin = false
  }

  sendSuccessResponse(res, 200, 'User data retrieved', { user })
})

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // In JWT, logout is handled on client side by removing token
  // But we can log the logout event if needed
  logger.info('User logged out', { userId: req.user.id })

  // Clear refresh token from database
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null })

  sendSuccessResponse(res, 200, 'Logout successful')
})

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body

  if (!token) {
    throw new AppError('Refresh token is required', 400)
  }

  // Find user with this refresh token
  const user = await User.findOne({ refreshToken: token })

  if (!user) {
    throw new AppError('Invalid refresh token', 401)
  }

  // Verify refresh token
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id)

    logger.info('Access token refreshed', { userId: user._id })

    sendSuccessResponse(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
    })
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401)
  }
})

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  // Get user with password
  const user = await User.findById(req.user.id).select('+password')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword)

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401)
  }

  // Update password
  user.password = newPassword
  await user.save()

  logger.info('Password changed', { userId: user._id })

  sendSuccessResponse(res, 200, 'Password changed successfully')
})

/**
 * @desc    Request login OTP - Step 1: Send OTP for 2FA login
 * @route   POST /api/auth/login-request-otp
 * @access  Public
 */
export const loginRequestOTP = asyncHandler(async (req, res) => {
  const { username, password } = req.body

  // Find user with password
  const user = await User.findOne({ username: username.toLowerCase() }).select('+password')

  if (!user) {
    logger.warn('Login OTP attempt with invalid username', { username: username.toLowerCase() })
    throw new AppError('Invalid credentials', 401)
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new AppError('Your account is inactive. Please contact administrator.', 403)
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password)

  if (!isPasswordMatch) {
    logger.warn('Login OTP attempt with invalid password', { username: user.username })
    throw new AppError('Invalid credentials', 401)
  }

  // Generate OTP for login verification
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  // Delete any existing login OTP for this user
  await LoginOTP.deleteOne({ userId: user._id })

  // Create login OTP record
  const loginOtpRecord = await LoginOTP.create({
    userId: user._id,
    username: user.username,
    email: user.email,
    otp,
    expiresAt,
  })

  // Send OTP email
  try {
    await sendOTPEmail(user.email, otp, user.fullName)
  } catch (error) {
    // Delete the OTP record if email sending fails
    await LoginOTP.deleteOne({ _id: loginOtpRecord._id })
    throw new AppError('Failed to send OTP email. Please try again.', 500)
  }

  logger.info('Login OTP sent', { username: user.username, userId: user._id })

  sendSuccessResponse(res, 200, 'OTP sent to your email. Valid for 10 minutes.', {
    email: user.email,
    username: user.username,
  })
})

/**
 * @desc    Verify login OTP - Step 2: Verify OTP and complete login
 * @route   POST /api/auth/login-verify-otp
 * @access  Public
 */
export const loginVerifyOTP = asyncHandler(async (req, res) => {
  const { username, otp } = req.body

  if (!username || !otp) {
    throw new AppError('Username and OTP are required', 400)
  }

  // Find user first
  const user = await User.findOne({ username: username.toLowerCase() })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Find login OTP record
  const loginOtpRecord = await LoginOTP.findOne({
    userId: user._id,
  })

  if (!loginOtpRecord) {
    throw new AppError('No OTP found. Please login again to request a new OTP.', 400)
  }

  // Check if OTP is expired
  if (new Date() > loginOtpRecord.expiresAt) {
    await LoginOTP.deleteOne({ _id: loginOtpRecord._id })
    throw new AppError('OTP has expired. Please login again.', 400)
  }

  // Check OTP attempts
  if (loginOtpRecord.attempts >= 5) {
    await LoginOTP.deleteOne({ _id: loginOtpRecord._id })
    throw new AppError('Too many incorrect attempts. Please login again.', 429)
  }

  // Verify OTP
  if (loginOtpRecord.otp !== otp) {
    loginOtpRecord.attempts += 1
    await loginOtpRecord.save()
    throw new AppError(`Incorrect OTP. ${5 - loginOtpRecord.attempts} attempts remaining.`, 400)
  }

  // OTP verified - update last login
  user.lastLogin = new Date()
  await user.save()

  // Delete used OTP record
  await LoginOTP.deleteOne({ _id: loginOtpRecord._id })

  logger.info('User logged in with 2FA', { username: user.username, userId: user._id })

  // Generate token
  const token = generateToken(user._id)
  const userResponse = user.toJSON()

  sendSuccessResponse(res, 200, 'Login successful', {
    token,
    user: userResponse,
  })
})

/**
 * @desc    Resend login OTP
 * @route   POST /api/auth/login-resend-otp
 * @access  Public
 */
export const loginResendOTP = asyncHandler(async (req, res) => {
  const { username } = req.body

  if (!username) {
    throw new AppError('Username is required', 400)
  }

  // Find user
  const user = await User.findOne({ username: username.toLowerCase() })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Find login OTP record
  const loginOtpRecord = await LoginOTP.findOne({
    userId: user._id,
  })

  if (!loginOtpRecord) {
    throw new AppError('No login OTP request found. Please login again.', 400)
  }

  // Generate new OTP
  const newOtp = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  loginOtpRecord.otp = newOtp
  loginOtpRecord.expiresAt = expiresAt
  loginOtpRecord.attempts = 0
  await loginOtpRecord.save()

  // Send new OTP email
  try {
    await sendOTPEmail(user.email, newOtp, user.fullName)
  } catch (error) {
    throw new AppError('Failed to send OTP email. Please try again.', 500)
  }

  logger.info('Login OTP resent', { username: user.username })

  sendSuccessResponse(res, 200, 'New OTP sent to your email. Valid for 10 minutes.')
})

/**
 * @desc    Request password reset - Step 1: Send reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
/**
 * @desc    Request password reset - Step 1: Send reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  console.log('🔍 === FORGOT PASSWORD DEBUG START ===')
  console.log('Request body:', req.body)

  const { email } = req.body

  if (!email) {
    console.log('❌ No email provided')
    throw new AppError('Email is required', 400)
  }

  console.log('📧 Looking for user with email:', email.toLowerCase())

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    // For security, we still return success even if user doesn't exist
    // This prevents email enumeration attacks
    console.log('⚠️ User not found:', email.toLowerCase())
    logger.warn('Password reset requested for non-existent email', { email: email.toLowerCase() })
    sendSuccessResponse(
      res,
      200,
      'If an account exists with this email, you will receive a password reset link.',
    )
    return
  }

  console.log('✅ User found:', user.email)
  console.log('🔑 Generating reset token...')

  // Generate reset token
  let resetToken
  try {
    resetToken = await PasswordReset.generateResetToken(email)
    console.log('✅ Reset token generated successfully')
  } catch (error) {
    console.error('❌ Error generating reset token:', error.message)
    throw new AppError('Failed to generate reset token. Please try again.', 500)
  }

  // Create reset link
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`

  console.log('🔗 Reset link created:', resetLink)
  console.log('📧 Environment check:')
  console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL)
  console.log('  - EMAIL_HOST:', process.env.EMAIL_HOST)
  console.log('  - EMAIL_PORT:', process.env.EMAIL_PORT)
  console.log('  - EMAIL_USER:', process.env.EMAIL_USER)
  console.log('  - EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD)

  // Send reset email
  console.log('📤 Attempting to send password reset email...')
  try {
    await sendPasswordResetEmail(email, resetLink, user.fullName)
    console.log('✅ Password reset email sent successfully')
  } catch (error) {
    console.error('❌ === EMAIL SENDING FAILED ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
    console.error('Error response:', error.response)
    console.error('Full error:', error)
    console.error('Error stack:', error.stack)

    // Delete the reset record if email sending fails
    try {
      await PasswordReset.deleteOne({ email: email.toLowerCase() })
      console.log('🗑️ Deleted password reset record after email failure')
    } catch (deleteError) {
      console.error('❌ Failed to delete reset record:', deleteError.message)
    }

    // Return detailed error in development, generic in production
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Failed to send password reset email. Please try again.'
        : `Email error: ${error.message} (Code: ${error.code || 'UNKNOWN'})`

    throw new AppError(errorMessage, 500)
  }

  logger.info('Password reset email sent', { email: user.email })
  console.log('✅ === FORGOT PASSWORD COMPLETE ===')

  sendSuccessResponse(
    res,
    200,
    'If an account exists with this email, you will receive a password reset link.',
  )
})

/**
 * @desc    Verify reset token
 * @route   POST /api/auth/verify-reset-token
 * @access  Public
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { email, token } = req.body

  if (!email || !token) {
    throw new AppError('Email and token are required', 400)
  }

  // Verify reset token
  const verification = await PasswordReset.verifyResetToken(email, token)

  if (!verification.valid) {
    throw new AppError(verification.message, 400)
  }

  sendSuccessResponse(res, 200, 'Reset token is valid. You can now reset your password.', {
    email,
  })
})

/**
 * @desc    Reset password with valid token - Step 2
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, token, newPassword, confirmPassword } = req.body

  if (!email || !token || !newPassword || !confirmPassword) {
    throw new AppError('Email, token, and new password are required', 400)
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400)
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400)
  }

  // Verify reset token
  const verification = await PasswordReset.verifyResetToken(email, token)

  if (!verification.valid) {
    throw new AppError(verification.message, 400)
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Update attempts
  const resetRecord = verification.resetRecord
  resetRecord.attempts += 1
  await resetRecord.save()

  // Update password
  user.password = newPassword
  await user.save()

  // Mark reset token as used
  resetRecord.isUsed = true
  resetRecord.usedAt = new Date()
  await resetRecord.save()

  logger.info('User password reset successfully', { username: user.username, email: user.email })

  sendSuccessResponse(
    res,
    200,
    'Your password has been reset successfully. You can now login with your new password.',
  )
})
