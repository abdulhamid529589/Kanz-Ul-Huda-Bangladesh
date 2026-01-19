import express from 'express'
import { protect, requireMainAdmin } from '../middleware/auth.js'
import {
  changeRegistrationCode,
  getRegistrationCodeVersion,
} from '../controllers/registrationCodeController.js'

const router = express.Router()

// Check registration code version (public)
router.get('/registration-code-version', getRegistrationCodeVersion)

// Protected routes
router.use(protect)

// Change registration code (Main Admin only)
router.put('/change-registration-code', requireMainAdmin, changeRegistrationCode)

export default router
