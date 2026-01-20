import RegistrationRequest from '../models/RegistrationRequest.js'
import User from '../models/User.js'
import {
  asyncHandler,
  AppError,
  sendSuccessResponse,
  sendErrorResponse,
} from '../utils/errorHandler.js'
import logger from '../utils/logger.js'
import {
  sendRegistrationRequestConfirmationEmail,
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
} from '../utils/emailService.js'

/**
 * @desc    Submit a registration request
 * @route   POST /api/registration-requests/submit
 * @access  Public
 */
export const submitRegistrationRequest = asyncHandler(async (req, res) => {
  const { email, name } = req.body

  if (!email || !name) {
    throw new AppError('Email and name are required', 400)
  }

  // Check if email already has a registration request
  const existingRequest = await RegistrationRequest.findOne({ email: email.toLowerCase() })
  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      throw new AppError('A registration request with this email is already pending', 400)
    }
    if (existingRequest.status === 'approved') {
      throw new AppError(
        'This email has already been approved. You can now proceed with registration.',
        400,
      )
    }
  }

  // Check if email already exists in User collection
  const userExists = await User.findOne({ email: email.toLowerCase() })
  if (userExists) {
    throw new AppError('This email is already registered', 400)
  }

  // Create registration request
  const request = await RegistrationRequest.create({
    email: email.toLowerCase(),
    name,
  })

  // Send confirmation email to user
  try {
    logger.info('Attempting to send registration confirmation email', { email, name })
    await sendRegistrationRequestConfirmationEmail(email, name)
    logger.info('✅ Registration confirmation email sent successfully', { email })
  } catch (error) {
    logger.error('❌ Failed to send confirmation email to user', {
      email,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      stack: error.stack,
    })
    // Log email configuration for debugging
    logger.error('Email configuration:', {
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET',
      EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
      EMAIL_PORT: process.env.EMAIL_PORT || 587,
    })
    // Don't throw - let registration request succeed even if email fails
    // User will still see success message in UI
  }

  logger.info('Registration request submitted', { email, name })

  sendSuccessResponse(
    res,
    201,
    'Registration request submitted successfully. Please wait for admin approval.',
    {
      request: {
        _id: request._id,
        email: request.email,
        name: request.name,
        status: request.status,
        createdAt: request.createdAt,
      },
    },
  )
})

/**
 * @desc    Get all registration requests (Admin only)
 * @route   GET /api/registration-requests
 * @access  Private (Admin)
 */
export const getRegistrationRequests = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query

  // Build filter
  const filter = {}
  if (status) {
    filter.status = status
  }
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ]
  }

  // Get total count
  const total = await RegistrationRequest.countDocuments(filter)

  // Get requests with pagination
  const requests = await RegistrationRequest.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('approvedBy', 'username email fullName')
    .exec()

  sendSuccessResponse(res, 200, 'Registration requests retrieved successfully', {
    requests,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      limit,
    },
  })
})

/**
 * @desc    Get a specific registration request
 * @route   GET /api/registration-requests/:id
 * @access  Private (Admin)
 */
export const getRegistrationRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const request = await RegistrationRequest.findById(id).populate(
    'approvedBy',
    'username email fullName',
  )

  if (!request) {
    throw new AppError('Registration request not found', 404)
  }

  sendSuccessResponse(res, 200, 'Registration request retrieved successfully', { request })
})

/**
 * @desc    Approve a registration request
 * @route   PUT /api/registration-requests/:id/approve
 * @access  Private (Admin)
 */
export const approveRegistrationRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  const adminId = req.user._id

  const request = await RegistrationRequest.findById(id)

  if (!request) {
    throw new AppError('Registration request not found', 404)
  }

  if (request.status !== 'pending') {
    throw new AppError(`Cannot approve a ${request.status} request`, 400)
  }

  // Update request
  request.status = 'approved'
  request.approvedAt = new Date()
  request.approvedBy = adminId
  await request.save()

  // Send approval email to user
  try {
    await sendRegistrationApprovedEmail(request.email, request.name)
  } catch (error) {
    logger.warn('Failed to send approval email', { email: request.email, error: error.message })
  }

  logger.info('Registration request approved', {
    requestId: request._id,
    email: request.email,
    approvedBy: adminId,
  })

  sendSuccessResponse(res, 200, 'Registration request approved successfully', {
    request: request.toObject(),
  })
})

/**
 * @desc    Reject a registration request
 * @route   PUT /api/registration-requests/:id/reject
 * @access  Private (Admin)
 */
export const rejectRegistrationRequest = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { rejectionReason } = req.body
  const adminId = req.user._id

  if (!rejectionReason) {
    throw new AppError('Rejection reason is required', 400)
  }

  const request = await RegistrationRequest.findById(id)

  if (!request) {
    throw new AppError('Registration request not found', 404)
  }

  if (request.status !== 'pending') {
    throw new AppError(`Cannot reject a ${request.status} request`, 400)
  }

  // Update request
  request.status = 'rejected'
  request.rejectionReason = rejectionReason
  request.rejectedAt = new Date()
  request.approvedBy = adminId
  await request.save()

  // Send rejection email to user
  try {
    await sendRegistrationRejectedEmail(request.email, request.name, rejectionReason)
  } catch (error) {
    logger.warn('Failed to send rejection email', { email: request.email, error: error.message })
  }

  logger.info('Registration request rejected', {
    requestId: request._id,
    email: request.email,
    reason: rejectionReason,
    rejectedBy: adminId,
  })

  sendSuccessResponse(res, 200, 'Registration request rejected successfully', {
    request: request.toObject(),
  })
})

/**
 * @desc    Check if email has an approved registration request
 * @route   GET /api/registration-requests/check/:email
 * @access  Public
 */
export const checkEmailApproved = asyncHandler(async (req, res) => {
  const { email } = req.params

  const request = await RegistrationRequest.findOne({ email: email.toLowerCase() })

  if (!request) {
    return sendSuccessResponse(res, 200, 'Email not found in requests', {
      approved: false,
      status: null,
    })
  }

  sendSuccessResponse(res, 200, 'Email status retrieved', {
    approved: request.status === 'approved',
    status: request.status,
  })
})

/**
 * @desc    Get statistics about registration requests
 * @route   GET /api/registration-requests/stats/summary
 * @access  Private (Admin)
 */
export const getRegistrationRequestStats = asyncHandler(async (req, res) => {
  const stats = await RegistrationRequest.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  const total = await RegistrationRequest.countDocuments()

  const formattedStats = {
    total,
    pending: 0,
    approved: 0,
    rejected: 0,
  }

  stats.forEach((stat) => {
    if (stat._id) {
      formattedStats[stat._id] = stat.count
    }
  })

  sendSuccessResponse(res, 200, 'Registration request statistics retrieved', {
    stats: formattedStats,
  })
})
