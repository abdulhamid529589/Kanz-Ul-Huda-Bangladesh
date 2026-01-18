import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  createSubmission,
  getSubmissions,
  getCurrentWeekSubmissions,
  updateSubmission,
  deleteSubmission,
  getPendingMembers,
  getRecentSubmissions,
} from '../controllers/submissionController.js'

const router = express.Router()

router.use(protect)

router.route('/').get(getSubmissions).post(createSubmission)

router.route('/current-week').get(getCurrentWeekSubmissions)

router.route('/pending').get(getPendingMembers)

router.route('/recent').get(getRecentSubmissions)

router.route('/:id').put(updateSubmission).delete(deleteSubmission)

export default router
