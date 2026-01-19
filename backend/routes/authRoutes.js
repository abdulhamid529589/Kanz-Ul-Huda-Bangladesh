import express from 'express'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import { protect } from '../middleware/auth.js'
import {
  register,
  requestOTP,
  verifyOTP,
  resendOTP,
  login,
  refreshToken,
  getMe,
  logout,
  changePassword,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  loginRequestOTP,
  loginVerifyOTP,
  loginResendOTP,
} from '../controllers/authController.js'
import {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateOTPRequest,
  validateOTPVerification,
  validateLoginOTPVerification,
  validateLoginResendOTP,
  validateResetPassword,
} from '../middleware/validator.js'

const router = express.Router()

// Stricter rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Only 100 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  keyGenerator: ipKeyGenerator, // Use library's IPv6-safe generator
})

// Rate limiter for register
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Only 50 registration attempts per hour
  message: { success: false, message: 'Too many registration attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator, // Use library's IPv6-safe generator
})

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 OTP requests per 15 minutes per email
  message: { success: false, message: 'Too many OTP requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email as key, no IP fallback to avoid IPv6 issues
  keyGenerator: (req) => {
    return req.body.email || 'anonymous'
  },
  skip: (req) => !req.body.email, // Skip rate limiting if no email provided (validator will catch it)
})

// Rate limiter for password reset requests
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 reset requests per 15 minutes per email
  message: { success: false, message: 'Too many password reset requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Use email as key, no IP fallback to avoid IPv6 issues
  keyGenerator: (req) => {
    return req.body.email || 'anonymous'
  },
  skip: (req) => !req.body.email, // Skip rate limiting if no email provided (validator will catch it)
})

// Public routes
// 2FA Registration Flow
router.post('/request-otp', otpLimiter, validateOTPRequest, requestOTP)
router.post('/verify-otp', validateOTPVerification, verifyOTP)
router.post('/resend-otp', otpLimiter, validateOTPRequest, resendOTP)

// 2FA Login Flow
router.post('/login-request-otp', loginLimiter, validateLogin, loginRequestOTP)
router.post('/login-verify-otp', validateLoginOTPVerification, loginVerifyOTP)
router.post('/login-resend-otp', loginLimiter, validateLoginResendOTP, loginResendOTP)

// Legacy registration (backward compatibility)
router.post('/register', registerLimiter, validateRegister, register)

// Legacy login (backward compatibility - password only, no 2FA)
router.post('/login', loginLimiter, validateLogin, login)

// Password reset routes
router.post('/forgot-password', resetLimiter, forgotPassword)
router.post('/verify-reset-token', verifyResetToken)
router.post('/reset-password', validateResetPassword, resetPassword)

// Refresh token endpoint
router.post('/refresh-token', refreshToken)

// Protected routes
router.get('/me', protect, getMe)
router.post('/logout', protect, logout)
router.put('/change-password', protect, validatePasswordChange, changePassword)

export default router
