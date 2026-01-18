import Member from '../models/Member.js'
import Submission from '../models/Submission.js'
import { getCurrentWeek } from '../utils/weekHelper.js'

/**
 * @desc    Get all members with filters and pagination
 * @route   GET /api/members
 * @access  Private
 */
export const getAllMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    // Build query
    let query = {}

    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status
    }

    // Filter by category
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category
    }

    // Filter by country
    if (req.query.country) {
      query.country = req.query.country
    }

    // Filter by city
    if (req.query.city) {
      query.city = req.query.city
    }

    // Filter by createdBy (creator)
    if (req.query.createdBy) {
      query.createdBy = req.query.createdBy
    }

    // Date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      query.memberSince = {}
      if (req.query.dateFrom) {
        query.memberSince.$gte = new Date(req.query.dateFrom)
      }
      if (req.query.dateTo) {
        query.memberSince.$lte = new Date(req.query.dateTo)
      }
    }

    // Search by name or phone
    if (req.query.search) {
      query.$or = [
        { fullName: { $regex: req.query.search, $options: 'i' } },
        { phoneNumber: { $regex: req.query.search, $options: 'i' } },
      ]
    }

    // Filter by submission status for current week
    if (req.query.submissionStatus) {
      const { weekStartDate, weekEndDate } = getCurrentWeek()
      const submittedMembers = await Submission.distinct('member', {
        weekStartDate,
        weekEndDate,
      })

      if (req.query.submissionStatus === 'submitted') {
        query._id = { $in: submittedMembers }
      } else if (req.query.submissionStatus === 'pending') {
        query._id = { $nin: submittedMembers }
        query.status = 'active' // Only active members can be pending
      }
    }

    // Get total count
    const total = await Member.countDocuments(query)

    // Get members
    const members = await Member.find(query)
      .populate('createdBy', 'fullName username')
      .sort({ fullName: 1 })
      .limit(limit)
      .skip(skip)

    res.json({
      success: true,
      data: members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get members error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: error.message,
    })
  }
}

/**
 * @desc    Get single member by ID
 * @route   GET /api/members/:id
 * @access  Private
 */
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id).populate('createdBy', 'fullName username')

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    // Get submission history
    const submissions = await Submission.find({ member: member._id })
      .populate('submittedBy', 'fullName')
      .sort({ weekStartDate: -1 })
      .limit(10)

    res.json({
      success: true,
      data: {
        member,
        recentSubmissions: submissions,
      },
    })
  } catch (error) {
    console.error('Get member error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching member',
      error: error.message,
    })
  }
}

/**
 * @desc    Create new member
 * @route   POST /api/members
 * @access  Private
 */
export const createMember = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, country, city, status, category, notes } = req.body

    // Validate required fields
    if (!fullName || !phoneNumber || !country) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, phone number, and country',
      })
    }

    // Check if phone number already exists
    const existingMember = await Member.findOne({ phoneNumber })
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'A member with this phone number already exists',
      })
    }

    // Create member
    const member = await Member.create({
      fullName,
      phoneNumber,
      email,
      country,
      city,
      status: status || 'active',
      category: category || 'Regular',
      notes,
      createdBy: req.user.id,
    })

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: member,
    })
  } catch (error) {
    console.error('Create member error:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating member',
      error: error.message,
    })
  }
}

/**
 * @desc    Update member
 * @route   PUT /api/members/:id
 * @access  Private (Only creator or admin)
 */
export const updateMember = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, country, city, status, category, notes } = req.body

    let member = await Member.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    // Authorization check: only creator or admin can update
    const creatorId = member.createdBy?.toString()
    const currentUserId = req.user.id.toString()
    const isAdmin = req.user.role === 'admin'

    if (creatorId !== currentUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only update members that you created',
      })
    }

    // If phone number is being changed, check for duplicates
    if (phoneNumber && phoneNumber !== member.phoneNumber) {
      const existingMember = await Member.findOne({ phoneNumber })
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'A member with this phone number already exists',
        })
      }
    }

    // Update fields
    member.fullName = fullName || member.fullName
    member.phoneNumber = phoneNumber || member.phoneNumber
    member.email = email !== undefined ? email : member.email
    member.country = country || member.country
    member.city = city !== undefined ? city : member.city
    member.status = status || member.status
    member.category = category || member.category
    member.notes = notes !== undefined ? notes : member.notes

    await member.save()

    res.json({
      success: true,
      message: 'Member updated successfully',
      data: member,
    })
  } catch (error) {
    console.error('Update member error:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating member',
      error: error.message,
    })
  }
}

/**
 * @desc    Delete member (soft delete)
 * @route   DELETE /api/members/:id
 * @access  Private (Only creator or admin)
 */
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    // Authorization check: only creator or admin can delete
    const creatorId = member.createdBy?.toString()
    const currentUserId = req.user.id.toString()
    const isAdmin = req.user.role === 'admin'

    if (creatorId !== currentUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete members that you created',
      })
    }

    // Check if member has submissions
    const hasSubmissions = await Submission.exists({ member: member._id })

    if (hasSubmissions) {
      // Soft delete - mark as inactive
      member.status = 'inactive'
      await member.save()

      return res.json({
        success: true,
        message: 'Member marked as inactive (has submission history)',
      })
    }

    // Hard delete if no submissions
    await member.deleteOne()

    res.json({
      success: true,
      message: 'Member deleted successfully',
    })
  } catch (error) {
    console.error('Delete member error:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting member',
      error: error.message,
    })
  }
}

/**
 * @desc    Search members by name or phone
 * @route   GET /api/members/search
 * @access  Private
 */
export const searchMembers = async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      })
    }

    const members = await Member.find({
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { phoneNumber: { $regex: q, $options: 'i' } },
      ],
      status: 'active',
    })
      .select('fullName phoneNumber country city')
      .limit(20)
      .sort({ fullName: 1 })

    res.json({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('Search members error:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching members',
      error: error.message,
    })
  }
}

/**
 * @desc    Get member statistics
 * @route   GET /api/members/stats/overview
 * @access  Private
 */
export const getMemberStats = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments()
    const activeMembers = await Member.countDocuments({ status: 'active' })
    const inactiveMembers = await Member.countDocuments({ status: 'inactive' })

    // Get countries distribution
    const countriesDistribution = await Member.aggregate([
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        inactiveMembers,
        countriesDistribution,
      },
    })
  } catch (error) {
    console.error('Get member stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching member statistics',
      error: error.message,
    })
  }
}
