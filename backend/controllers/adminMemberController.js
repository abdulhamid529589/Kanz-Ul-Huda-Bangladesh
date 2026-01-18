import Member from '../models/Member.js'
import Submission from '../models/Submission.js'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Get all members (admin only)
 * @route   GET /api/admin/members
 * @access  Private/Admin
 */
export const getAllMembers = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20, createdBy } = req.query

  let query = {}

  if (status) query.status = status
  if (createdBy) query.createdBy = createdBy

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
    ]
  }

  const skip = (page - 1) * limit
  const members = await Member.find(query)
    .populate('createdBy', 'fullName email username')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean()

  const total = await Member.countDocuments(query)

  // Calculate stats for each member
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const submissions = await Submission.countDocuments({ member: member._id })
      const totalDurood = await Submission.aggregate([
        { $match: { member: member._id } },
        { $group: { _id: null, total: { $sum: '$duroodCount' } } },
      ])

      return {
        ...member,
        submissionCount: submissions,
        totalDurood: totalDurood[0]?.total || 0,
      }
    }),
  )

  sendSuccessResponse(res, 200, 'Members retrieved successfully', {
    members: membersWithStats,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  })
})

/**
 * @desc    Get single member details (admin only)
 * @route   GET /api/admin/members/:id
 * @access  Private/Admin
 */
export const getMemberById = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id)
    .populate('createdBy', 'fullName email username')
    .lean()

  if (!member) {
    throw new AppError('Member not found', 404)
  }

  // Get member statistics
  const submissions = await Submission.find({ member: req.params.id })
    .sort({ createdAt: -1 })
    .lean()

  const totalDurood = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

  sendSuccessResponse(res, 200, 'Member retrieved successfully', {
    member: {
      ...member,
      submissionCount: submissions.length,
      totalDurood,
      recentSubmissions: submissions.slice(0, 5),
    },
  })
})

/**
 * @desc    Create member as admin
 * @route   POST /api/admin/members
 * @access  Private/Admin
 */
export const createMember = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, country, address } = req.body

  if (!fullName || !email || !phoneNumber) {
    throw new AppError('Please provide fullName, email, and phoneNumber', 400)
  }

  // Check if email already exists
  if (await Member.findOne({ email: email.toLowerCase() })) {
    throw new AppError('Email already exists', 400)
  }

  const member = await Member.create({
    fullName,
    email: email.toLowerCase(),
    phoneNumber,
    country,
    address,
    status: 'active',
    createdBy: req.user._id,
  })

  const memberResponse = await member.populate('createdBy', 'fullName email username')

  logger.info('Member created by admin', {
    adminId: req.user._id,
    memberId: member._id,
  })

  sendSuccessResponse(res, 201, 'Member created successfully', { member: memberResponse })
})

/**
 * @desc    Update member (admin only)
 * @route   PUT /api/admin/members/:id
 * @access  Private/Admin
 */
export const updateMember = asyncHandler(async (req, res) => {
  const { fullName, email, phoneNumber, country, address, status } = req.body

  const member = await Member.findById(req.params.id)

  if (!member) {
    throw new AppError('Member not found', 404)
  }

  if (fullName) member.fullName = fullName
  if (phoneNumber) member.phoneNumber = phoneNumber
  if (country) member.country = country
  if (address) member.address = address

  if (email && email !== member.email) {
    if (await Member.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } })) {
      throw new AppError('Email already in use', 400)
    }
    member.email = email.toLowerCase()
  }

  if (status && ['active', 'inactive'].includes(status)) {
    member.status = status
  }

  await member.save()
  const updatedMember = await member.populate('createdBy', 'fullName email username')

  logger.info('Member updated', {
    updatedBy: req.user._id,
    memberId: req.params.id,
  })

  sendSuccessResponse(res, 200, 'Member updated successfully', { member: updatedMember })
})

/**
 * @desc    Delete member (admin only)
 * @route   DELETE /api/admin/members/:id
 * @access  Private/Admin
 */
export const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id)

  if (!member) {
    throw new AppError('Member not found', 404)
  }

  // Delete all submissions for this member
  await Submission.deleteMany({ member: req.params.id })

  await Member.findByIdAndDelete(req.params.id)

  logger.info('Member deleted', {
    deletedBy: req.user._id,
    memberId: req.params.id,
  })

  sendSuccessResponse(res, 200, 'Member deleted successfully', {})
})

/**
 * @desc    Bulk import members from array (admin only)
 * @route   POST /api/admin/members/bulk-import
 * @access  Private/Admin
 */
export const bulkImportMembers = asyncHandler(async (req, res) => {
  const { members: membersData } = req.body

  if (!Array.isArray(membersData) || membersData.length === 0) {
    throw new AppError('Please provide an array of members to import', 400)
  }

  if (membersData.length > 1000) {
    throw new AppError('Cannot import more than 1000 members at once', 400)
  }

  const results = {
    imported: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < membersData.length; i++) {
    try {
      const { fullName, email, phoneNumber, country, address } = membersData[i]

      if (!fullName || !email || !phoneNumber) {
        throw new Error('Missing required fields: fullName, email, phoneNumber')
      }

      // Check if member already exists
      const existingMember = await Member.findOne({ email: email.toLowerCase() })

      if (existingMember) {
        results.failed += 1
        results.errors.push({
          row: i + 1,
          email,
          error: 'Member with this email already exists',
        })
        continue
      }

      await Member.create({
        fullName,
        email: email.toLowerCase(),
        phoneNumber,
        country,
        address,
        status: 'active',
        createdBy: req.user._id,
      })

      results.imported += 1
    } catch (error) {
      results.failed += 1
      results.errors.push({
        row: i + 1,
        error: error.message,
      })
    }
  }

  logger.info('Members bulk imported', {
    adminId: req.user._id,
    imported: results.imported,
    failed: results.failed,
  })

  sendSuccessResponse(res, 201, 'Members imported', { results })
})

/**
 * @desc    Deactivate member (admin only)
 * @route   PUT /api/admin/members/:id/deactivate
 * @access  Private/Admin
 */
export const deactivateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id)

  if (!member) {
    throw new AppError('Member not found', 404)
  }

  if (member.status === 'inactive') {
    throw new AppError('Member is already inactive', 400)
  }

  member.status = 'inactive'
  await member.save()

  const updatedMember = await member.populate('createdBy', 'fullName email username')

  logger.info('Member deactivated', {
    deactivatedBy: req.user._id,
    memberId: req.params.id,
  })

  sendSuccessResponse(res, 200, 'Member deactivated successfully', { member: updatedMember })
})

/**
 * @desc    Reactivate member (admin only)
 * @route   PUT /api/admin/members/:id/reactivate
 * @access  Private/Admin
 */
export const reactivateMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id)

  if (!member) {
    throw new AppError('Member not found', 404)
  }

  if (member.status === 'active') {
    throw new AppError('Member is already active', 400)
  }

  member.status = 'active'
  await member.save()

  const updatedMember = await member.populate('createdBy', 'fullName email username')

  logger.info('Member reactivated', {
    reactivatedBy: req.user._id,
    memberId: req.params.id,
  })

  sendSuccessResponse(res, 200, 'Member reactivated successfully', { member: updatedMember })
})

/**
 * @desc    Get member statistics (admin only)
 * @route   GET /api/admin/members/stats/overview
 * @access  Private/Admin
 */
export const getMemberStats = asyncHandler(async (req, res) => {
  const totalMembers = await Member.countDocuments()
  const activeMembers = await Member.countDocuments({ status: 'active' })
  const inactiveMembers = await Member.countDocuments({ status: 'inactive' })

  // Top 5 members by durood count
  const topMembers = await Submission.aggregate([
    {
      $group: {
        _id: '$member',
        totalDurood: { $sum: '$duroodCount' },
        submissionCount: { $sum: 1 },
      },
    },
    { $sort: { totalDurood: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'members',
        localField: '_id',
        foreignField: '_id',
        as: 'member',
      },
    },
  ])

  sendSuccessResponse(res, 200, 'Member statistics retrieved successfully', {
    stats: {
      total: totalMembers,
      active: activeMembers,
      inactive: inactiveMembers,
      topMembers,
    },
  })
})
