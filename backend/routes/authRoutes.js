import express from 'express'
import rateLimit from 'express-rate-limit'
import { protect } from '../middleware/auth.js'
import { register, login, getMe, logout, changePassword } from '../controllers/authController.js'
import { validateRegister, validateLogin, validatePasswordChange } from '../middleware/validator.js'

const router = express.Router()

// Stricter rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Only 10 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

// Rate limiter for register
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Only 5 registration attempts per hour
  message: { success: false, message: 'Too many registration attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public routes
router.post('/register', registerLimiter, validateRegister, register)
router.post('/login', loginLimiter, validateLogin, login)

// Protected routes
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)
router.put('/change-password', protect, validatePasswordChange, changePassword)

export default router
