import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getDashboardStats,
  getWeeklyStats,
  getParticipationStats,
  getCollectorStats,
} from '../controllers/statsController.js'

const router = express.Router()

router.use(protect)

router.get('/dashboard', getDashboardStats)
router.get('/weekly', getWeeklyStats)
router.get('/participation', getParticipationStats)
router.get('/collectors', authorize('admin'), getCollectorStats)

export default router
