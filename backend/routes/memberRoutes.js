import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  searchMembers,
  getMemberStats,
} from '../controllers/memberController.js'

const router = express.Router()

router.use(protect) // All routes require authentication

router.route('/').get(getAllMembers).post(createMember)

router.route('/search').get(searchMembers)

router.route('/stats/overview').get(getMemberStats)

router.route('/:id').get(getMemberById).put(updateMember).delete(deleteMember)

export default router
