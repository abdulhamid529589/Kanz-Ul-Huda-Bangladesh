import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getSubmissions,
  getMemberStats,
  getOverviewStats,
  exportReport,
  getSummaryStats,
} from '../controllers/reportController.js'

const router = express.Router()

router.use(protect)

// Get all submissions with filters
router.get('/submissions', getSubmissions)

// Get member statistics and rankings
router.get('/member-stats', getMemberStats)

// Get overview statistics
router.get('/overview', getOverviewStats)

// Get summary statistics
router.get('/summary', getSummaryStats)

// Export report data (CSV or JSON)
router.get('/export', exportReport)

export default router
