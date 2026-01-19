import logger from './logger.js'
import RegistrationRequest from '../models/RegistrationRequest.js'

/**
 * Clean up old rejected registration requests (older than 7 days)
 * This function runs automatically via scheduled job
 */
export const cleanupOldRejectedRequests = async () => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const result = await RegistrationRequest.deleteMany({
      status: 'rejected',
      rejectedAt: { $lt: sevenDaysAgo },
    })

    if (result.deletedCount > 0) {
      logger.info('Cleanup job completed: Removed old rejected registration requests', {
        deletedCount: result.deletedCount,
        cutoffDate: sevenDaysAgo.toISOString(),
      })
    }

    return result.deletedCount
  } catch (error) {
    logger.error('Cleanup job failed: Error removing old rejected registration requests', {
      error: error.message,
    })
    throw error
  }
}

/**
 * Schedule cleanup job to run daily at midnight
 */
export const scheduleCleanupJobs = () => {
  try {
    // Calculate milliseconds until next midnight
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const msUntilMidnight = tomorrow - now

    // Run cleanup at midnight every day
    setTimeout(() => {
      cleanupOldRejectedRequests()
      // Then run every 24 hours
      setInterval(cleanupOldRejectedRequests, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)

    logger.info('Cleanup job scheduled', {
      nextRunIn: Math.round(msUntilMidnight / 1000 / 60),
      schedule: 'Daily at midnight',
    })
  } catch (error) {
    logger.error('Failed to schedule cleanup job', { error: error.message })
  }
}

export default {
  cleanupOldRejectedRequests,
  scheduleCleanupJobs,
}
