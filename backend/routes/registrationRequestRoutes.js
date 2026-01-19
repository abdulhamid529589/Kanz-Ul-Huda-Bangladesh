import express from 'express'
import {
  submitRegistrationRequest,
  getRegistrationRequests,
  getRegistrationRequestById,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  checkEmailApproved,
  getRegistrationRequestStats,
} from '../controllers/registrationRequestController.js'
import { protect, requireMainAdmin } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/submit', submitRegistrationRequest)
router.get('/check/:email', checkEmailApproved)

// Admin routes - Protected routes (admin and above)
router.use(protect) // Protect all routes below this

// Stats route - accessible to all admins (both main admin and regular admins)
router.get('/stats/summary', getRegistrationRequestStats)

// Main admin only routes
router.use(requireMainAdmin) // Only main admin can access routes below this
router.get('/', getRegistrationRequests)
router.get('/:id', getRegistrationRequestById)
router.put('/:id/approve', approveRegistrationRequest)
router.put('/:id/reject', rejectRegistrationRequest)

export default router
