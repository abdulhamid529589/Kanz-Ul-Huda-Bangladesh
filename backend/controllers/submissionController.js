import Submission from '../models/Submission.js'
import Member from '../models/Member.js'
import { getCurrentWeek, getWeekForDate, formatWeekDisplay } from '../utils/weekHelper.js'

/**
 * @desc    Create new submission
 * @route   POST /api/submissions
 * @access  Private
 */
export const createSubmission = async (req, res) => {
  try {
    const { memberId, duroodCount, weekStartDate, notes } = req.body

    // Validate
    if (!memberId || !duroodCount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide member and durood count',
      })
    }

    // Verify member exists
    const member = await Member.findById(memberId)
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      })
    }

    if (member.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create submission for inactive member',
      })
    }

    // Get week dates
    let week
    if (weekStartDate) {
      week = getWeekForDate(new Date(weekStartDate))
    } else {
      week = getCurrentWeek()
    }

    // Check if submission already exists for this member and week
    const existingSubmission = await Submission.findOne({
      member: memberId,
      weekStartDate: week.weekStartDate,
    })

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: `Member has already submitted for week ${formatWeekDisplay(
          week.weekStartDate,
          week.weekEndDate,
        )}`,
      })
    }

    // Create submission
    const submission = await Submission.create({
      member: memberId,
      weekStartDate: week.weekStartDate,
      weekEndDate: week.weekEndDate,
      duroodCount: parseInt(duroodCount),
      submittedBy: req.user.id,
      notes,
    })

    // Populate member info
    await submission.populate('member', 'fullName phoneNumber')
    await submission.populate('submittedBy', 'fullName')

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data: submission,
    })
  } catch (error) {
    console.error('Create submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Error creating submission',
      error: error.message,
    })
  }
}

/**
 * @desc    Get submissions with filters
 * @route   GET /api/submissions
 * @access  Private
 */
export const getSubmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit

    let query = {}

    // Filter by week
    if (req.query.weekStartDate) {
      const week = getWeekForDate(new Date(req.query.weekStartDate))
      query.weekStartDate = week.weekStartDate
      query.weekEndDate = week.weekEndDate
    }

    // Filter by member
    if (req.query.memberId) {
      query.member = req.query.memberId
    }

    // Filter by collector
    if (req.query.submittedBy) {
      query.submittedBy = req.query.submittedBy
    }

    const total = await Submission.countDocuments(query)

    const submissions = await Submission.find(query)
      .populate('member', 'fullName phoneNumber country')
      .populate('submittedBy', 'fullName username')
      .sort({ submissionDateTime: -1 })
      .limit(limit)
      .skip(skip)

    res.json({
      success: true,
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching submissions',
      error: error.message,
    })
  }
}

/**
 * @desc    Get current week submissions
 * @route   GET /api/submissions/current-week
 * @access  Private
 */
export const getCurrentWeekSubmissions = async (req, res) => {
  try {
    const { weekStartDate, weekEndDate } = getCurrentWeek()

    const submissions = await Submission.find({
      weekStartDate,
      weekEndDate,
    })
      .populate('member', 'fullName phoneNumber country city')
      .populate('submittedBy', 'fullName')
      .sort({ submissionDateTime: -1 })

    // Calculate total
    const total = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

    res.json({
      success: true,
      data: {
        week: {
          startDate: weekStartDate,
          endDate: weekEndDate,
          display: formatWeekDisplay(weekStartDate, weekEndDate),
        },
        submissions,
        total,
        count: submissions.length,
      },
    })
  } catch (error) {
    console.error('Get current week submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching current week submissions',
      error: error.message,
    })
  }
}

/**
 * @desc    Update submission
 * @route   PUT /api/submissions/:id
 * @access  Private
 */
export const updateSubmission = async (req, res) => {
  try {
    const { duroodCount, notes } = req.body

    let submission = await Submission.findById(req.params.id)

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      })
    }

    // Check permissions
    // Collectors can only edit their own submissions within 24 hours
    const isOwnSubmission = submission.submittedBy.toString() === req.user.id
    const isWithin24Hours = Date.now() - submission.submissionDateTime < 24 * 60 * 60 * 1000

    if (req.user.role !== 'admin' && (!isOwnSubmission || !isWithin24Hours)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own submissions within 24 hours',
      })
    }

    // Update
    submission.duroodCount = duroodCount || submission.duroodCount
    submission.notes = notes !== undefined ? notes : submission.notes
    submission.lastModifiedBy = req.user.id
    submission.lastModifiedAt = new Date()

    await submission.save()

    await submission.populate('member', 'fullName phoneNumber')
    await submission.populate('submittedBy', 'fullName')

    res.json({
      success: true,
      message: 'Submission updated successfully',
      data: submission,
    })
  } catch (error) {
    console.error('Update submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating submission',
      error: error.message,
    })
  }
}

/**
 * @desc    Delete submission
 * @route   DELETE /api/submissions/:id
 * @access  Private (Only submitter or admin)
 */
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      })
    }

    // Authorization check: only submitter or admin can delete
    const submitterId = submission.submittedBy?.toString()
    const currentUserId = req.user.id.toString()
    const isAdmin = req.user.role === 'admin'

    if (submitterId !== currentUserId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete submissions that you created',
      })
    }

    await submission.deleteOne()

    res.json({
      success: true,
      message: 'Submission deleted successfully',
    })
  } catch (error) {
    console.error('Delete submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting submission',
      error: error.message,
    })
  }
}

/**
 * @desc    Get pending members for current week
 * @route   GET /api/submissions/pending
 * @access  Private
 */
export const getPendingMembers = async (req, res) => {
  try {
    const { weekStartDate, weekEndDate } = getCurrentWeek()

    // Get all submitted member IDs for current week
    const submittedMemberIds = await Submission.distinct('member', {
      weekStartDate,
      weekEndDate,
    })

    // Get active members who haven't submitted
    const pendingMembers = await Member.find({
      _id: { $nin: submittedMemberIds },
      status: 'active',
    })
      .select('fullName phoneNumber country city lastSubmissionDate')
      .sort({ fullName: 1 })

    res.json({
      success: true,
      data: {
        week: {
          startDate: weekStartDate,
          endDate: weekEndDate,
          display: formatWeekDisplay(weekStartDate, weekEndDate),
        },
        pendingMembers,
        count: pendingMembers.length,
      },
    })
  } catch (error) {
    console.error('Get pending members error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching pending members',
      error: error.message,
    })
  }
}

/**
 * @desc    Get recent submissions (activity feed)
 * @route   GET /api/submissions/recent
 * @access  Private
 */
export const getRecentSubmissions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20

    const submissions = await Submission.find()
      .populate('member', 'fullName')
      .populate('submittedBy', 'fullName')
      .sort({ submissionDateTime: -1 })
      .limit(limit)

    res.json({
      success: true,
      data: submissions,
    })
  } catch (error) {
    console.error('Get recent submissions error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching recent submissions',
      error: error.message,
    })
  }
}
