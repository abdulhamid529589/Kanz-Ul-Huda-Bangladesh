import Settings from '../models/Settings.js'
import User from '../models/User.js'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Change registration code (Main Admin only)
 * @route   PUT /api/admin/settings/change-registration-code
 * @access  Private/MainAdmin
 */
export const changeRegistrationCode = asyncHandler(async (req, res) => {
  // Check if user is main admin
  if (!req.user.isMainAdmin) {
    throw new AppError('Only the main admin can change the registration code', 403)
  }

  const { newCode } = req.body

  if (!newCode || newCode.trim().length === 0) {
    throw new AppError('New registration code is required', 400)
  }

  if (newCode.length < 6) {
    throw new AppError('Registration code must be at least 6 characters', 400)
  }

  // Update the actual registration code in database
  let codeSettings = await Settings.findOne({ key: 'registrationCode' })

  if (!codeSettings) {
    codeSettings = await Settings.create({
      key: 'registrationCode',
      value: newCode,
      description: 'Current registration code for new user registrations',
      category: 'general',
      dataType: 'string',
      updatedBy: req.user._id,
    })
  } else {
    codeSettings.value = newCode
    codeSettings.updatedBy = req.user._id
    await codeSettings.save()
  }

  // Get current code version (for audit purposes only)
  let settings = await Settings.findOne({ key: 'registrationCodeVersion' })

  if (!settings) {
    // Create if doesn't exist
    settings = await Settings.create({
      key: 'registrationCodeVersion',
      value: 1,
      description: 'Current version of registration code (for audit purposes)',
      category: 'general',
      dataType: 'number',
      updatedBy: req.user._id,
    })
  }

  // Increment version for audit trail only
  // Note: This version is stored in user profiles during registration to track which code they registered with
  // It does NOT force existing users to logout
  const newVersion = (settings.value || 1) + 1
  settings.value = newVersion
  settings.version = (settings.version || 1) + 1
  settings.updatedBy = req.user._id
  await settings.save()

  // Update environment variable for current session
  process.env.REGISTRATION_CODE = newCode

  logger.info('Registration code changed', {
    changedBy: req.user.username,
    newVersion,
    note: 'Existing users are NOT affected - only new registrations require the new code',
  })

  // Log for audit trail
  logger.warn('SECURITY: Registration code was changed by main admin', {
    admin: req.user.email,
    newVersion,
    affectedUsers: 'Only NEW registrations - existing users remain logged in',
    timestamp: new Date(),
  })

  sendSuccessResponse(
    res,
    200,
    'Registration code changed successfully. Existing users remain logged in.',
    {
      newVersion,
      message: 'Only NEW registrations require the updated code',
      existingUsersUnaffected: true,
    },
  )
})

/**
 * @desc    Get current registration code version
 * @route   GET /api/admin/settings/registration-code-version
 * @access  Private
 */
export const getRegistrationCodeVersion = asyncHandler(async (req, res) => {
  const settings = await Settings.findOne({ key: 'registrationCodeVersion' })
  const currentVersion = settings?.value || 1

  sendSuccessResponse(res, 200, 'Registration code version retrieved', {
    version: currentVersion,
  })
})
