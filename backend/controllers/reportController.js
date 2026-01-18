import Submission from '../models/Submission.js'
import Member from '../models/Member.js'
import User from '../models/User.js'
import moment from 'moment'
import { getCurrentWeek, getPreviousWeek } from '../utils/weekHelper.js'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Get all submissions with filters
 * @route   GET /api/reports/submissions
 * @access  Private
 */
export const getSubmissions = asyncHandler(async (req, res) => {
  const { startDate, endDate, memberId, limit = 500, skip = 0 } = req.query

  let query = {}

  if (startDate && endDate) {
    query.weekStartDate = { $gte: new Date(startDate) }
    query.weekEndDate = { $lte: new Date(endDate) }
  }

  if (memberId) {
    query.member = memberId
  }

  const submissions = await Submission.find(query)
    .populate('member', 'fullName email phoneNumber country')
    .sort({ weekEndDate: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))

  const total = await Submission.countDocuments(query)

  sendSuccessResponse(res, 200, 'Submissions retrieved successfully', {
    submissions,
    total,
    page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
  })
})

/**
 * @desc    Get member statistics and rankings
 * @route   GET /api/reports/member-stats
 * @access  Private
 */
export const getMemberStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query

  let query = {}

  if (startDate && endDate) {
    query.weekStartDate = { $gte: new Date(startDate) }
    query.weekEndDate = { $lte: new Date(endDate) }
  }

  // Get all submissions for the period
  const submissions = await Submission.find(query).populate('member')

  // Calculate member statistics
  const memberStats = {}

  submissions.forEach((sub) => {
    const memberId = sub.member?._id?.toString()
    if (!memberId) return

    if (!memberStats[memberId]) {
      memberStats[memberId] = {
        memberId: sub.member._id,
        name: sub.member.fullName,
        email: sub.member.email,
        phoneNumber: sub.member.phoneNumber || 'N/A',
        country: sub.member.country || 'N/A',
        totalDurood: 0,
        submissionCount: 0,
        submissions: [],
      }
    }

    memberStats[memberId].totalDurood += sub.duroodCount
    memberStats[memberId].submissionCount += 1
    memberStats[memberId].submissions.push({
      duroodCount: sub.duroodCount,
      weekStart: sub.weekStartDate,
      weekEnd: sub.weekEndDate,
      notes: sub.notes,
    })
  })

  // Convert to array and sort by total durood (descending)
  const statsArray = Object.values(memberStats).sort((a, b) => b.totalDurood - a.totalDurood)

  // Add ranking
  const rankedStats = statsArray.map((stat, index) => ({
    ...stat,
    rank: index + 1,
  }))

  sendSuccessResponse(res, 200, 'Member statistics retrieved successfully', {
    stats: rankedStats,
    total: rankedStats.length,
  })
})

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/reports/overview
 * @access  Private
 */
export const getOverviewStats = asyncHandler(async (req, res) => {
  const currentWeek = getCurrentWeek()
  const previousWeek = getPreviousWeek()

  // Current week data
  const currentWeekSubmissions = await Submission.find({
    weekStartDate: currentWeek.weekStartDate,
    weekEndDate: currentWeek.weekEndDate,
  })

  const currentWeekTotal = currentWeekSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
  const currentWeekCount = currentWeekSubmissions.length

  // Previous week data
  const previousWeekSubmissions = await Submission.find({
    weekStartDate: previousWeek.weekStartDate,
    weekEndDate: previousWeek.weekEndDate,
  })

  const previousWeekTotal = previousWeekSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

  // Total members
  const totalActiveMembers = await Member.countDocuments({ status: 'active' })

  // Pending members (haven't submitted this week)
  const submittedMemberIds = await Submission.distinct('member', {
    weekStartDate: currentWeek.weekStartDate,
    weekEndDate: currentWeek.weekEndDate,
  })

  const pendingCount = totalActiveMembers - currentWeekCount

  // Progress percentage
  const progressPercentage =
    totalActiveMembers > 0 ? ((currentWeekCount / totalActiveMembers) * 100).toFixed(1) : 0

  // Month statistics
  const monthStart = moment().startOf('month').toDate()
  const monthEnd = moment().endOf('month').toDate()

  const monthSubmissions = await Submission.find({
    weekStartDate: { $gte: monthStart },
    weekEndDate: { $lte: monthEnd },
  })

  const monthTotal = monthSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

  // Growth calculation
  const growth =
    previousWeekTotal > 0
      ? (((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100).toFixed(1)
      : 0

  sendSuccessResponse(res, 200, 'Overview statistics retrieved successfully', {
    currentWeek: {
      total: currentWeekTotal,
      submissions: currentWeekCount,
      startDate: currentWeek.weekStartDate,
      endDate: currentWeek.weekEndDate,
    },
    previousWeek: {
      total: previousWeekTotal,
      submissions: previousWeekSubmissions.length,
    },
    month: {
      total: monthTotal,
      submissions: monthSubmissions.length,
    },
    members: {
      total: totalActiveMembers,
      submitted: currentWeekCount,
      pending: pendingCount,
      progressPercentage,
    },
    growth: parseFloat(growth),
  })
})

/**
 * @desc    Export report data
 * @route   GET /api/reports/export
 * @access  Private
 */
export const exportReport = asyncHandler(async (req, res) => {
  const { format = 'json', startDate, endDate } = req.query

  let query = {}

  if (startDate && endDate) {
    query.weekStartDate = { $gte: new Date(startDate) }
    query.weekEndDate = { $lte: new Date(endDate) }
  }

  const submissions = await Submission.find(query).populate('member')

  const exportData = submissions.map((sub) => ({
    memberName: sub.member?.fullName || 'N/A',
    email: sub.member?.email || 'N/A',
    phoneNumber: sub.member?.phoneNumber || 'N/A',
    country: sub.member?.country || 'N/A',
    duroodCount: sub.duroodCount,
    weekStart: sub.weekStartDate,
    weekEnd: sub.weekEndDate,
    notes: sub.notes || '',
    submittedAt: sub.createdAt,
  }))

  if (format === 'csv') {
    // CSV format
    const headers = [
      'Member Name',
      'Email',
      'Phone Number',
      'Country',
      'Durood Count',
      'Week Start',
      'Week End',
      'Notes',
      'Submitted At',
    ]

    const rows = exportData.map((item) => [
      item.memberName,
      item.email,
      item.phoneNumber,
      item.country,
      item.duroodCount,
      new Date(item.weekStart).toISOString().split('T')[0],
      new Date(item.weekEnd).toISOString().split('T')[0],
      item.notes,
      new Date(item.submittedAt).toISOString(),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${new Date().toISOString().split('T')[0]}.csv"`,
    )
    res.send(csv)
  } else {
    // JSON format (default)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="report-${new Date().toISOString().split('T')[0]}.json"`,
    )
    res.send(
      JSON.stringify(
        {
          exportDate: new Date().toISOString(),
          totalRecords: exportData.length,
          data: exportData,
        },
        null,
        2,
      ),
    )
  }

  logger.info('Report exported', { format, records: exportData.length })
})

/**
 * @desc    Get summary statistics
 * @route   GET /api/reports/summary
 * @access  Private
 */
export const getSummaryStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query

  let query = {}

  if (startDate && endDate) {
    query.weekStartDate = { $gte: new Date(startDate) }
    query.weekEndDate = { $lte: new Date(endDate) }
  }

  // Get all data
  const submissions = await Submission.find(query).populate('member')
  const totalMembers = await Member.countDocuments({ status: 'active' })
  const totalUsers = await User.countDocuments()

  // Calculate summaries
  const totalDurood = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
  const averagePerSubmission =
    submissions.length > 0 ? Math.round(totalDurood / submissions.length) : 0
  const uniqueMembers = new Set(submissions.map((sub) => sub.member?._id?.toString())).size

  // Find top performer
  const topPerformer = submissions.reduce(
    (max, sub) => (sub.duroodCount > (max?.duroodCount || 0) ? sub : max),
    null,
  )

  sendSuccessResponse(res, 200, 'Summary statistics retrieved successfully', {
    summary: {
      totalSubmissions: submissions.length,
      totalDurood,
      averagePerSubmission,
      uniqueMembersSubmitted: uniqueMembers,
      totalActiveMembers: totalMembers,
      totalUsers,
      topPerformer: topPerformer
        ? {
            name: topPerformer.member?.fullName,
            duroodCount: topPerformer.duroodCount,
          }
        : null,
    },
    period: {
      startDate,
      endDate,
    },
  })
})
