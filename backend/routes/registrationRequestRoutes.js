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

// Admin routes - Only main admin (administrator) can access
router.use(protect) // Protect all routes below this
router.use(requireMainAdmin) // Only main admin can access registration requests

router.get('/stats/summary', getRegistrationRequestStats)
router.get('/', getRegistrationRequests)
router.get('/:id', getRegistrationRequestById)
router.put('/:id/approve', approveRegistrationRequest)
router.put('/:id/reject', rejectRegistrationRequest)

export default router
