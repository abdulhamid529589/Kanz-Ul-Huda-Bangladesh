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

// Middleware to check if user is main admin (for role change operations)
const checkMainAdminForRoleChange = (req, res, next) => {
  const isMainAdmin = req.user?.email === (process.env.MAIN_ADMIN_EMAIL || '').toLowerCase()

  // Allow non-role-change operations
  if (!req.body?.role) {
    return next()
  }

  // Restrict role changes to main admin only
  if (!isMainAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only the main admin can change user roles',
    })
  }

  next()
}

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

// Update user (with role change protection)
router.put('/:id', checkMainAdminForRoleChange, updateUser)

// Promote collector to admin (requires main admin)
router.put('/:id/promote-to-admin', checkMainAdminForRoleChange, promoteToAdmin)

// Demote admin to collector (requires main admin)
router.put('/:id/demote-to-collector', checkMainAdminForRoleChange, demoteToCollector)

// Deactivate user
router.put('/:id/deactivate', deactivateUser)

// Reactivate user
router.put('/:id/reactivate', reactivateUser)

// Get user activity logs
router.get('/:id/activity-logs', getUserActivityLogs)

// Delete user
router.delete('/:id', deleteUser)

export default router
