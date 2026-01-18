import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  getWeeklyReport,
  getMonthlyReport,
  getPersonalReportSummary,
  exportPersonalReport,
} from '../controllers/personalReportController.js'

const router = express.Router()

router.use(protect)

// Get weekly report
router.get('/weekly', getWeeklyReport)

// Get monthly report
router.get('/monthly', getMonthlyReport)

// Get report summary
router.get('/summary', getPersonalReportSummary)

// Export report (CSV or JSON)
router.get('/export', exportPersonalReport)

export default router
