import { body, param, query, validationResult } from 'express-validator'

/**
 * Validate request and return errors if any
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    })
  }
  next()
}

/**
 * User registration validation rules
 */
export const validateRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter (A-Z)')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter (a-z)')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number (0-9)'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('registrationCode').trim().notEmpty().withMessage('Registration code is required'),
  validate,
]

/**
 * User login validation rules
 */
export const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
]

/**
 * Member creation/update validation rules
 */
export const validateMember = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('city').optional().trim(),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  validate,
]

/**
 * Submission validation rules
 */
export const validateSubmission = [
  body('memberId')
    .notEmpty()
    .withMessage('Member ID is required')
    .isMongoId()
    .withMessage('Invalid member ID'),
  body('duroodCount')
    .notEmpty()
    .withMessage('Durood count is required')
    .isInt({ min: 1 })
    .withMessage('Durood count must be a positive integer'),
  body('weekStartDate').optional().isISO8601().withMessage('Invalid date format'),
  body('notes').optional().trim(),
  validate,
]

/**
 * ID parameter validation
 */
export const validateId = [param('id').isMongoId().withMessage('Invalid ID format'), validate]

/**
 * Password change validation
 */
export const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
  validate,
]

/**
 * OTP request validation rules (for /request-otp and /resend-otp)
 */
export const validateOTPRequest = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter (A-Z)')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter (a-z)')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number (0-9)'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('registrationCode').trim().notEmpty().withMessage('Registration code is required'),
  validate,
]

/**
 * OTP verification validation rules (for /verify-otp - registration)
 */
export const validateOTPVerification = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  validate,
]

/**
 * Login OTP verification validation rules (for /login-verify-otp)
 */
export const validateLoginOTPVerification = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  validate,
]

/**
 * Login resend OTP validation rules (for /login-resend-otp)
 */
export const validateLoginResendOTP = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  validate,
]

/**
 * Reset password validation rules
 */
export const validateResetPassword = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter (A-Z)')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter (a-z)')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number (0-9)'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match')
      }
      return true
    }),
  validate,
]
