import User from '../models/User.js'
import { generateToken } from '../middleware/auth.js'
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
  sendErrorResponse,
} from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Register new user (Dawah team member)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { username, password, fullName, email, registrationCode } = req.body

  // Validate registration code (security measure)
  const REGISTRATION_CODE = process.env.REGISTRATION_CODE || 'KANZULHUDA2026'

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

  // Check if this is the first user (make them admin)
  const userCount = await User.countDocuments()
  const role = userCount === 0 ? 'admin' : 'collector'

  // Create user
  const user = await User.create({
    username: username.toLowerCase(),
    password,
    fullName,
    email: email.toLowerCase(),
    role,
    status: 'active',
  })

  logger.info('New user registered', { username: user.username, role: user.role })

  // Generate token
  const token = generateToken(user._id)

  // Remove password from response
  const userResponse = user.toJSON()

  sendSuccessResponse(res, 201, `Registration successful! You are registered as ${role}.`, {
    token,
    user: userResponse,
  })
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
  await user.save()

  logger.info('User logged in', { username: user.username, userId: user._id })

  // Generate token
  const token = generateToken(user._id)

  // Remove password from response
  const userResponse = user.toJSON()

  sendSuccessResponse(res, 200, 'Login successful', {
    token,
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

  sendSuccessResponse(res, 200, 'Logout successful')
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
