import Submission from '../models/Submission.js'
import Member from '../models/Member.js'
import moment from 'moment'
import { getCurrentWeek, getPreviousWeek } from '../utils/weekHelper.js'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Get user's weekly personal report
 * @route   GET /api/personal-reports/weekly
 * @access  Private
 */
export const getWeeklyReport = asyncHandler(async (req, res) => {
  const { startDate } = req.query
  const userId = req.user._id

  let weekStart = new Date()
  let weekEnd = new Date()

  if (startDate) {
    const selectedDate = new Date(startDate)
    const dayOfWeek = selectedDate.getDay() // 0=Sunday, 6=Saturday

    // Calculate Saturday (start of week)
    const firstDay = new Date(selectedDate)
    const daysToSaturday = (dayOfWeek + 1) % 7
    firstDay.setDate(selectedDate.getDate() - daysToSaturday)
    firstDay.setHours(0, 0, 0, 0)

    // Calculate Friday (end of week)
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    lastDay.setHours(23, 59, 59, 999)

    weekStart = firstDay
    weekEnd = lastDay
  } else {
    const currentWeek = getCurrentWeek()
    weekStart = currentWeek.weekStartDate
    weekEnd = currentWeek.weekEndDate
  }

  // Get members created by the user
  const userCreatedMembers = await Member.find({ createdBy: userId }).select('_id')
  const memberIds = userCreatedMembers.map((m) => m._id)

  // Get submissions created by user for those members in this week
  const submissions = await Submission.find({
    createdBy: userId,
    member: { $in: memberIds },
    createdAt: {
      $gte: weekStart,
      $lte: weekEnd,
    },
  })
    .populate('member', 'fullName email phoneNumber country')
    .sort({ createdAt: -1 })

  const totalDurood = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
  const uniqueMembers = new Set(submissions.map((s) => s.member._id.toString())).size

  sendSuccessResponse(res, 200, 'Weekly report retrieved successfully', {
    report: {
      type: 'Weekly',
      period: `${weekStart.toLocaleDateString()} (Sat) - ${weekEnd.toLocaleDateString()} (Fri)`,
      startDate: weekStart.toISOString(),
      endDate: weekEnd.toISOString(),
      totalDurood,
      submissions: submissions.length,
      uniqueMembers,
      avgPerSubmission: submissions.length > 0 ? (totalDurood / submissions.length).toFixed(0) : 0,
      details: submissions.map((sub) => ({
        id: sub._id,
        memberName: sub.member.fullName,
        email: sub.member.email,
        phoneNumber: sub.member.phoneNumber,
        country: sub.member.country,
        duroodCount: sub.duroodCount,
        date: sub.createdAt,
        notes: sub.notes,
      })),
    },
  })
})

/**
 * @desc    Get user's monthly personal report
 * @route   GET /api/personal-reports/monthly
 * @access  Private
 */
export const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query
  const userId = req.user._id

  let monthDate = new Date()

  if (month && year) {
    monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
  }

  const monthStart = moment(monthDate).startOf('month').toDate()
  const monthEnd = moment(monthDate).endOf('month').toDate()

  const monthName = monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Get members created by the user
  const userCreatedMembers = await Member.find({ createdBy: userId }).select('_id')
  const memberIds = userCreatedMembers.map((m) => m._id)

  // Get submissions created by user for those members in this month
  const submissions = await Submission.find({
    createdBy: userId,
    member: { $in: memberIds },
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd,
    },
  })
    .populate('member', 'fullName email phoneNumber country')
    .sort({ createdAt: -1 })

  const totalDurood = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
  const uniqueMembers = new Set(submissions.map((s) => s.member._id.toString())).size

  sendSuccessResponse(res, 200, 'Monthly report retrieved successfully', {
    report: {
      type: 'Monthly',
      period: monthName,
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      totalDurood,
      submissions: submissions.length,
      uniqueMembers,
      avgPerSubmission: submissions.length > 0 ? (totalDurood / submissions.length).toFixed(0) : 0,
      details: submissions.map((sub) => ({
        id: sub._id,
        memberName: sub.member.fullName,
        email: sub.member.email,
        phoneNumber: sub.member.phoneNumber,
        country: sub.member.country,
        duroodCount: sub.duroodCount,
        date: sub.createdAt,
        notes: sub.notes,
      })),
    },
  })
})

/**
 * @desc    Get user's personal report summary
 * @route   GET /api/personal-reports/summary
 * @access  Private
 */
export const getPersonalReportSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const userId = req.user._id

  let query = {
    createdBy: userId,
  }

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }

  // Get user's members
  const userCreatedMembers = await Member.find({ createdBy: userId }).select('_id')
  const memberIds = userCreatedMembers.map((m) => m._id)

  query.member = { $in: memberIds }

  // Get submissions
  const submissions = await Submission.find(query).populate('member')

  const totalDurood = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
  const uniqueMembers = new Set(submissions.map((s) => s.member._id.toString())).size

  // Get member stats
  const memberStats = {}
  submissions.forEach((sub) => {
    const memberId = sub.member._id.toString()
    if (!memberStats[memberId]) {
      memberStats[memberId] = {
        name: sub.member.fullName,
        totalDurood: 0,
        count: 0,
      }
    }
    memberStats[memberId].totalDurood += sub.duroodCount
    memberStats[memberId].count += 1
  })

  const topMember = Object.entries(memberStats).reduce(
    (max, [_, stats]) => {
      if (stats.totalDurood > (max.totalDurood || 0)) {
        return { ...stats }
      }
      return max
    },
    { totalDurood: 0, count: 0, name: 'N/A' },
  )

  sendSuccessResponse(res, 200, 'Personal report summary retrieved successfully', {
    summary: {
      totalSubmissions: submissions.length,
      totalDurood,
      uniqueMembers,
      averagePerSubmission:
        submissions.length > 0 ? (totalDurood / submissions.length).toFixed(0) : 0,
      topMember: {
        name: topMember.name,
        totalDurood: topMember.totalDurood,
        submissions: topMember.count,
      },
      period: {
        startDate: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(),
        endDate: endDate || new Date().toISOString(),
      },
    },
  })
})

/**
 * @desc    Export personal report data
 * @route   GET /api/personal-reports/export
 * @access  Private
 */
export const exportPersonalReport = asyncHandler(async (req, res) => {
  const { format = 'json', reportType = 'weekly', month, year, startDate } = req.query
  const userId = req.user._id

  let submissions, reportData

  if (reportType === 'weekly') {
    // Get weekly report data
    let weekStart = new Date()
    let weekEnd = new Date()

    if (startDate) {
      const selectedDate = new Date(startDate)
      const dayOfWeek = selectedDate.getDay()

      const firstDay = new Date(selectedDate)
      const daysToSaturday = (dayOfWeek + 1) % 7
      firstDay.setDate(selectedDate.getDate() - daysToSaturday)
      firstDay.setHours(0, 0, 0, 0)

      const lastDay = new Date(firstDay)
      lastDay.setDate(firstDay.getDate() + 6)
      lastDay.setHours(23, 59, 59, 999)

      weekStart = firstDay
      weekEnd = lastDay
    } else {
      const currentWeek = getCurrentWeek()
      weekStart = currentWeek.weekStartDate
      weekEnd = currentWeek.weekEndDate
    }

    const userCreatedMembers = await Member.find({ createdBy: userId }).select('_id')
    const memberIds = userCreatedMembers.map((m) => m._id)

    submissions = await Submission.find({
      createdBy: userId,
      member: { $in: memberIds },
      createdAt: { $gte: weekStart, $lte: weekEnd },
    }).populate('member')

    reportData = {
      type: 'Weekly',
      period: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
    }
  } else {
    // Get monthly report data
    const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const monthStart = moment(monthDate).startOf('month').toDate()
    const monthEnd = moment(monthDate).endOf('month').toDate()

    const userCreatedMembers = await Member.find({ createdBy: userId }).select('_id')
    const memberIds = userCreatedMembers.map((m) => m._id)

    submissions = await Submission.find({
      createdBy: userId,
      member: { $in: memberIds },
      createdAt: { $gte: monthStart, $lte: monthEnd },
    }).populate('member')

    reportData = {
      type: 'Monthly',
      period: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  }

  const exportData = submissions.map((sub) => ({
    memberName: sub.member?.fullName || 'N/A',
    email: sub.member?.email || 'N/A',
    phoneNumber: sub.member?.phoneNumber || 'N/A',
    country: sub.member?.country || 'N/A',
    duroodCount: sub.duroodCount,
    date: sub.createdAt,
    notes: sub.notes || '',
  }))

  if (format === 'csv') {
    const headers = [
      'Member Name',
      'Email',
      'Phone Number',
      'Country',
      'Durood Count',
      'Date',
      'Notes',
    ]

    const rows = exportData.map((item) => [
      item.memberName,
      item.email,
      item.phoneNumber,
      item.country,
      item.duroodCount,
      new Date(item.date).toISOString().split('T')[0],
      item.notes,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="personal-report-${new Date().toISOString().split('T')[0]}.csv"`,
    )
    res.send(csv)
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="personal-report-${new Date().toISOString().split('T')[0]}.json"`,
    )
    res.send(
      JSON.stringify(
        {
          reportType: reportData.type,
          period: reportData.period,
          generatedBy: req.user.fullName,
          generatedAt: new Date().toISOString(),
          totalRecords: exportData.length,
          totalDurood: exportData.reduce((sum, item) => sum + item.duroodCount, 0),
          data: exportData,
        },
        null,
        2,
      ),
    )
  }

  logger.info('Personal report exported', {
    userId,
    format,
    reportType,
    records: exportData.length,
  })
})
