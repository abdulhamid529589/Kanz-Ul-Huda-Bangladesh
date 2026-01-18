import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  bulkImportMembers,
  deactivateMember,
  reactivateMember,
  getMemberStats,
} from '../controllers/adminMemberController.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// All routes require admin role
router.use(authorize('admin'))

// Get member statistics
router.get('/stats/overview', getMemberStats)

// Get all members
router.get('/', getAllMembers)

// Bulk import members
router.post('/bulk-import', bulkImportMembers)

// Create new member
router.post('/', createMember)

// Get single member
router.get('/:id', getMemberById)

// Update member
router.put('/:id', updateMember)

// Deactivate member
router.put('/:id/deactivate', deactivateMember)

// Reactivate member
router.put('/:id/reactivate', reactivateMember)

// Delete member
router.delete('/:id', deleteMember)

export default router
