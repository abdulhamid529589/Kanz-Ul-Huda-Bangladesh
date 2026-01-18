import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAllUsers,
  getUserById,
  createUserAsAdmin,
  updateUser,
  promoteToAdmin,
  demoteToCollector,
  deleteUser,
  getUserActivityLogs,
  deactivateUser,
  reactivateUser,
  getUserStats,
} from '../controllers/adminUserController.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// All routes require admin role
router.use(authorize('admin'))

// ⚠️ IMPORTANT: /stats/overview MUST come before /:id to avoid treating 'overview' as an ID
// Get user statistics
router.get('/stats/overview', getUserStats)

// Get all users with filters and pagination
router.get('/', getAllUsers)

// Create new user (admin can create collectors/other admins)
router.post('/', createUserAsAdmin)

// Get single user
router.get('/:id', getUserById)

// Update user
router.put('/:id', updateUser)

// Promote collector to admin
router.put('/:id/promote-to-admin', promoteToAdmin)

// Demote admin to collector
router.put('/:id/demote-to-collector', demoteToCollector)

// Deactivate user
router.put('/:id/deactivate', deactivateUser)

// Reactivate user
router.put('/:id/reactivate', reactivateUser)

// Get user activity logs
router.get('/:id/activity-logs', getUserActivityLogs)

// Delete user
router.delete('/:id', deleteUser)

export default router
