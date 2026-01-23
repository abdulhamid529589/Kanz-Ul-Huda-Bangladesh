import User from '../models/User.js'
import AdminUserEmailVerification from '../models/AdminUserEmailVerification.js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'
import { MAIN_ADMIN_EMAIL } from '../constants.js'
import { sendAdminCreatedUserVerificationEmail } from '../utils/emailService.js'

/**
 * @desc    Get all users (admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  let { role, status, search, page = 1, limit = 20 } = req.query

  // Clean up undefined string values
  role = role && role !== 'undefined' ? role : undefined
  status = status && status !== 'undefined' ? status : undefined
  search = search && search !== 'undefined' ? search : undefined

  let query = {}

  if (role) query.role = role
  if (status) query.status = status

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit
  const users = await User.find(query)
    .select('-password -refreshToken')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean()

  const total = await User.countDocuments(query)

  sendSuccessResponse(res, 200, 'Users retrieved successfully', {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  })
})

/**
 * @desc    Get single user details (admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshToken')
    .populate('createdBy', 'fullName email username')

  if (!user) {
    throw new AppError('User not found', 404)
  }

  sendSuccessResponse(res, 200, 'User retrieved successfully', { user })
})

/**
 * @desc    Create new user as admin (admin can create collectors/other admins)
 * @route   POST /api/admin/users
 * @access  Private/Admin
 */
export const createUserAsAdmin = asyncHandler(async (req, res) => {
  const { username, email, fullName, password, phone, role = 'collector' } = req.body

  // Validate input
  if (!username || !email || !fullName || !password) {
    throw new AppError('Please provide username, email, fullName, and password', 400)
  }

  // Validate username format (3-20 chars, alphanumeric + underscore)
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    throw new AppError('Username must be 3-20 characters, alphanumeric and underscores only', 400)
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please provide a valid email address', 400)
  }

  // Validate password length
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }

  // Validate full name
  if (fullName.trim().length < 2) {
    throw new AppError('Full name must be at least 2 characters', 400)
  }

  // Validate phone format if provided
  if (phone && !/^[\d\s\-\+\(\)]*$/.test(phone)) {
    throw new AppError('Please enter a valid phone number', 400)
  }

  // Check if username exists
  if (await User.findOne({ username: username.toLowerCase() })) {
    throw new AppError('Username already exists', 400)
  }

  // Check if email exists
  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new AppError('Email already exists', 400)
  }

  // Validate role
  if (!['admin', 'collector'].includes(role)) {
    throw new AppError('Invalid role. Must be admin or collector', 400)
  }

  // Create user (password will be hashed by User model pre-save hook)
  const user = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    fullName: fullName.trim(),
    password,
    phone: phone || null,
    role,
    status: 'active',
    createdBy: req.user._id,
    createdByAdmin: true,
    emailVerified: false,
  })

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')

  // Create email verification record
  const verificationRecord = await AdminUserEmailVerification.create({
    userId: user._id,
    email: email.toLowerCase(),
    verificationToken,
    createdBy: req.user._id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  })

  // Send verification email
  try {
    await sendAdminCreatedUserVerificationEmail(email, fullName, verificationToken)
  } catch (error) {
    // Delete user and verification if email fails
    await User.deleteOne({ _id: user._id })
    await AdminUserEmailVerification.deleteOne({ _id: verificationRecord._id })
    logger.error('Failed to send verification email for admin-created user', {
      email,
      error: error.message,
    })
    throw new AppError('Failed to send verification email. User creation cancelled.', 500)
  }

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken
  delete userResponse.emailVerificationToken

  logger.info('User created by admin with email verification required', {
    adminId: req.user._id,
    newUserId: user._id,
    role,
    email: user.email,
  })

  sendSuccessResponse(res, 201, 'User created successfully. Verification email sent.', {
    user: userResponse,
    message: 'User must verify their email within 7 days to activate their account',
  })
})

/**
 * @desc    Update user (admin can update any user, collectors can update themselves)
 * @route   PUT /api/admin/users/:id
 * @access  Private
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, status, registrationCodeVersion } = req.body
  const userId = req.params.id

  // Check if user is updating their own profile or is admin
  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You can only update your own profile', 403)
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check if trying to modify registrationCodeVersion without main admin access
  if (registrationCodeVersion !== undefined && !req.user.isMainAdmin) {
    throw new AppError('Only the main admin can modify registration code version', 403)
  }

  // Update allowed fields
  if (fullName) user.fullName = fullName
  if (email && email !== user.email) {
    // Check if email is already in use
    if (await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } })) {
      throw new AppError('Email already in use', 400)
    }
    user.email = email.toLowerCase()
  }

  if (password) {
    // Validate password strength
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400)
    }
    user.password = password // Will be hashed by User model pre-save hook
  }

  // Only admin can change role and status
  if (req.user.role === 'admin') {
    // Only main admin can change roles
    if (!req.user.isMainAdmin) {
      throw new AppError('Only the main admin can change user roles', 403)
    }

    // Cannot change main admin's role
    if (user.isMainAdmin && role && role !== user.role) {
      throw new AppError('Cannot change the main admin role', 403)
    }

    if (role && ['admin', 'collector'].includes(role)) {
      user.role = role
    }
    if (status && ['active', 'inactive'].includes(status)) {
      user.status = status
    }

    // Only main admin can modify registration code version
    if (registrationCodeVersion !== undefined && typeof registrationCodeVersion === 'number') {
      user.registrationCodeVersion = registrationCodeVersion
    }
  }

  await user.save()

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User updated', {
    updatedBy: req.user._id,
    userId,
  })

  sendSuccessResponse(res, 200, 'User updated successfully', { user: userResponse })
})

/**
 * @desc    Promote collector to admin (admin only)
 * @route   PUT /api/admin/users/:id/promote-to-admin
 * @access  Private/Admin
 */
export const promoteToAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.role === 'admin') {
    throw new AppError('User is already an admin', 400)
  }

  user.role = 'admin'
  await user.save()

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User promoted to admin', {
    promotedBy: req.user._id,
    userId: user._id,
  })

  sendSuccessResponse(res, 200, 'User promoted to admin successfully', {
    user: userResponse,
  })
})

/**
 * @desc    Demote admin to collector (admin only)
 * @route   PUT /api/admin/users/:id/demote-to-collector
 * @access  Private/Admin
 */
export const demoteToCollector = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Prevent demoting the original admin
  if (user.role === 'collector') {
    throw new AppError('User is already a collector', 400)
  }

  // Check if this is the only admin
  const adminCount = await User.countDocuments({ role: 'admin' })
  if (adminCount === 1) {
    throw new AppError('Cannot demote the last admin user', 400)
  }

  user.role = 'collector'
  await user.save()

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User demoted to collector', {
    demotedBy: req.user._id,
    userId: user._id,
  })

  sendSuccessResponse(res, 200, 'User demoted to collector successfully', {
    user: userResponse,
  })
})

/**
 * @desc    Delete user (admin only)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Prevent deleting the only admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount === 1) {
      throw new AppError('Cannot delete the last admin user', 400)
    }
  }

  await User.findByIdAndDelete(req.params.id)

  logger.info('User deleted', {
    deletedBy: req.user._id,
    userId: req.params.id,
  })

  sendSuccessResponse(res, 200, 'User deleted successfully', {})
})

/**
 * @desc    Get user activity logs (admin only)
 * @route   GET /api/admin/users/:id/activity-logs
 * @access  Private/Admin
 */
export const getUserActivityLogs = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  const activityData = {
    userId: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    totalLogins: 0, // Can be tracked in a separate LoginLog model if needed
  }

  sendSuccessResponse(res, 200, 'User activity logs retrieved successfully', activityData)
})

/**
 * @desc    Deactivate user (admin only)
 * @route   PUT /api/admin/users/:id/deactivate
 * @access  Private/Admin
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.status === 'inactive') {
    throw new AppError('User is already inactive', 400)
  }

  user.status = 'inactive'
  await user.save()

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User deactivated', {
    deactivatedBy: req.user._id,
    userId: user._id,
  })

  sendSuccessResponse(res, 200, 'User deactivated successfully', { user: userResponse })
})

/**
 * @desc    Reactivate user (admin only)
 * @route   PUT /api/admin/users/:id/reactivate
 * @access  Private/Admin
 */
export const reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.status === 'active') {
    throw new AppError('User is already active', 400)
  }

  user.status = 'active'
  await user.save()

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User reactivated', {
    reactivatedBy: req.user._id,
    userId: user._id,
  })

  sendSuccessResponse(res, 200, 'User reactivated successfully', { user: userResponse })
})

/**
 * @desc    Get user statistics (admin only)
 * @route   GET /api/admin/users/stats/overview
 * @access  Private/Admin
 */
export const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments()
  const totalAdmins = await User.countDocuments({ role: 'admin' })
  const totalCollectors = await User.countDocuments({ role: 'collector' })
  const activeUsers = await User.countDocuments({ status: 'active' })
  const inactiveUsers = await User.countDocuments({ status: 'inactive' })

  sendSuccessResponse(res, 200, 'User statistics retrieved successfully', {
    stats: {
      total: totalUsers,
      admins: totalAdmins,
      collectors: totalCollectors,
      active: activeUsers,
      inactive: inactiveUsers,
    },
  })
})

/**
 * @desc    Verify email for admin-created users
 * @route   POST /api/admin/users/verify-email/:token
 * @access  Public (token-based)
 */
export const verifyAdminCreatedUserEmail = asyncHandler(async (req, res) => {
  const { token } = req.params

  if (!token) {
    throw new AppError('Verification token is required', 400)
  }

  // Find verification record
  const verification = await AdminUserEmailVerification.findOne({
    verificationToken: token,
  })

  if (!verification) {
    throw new AppError('Invalid or expired verification token', 400)
  }

  // Check if already verified
  if (verification.isVerified) {
    throw new AppError('Email already verified', 400)
  }

  // Check if expired
  if (new Date() > verification.expiresAt) {
    throw new AppError('Verification token has expired. Please request a new one.', 400)
  }

  // Update user email verified status
  const user = await User.findByIdAndUpdate(
    verification.userId,
    { emailVerified: true, emailVerificationToken: null },
    { new: true },
  )

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Mark verification as complete
  verification.isVerified = true
  verification.verifiedAt = new Date()
  await verification.save()

  logger.info('Email verified for admin-created user', {
    userId: user._id,
    email: user.email,
  })

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken
  delete userResponse.emailVerificationToken

  sendSuccessResponse(res, 200, 'Email verified successfully. Account is now active.', {
    user: userResponse,
  })
})

/**
 * @desc    Resend verification email for admin-created users
 * @route   POST /api/admin/users/resend-verification-email
 * @access  Public
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    throw new AppError('Email is required', 400)
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  // Check if already verified
  if (user.emailVerified) {
    throw new AppError('Email already verified', 400)
  }

  // Check if user was created by admin
  if (!user.createdByAdmin) {
    throw new AppError('This user does not require email verification', 400)
  }

  // Find existing verification record
  let verification = await AdminUserEmailVerification.findOne({ userId: user._id })

  if (!verification) {
    throw new AppError('Verification record not found', 404)
  }

  // Check attempt limit
  if (verification.attempts >= 5) {
    throw new AppError('Maximum resend attempts exceeded. Please contact administrator.', 429)
  }

  // Generate new token
  const newToken = crypto.randomBytes(32).toString('hex')
  verification.verificationToken = newToken
  verification.attempts += 1
  verification.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Reset expiry
  await verification.save()

  // Send email
  try {
    await sendAdminCreatedUserVerificationEmail(user.email, user.fullName, newToken)
  } catch (error) {
    logger.error('Failed to send verification email', {
      email: user.email,
      error: error.message,
    })
    throw new AppError('Failed to send verification email. Please try again.', 500)
  }

  logger.info('Verification email resent', {
    userId: user._id,
    email: user.email,
    attempt: verification.attempts,
  })

  sendSuccessResponse(res, 200, 'Verification email resent successfully', {
    message: 'Check your email for the verification link',
  })
})
