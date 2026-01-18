import Submission from '../models/Submission.js'
import Member from '../models/Member.js'
import moment from 'moment'
import { getCurrentWeek, getPreviousWeek, formatWeekDisplay } from '../utils/weekHelper.js'

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/stats/dashboard
 * @access  Private
 */
export const getDashboardStats = async (req, res) => {
  try {
    // Current week data
    const currentWeek = getCurrentWeek()
    const currentWeekSubmissions = await Submission.find({
      weekStartDate: currentWeek.weekStartDate,
      weekEndDate: currentWeek.weekEndDate,
    })

    const currentWeekTotal = currentWeekSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)
    const currentWeekCount = currentWeekSubmissions.length

    // Previous week for comparison
    const previousWeek = getPreviousWeek()
    const previousWeekSubmissions = await Submission.find({
      weekStartDate: previousWeek.weekStartDate,
      weekEndDate: previousWeek.weekEndDate,
    })

    const previousWeekTotal = previousWeekSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

    // Total members
    const totalActiveMembers = await Member.countDocuments({ status: 'active' })

    // Pending members
    const submittedMemberIds = await Submission.distinct('member', {
      weekStartDate: currentWeek.weekStartDate,
      weekEndDate: currentWeek.weekEndDate,
    })

    const pendingCount = totalActiveMembers - currentWeekCount

    // Progress percentage
    const progressPercentage =
      totalActiveMembers > 0 ? ((currentWeekCount / totalActiveMembers) * 100).toFixed(1) : 0

    // Current month
    const monthStart = moment().startOf('month').toDate()
    const monthEnd = moment().endOf('month').toDate()

    const monthSubmissions = await Submission.find({
      weekStartDate: { $gte: monthStart, $lte: monthEnd },
    })
    const monthTotal = monthSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

    // Current year
    const yearStart = moment().startOf('year').toDate()
    const yearEnd = moment().endOf('year').toDate()

    const yearSubmissions = await Submission.find({
      weekStartDate: { $gte: yearStart, $lte: yearEnd },
    })
    const yearTotal = yearSubmissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

    // All time
    const allTimeTotal = await Submission.aggregate([
      { $group: { _id: null, total: { $sum: '$duroodCount' } } },
    ])

    res.json({
      success: true,
      data: {
        currentWeek: {
          startDate: currentWeek.weekStartDate,
          endDate: currentWeek.weekEndDate,
          display: formatWeekDisplay(currentWeek.weekStartDate, currentWeek.weekEndDate),
          total: currentWeekTotal,
          submissionsCount: currentWeekCount,
          pendingCount,
          progressPercentage: parseFloat(progressPercentage),
        },
        previousWeek: {
          total: previousWeekTotal,
          comparison: currentWeekTotal - previousWeekTotal,
          percentageChange:
            previousWeekTotal > 0
              ? (((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100).toFixed(1)
              : 0,
        },
        monthTotal,
        yearTotal,
        allTimeTotal: allTimeTotal.length > 0 ? allTimeTotal[0].total : 0,
        totalActiveMembers,
      },
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message,
    })
  }
}

/**
 * @desc    Get weekly statistics
 * @route   GET /api/stats/weekly
 * @access  Private
 */
export const getWeeklyStats = async (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks) || 10
    const currentWeek = getCurrentWeek()

    let weekStats = []

    for (let i = 0; i < weeks; i++) {
      const weekStart = moment(currentWeek.weekStartDate).subtract(i, 'weeks').toDate()
      const weekEnd = moment(currentWeek.weekEndDate).subtract(i, 'weeks').toDate()

      const submissions = await Submission.find({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
      })

      const total = submissions.reduce((sum, sub) => sum + sub.duroodCount, 0)

      weekStats.push({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        display: formatWeekDisplay(weekStart, weekEnd),
        total,
        participantCount: submissions.length,
      })
    }

    res.json({
      success: true,
      data: weekStats.reverse(),
    })
  } catch (error) {
    console.error('Get weekly stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly statistics',
      error: error.message,
    })
  }
}

/**
 * @desc    Get member participation stats
 * @route   GET /api/stats/participation
 * @access  Private
 */
export const getParticipationStats = async (req, res) => {
  try {
    const { weekStartDate, weekEndDate } = getCurrentWeek()

    // Top contributors for current week
    const topContributors = await Submission.find({
      weekStartDate,
      weekEndDate,
    })
      .populate('member', 'fullName country')
      .sort({ duroodCount: -1 })
      .limit(10)

    // Geographic distribution
    const geoDistribution = await Submission.aggregate([
      {
        $match: {
          weekStartDate,
          weekEndDate,
        },
      },
      {
        $lookup: {
          from: 'members',
          localField: 'member',
          foreignField: '_id',
          as: 'memberInfo',
        },
      },
      { $unwind: '$memberInfo' },
      {
        $group: {
          _id: '$memberInfo.country',
          total: { $sum: '$duroodCount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ])

    res.json({
      success: true,
      data: {
        topContributors,
        geoDistribution,
      },
    })
  } catch (error) {
    console.error('Get participation stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching participation statistics',
      error: error.message,
    })
  }
}

/**
 * @desc    Get collector performance stats
 * @route   GET /api/stats/collectors
 * @access  Private (Admin only)
 */
export const getCollectorStats = async (req, res) => {
  try {
    const { weekStartDate, weekEndDate } = getCurrentWeek()

    const collectorStats = await Submission.aggregate([
      {
        $match: {
          weekStartDate,
          weekEndDate,
        },
      },
      {
        $group: {
          _id: '$submittedBy',
          submissionsCount: { $sum: 1 },
          totalDurood: { $sum: '$duroodCount' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          fullName: '$user.fullName',
          username: '$user.username',
          submissionsCount: 1,
          totalDurood: 1,
        },
      },
      { $sort: { submissionsCount: -1 } },
    ])

    res.json({
      success: true,
      data: collectorStats,
    })
  } catch (error) {
    console.error('Get collector stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching collector statistics',
      error: error.message,
    })
  }
}
