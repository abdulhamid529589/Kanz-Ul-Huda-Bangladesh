import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'
import { MAIN_ADMIN_EMAIL } from '../constants.js'

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
  const { username, email, fullName, password, role = 'collector' } = req.body

  // Validate input
  if (!username || !email || !fullName || !password) {
    throw new AppError('Please provide username, email, fullName, and password', 400)
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
    fullName,
    password,
    role,
    status: 'active',
    createdBy: req.user._id,
  })

  const userResponse = user.toObject()
  delete userResponse.password
  delete userResponse.refreshToken

  logger.info('User created by admin', {
    adminId: req.user._id,
    newUserId: user._id,
    role,
  })

  sendSuccessResponse(res, 201, 'User created successfully', { user: userResponse })
})

/**
 * @desc    Update user (admin can update any user, collectors can update themselves)
 * @route   PUT /api/admin/users/:id
 * @access  Private
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, status } = req.body
  const userId = req.params.id

  // Check if user is updating their own profile or is admin
  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You can only update your own profile', 403)
  }

  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User not found', 404)
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
