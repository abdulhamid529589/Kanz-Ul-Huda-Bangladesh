import Settings from '../models/Settings.js'
import { asyncHandler, AppError, sendSuccessResponse } from '../utils/errorHandler.js'
import logger from '../utils/logger.js'

/**
 * @desc    Get all settings (admin only)
 * @route   GET /api/admin/settings
 * @access  Private/Admin
 */
export const getAllSettings = asyncHandler(async (req, res) => {
  const { category } = req.query

  let query = {}
  if (category) query.category = category

  const settings = await Settings.find(query).lean()

  // Group by category
  const grouped = {}
  settings.forEach((setting) => {
    if (!grouped[setting.category]) {
      grouped[setting.category] = []
    }
    grouped[setting.category].push(setting)
  })

  sendSuccessResponse(res, 200, 'Settings retrieved successfully', {
    settings: grouped,
    total: settings.length,
  })
})

/**
 * @desc    Get single setting
 * @route   GET /api/admin/settings/:key
 * @access  Private/Admin
 */
export const getSetting = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: req.params.key }).lean()

  if (!setting) {
    throw new AppError('Setting not found', 404)
  }

  sendSuccessResponse(res, 200, 'Setting retrieved successfully', { setting })
})

/**
 * @desc    Create or update setting (admin only)
 * @route   POST /api/admin/settings
 * @access  Private/Admin
 */
export const createOrUpdateSetting = asyncHandler(async (req, res) => {
  const { key, value, description, category = 'general', dataType = 'string' } = req.body

  if (!key || value === undefined) {
    throw new AppError('Please provide key and value', 400)
  }

  // Validate category
  const validCategories = ['general', 'durood', 'member', 'submission', 'week', 'notification']
  if (!validCategories.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400)
  }

  // Validate dataType
  const validDataTypes = ['string', 'number', 'boolean', 'array', 'object']
  if (!validDataTypes.includes(dataType)) {
    throw new AppError(`Invalid dataType. Must be one of: ${validDataTypes.join(', ')}`, 400)
  }

  let setting = await Settings.findOne({ key })

  if (setting) {
    // Update existing setting
    setting.value = value
    setting.description = description || setting.description
    setting.category = category
    setting.dataType = dataType
    setting.updatedBy = req.user._id
    await setting.save()
  } else {
    // Create new setting
    setting = await Settings.create({
      key,
      value,
      description,
      category,
      dataType,
      updatedBy: req.user._id,
    })
  }

  logger.info('Setting updated', {
    updatedBy: req.user._id,
    key,
  })

  sendSuccessResponse(res, setting ? 200 : 201, 'Setting saved successfully', { setting })
})

/**
 * @desc    Update multiple settings (admin only)
 * @route   PUT /api/admin/settings/batch
 * @access  Private/Admin
 */
export const updateMultipleSettings = asyncHandler(async (req, res) => {
  const { settings: settingsData } = req.body

  if (!Array.isArray(settingsData) || settingsData.length === 0) {
    throw new AppError('Please provide an array of settings', 400)
  }

  const results = {
    updated: 0,
    failed: 0,
  }

  for (const settingData of settingsData) {
    try {
      const { key, value, description, category = 'general', dataType = 'string' } = settingData

      if (!key || value === undefined) {
        throw new Error('Missing key or value')
      }

      let setting = await Settings.findOne({ key })

      if (setting) {
        setting.value = value
        setting.description = description || setting.description
        setting.category = category
        setting.dataType = dataType
        setting.updatedBy = req.user._id
        await setting.save()
      } else {
        await Settings.create({
          key,
          value,
          description,
          category,
          dataType,
          updatedBy: req.user._id,
        })
      }

      results.updated += 1
    } catch (error) {
      results.failed += 1
    }
  }

  logger.info('Multiple settings updated', {
    updatedBy: req.user._id,
    count: results.updated,
  })

  sendSuccessResponse(res, 200, 'Settings updated', { results })
})

/**
 * @desc    Delete setting (admin only)
 * @route   DELETE /api/admin/settings/:key
 * @access  Private/Admin
 */
export const deleteSetting = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: req.params.key })

  if (!setting) {
    throw new AppError('Setting not found', 404)
  }

  await Settings.findOneAndDelete({ key: req.params.key })

  logger.info('Setting deleted', {
    deletedBy: req.user._id,
    key: req.params.key,
  })

  sendSuccessResponse(res, 200, 'Setting deleted successfully', {})
})

/**
 * @desc    Reset settings to default (admin only)
 * @route   POST /api/admin/settings/reset/defaults
 * @access  Private/Admin
 */
export const resetToDefaults = asyncHandler(async (req, res) => {
  const defaultSettings = [
    {
      key: 'min_durood_per_submission',
      value: 1,
      description: 'Minimum Durood count per submission',
      category: 'durood',
      dataType: 'number',
    },
    {
      key: 'max_durood_per_submission',
      value: 10000,
      description: 'Maximum Durood count per submission',
      category: 'durood',
      dataType: 'number',
    },
    {
      key: 'week_start_day',
      value: 'Saturday',
      description: 'Day week starts (Saturday/Sunday/Monday)',
      category: 'week',
      dataType: 'string',
    },
    {
      key: 'month_reporting_enabled',
      value: true,
      description: 'Enable monthly reports',
      category: 'submission',
      dataType: 'boolean',
    },
    {
      key: 'weekly_reporting_enabled',
      value: true,
      description: 'Enable weekly reports',
      category: 'submission',
      dataType: 'boolean',
    },
    {
      key: 'leaderboard_enabled',
      value: true,
      description: 'Enable leaderboard feature',
      category: 'general',
      dataType: 'boolean',
    },
    {
      key: 'notifications_enabled',
      value: true,
      description: 'Enable system notifications',
      category: 'notification',
      dataType: 'boolean',
    },
    {
      key: 'max_members_per_collector',
      value: 0,
      description: 'Maximum members per collector (0 = unlimited)',
      category: 'member',
      dataType: 'number',
    },
  ]

  // Clear existing settings
  await Settings.deleteMany({})

  // Insert default settings
  await Settings.insertMany(
    defaultSettings.map((s) => ({
      ...s,
      updatedBy: req.user._id,
    })),
  )

  logger.info('Settings reset to defaults', {
    resetBy: req.user._id,
  })

  sendSuccessResponse(res, 200, 'Settings reset to defaults successfully', {
    settings: defaultSettings,
  })
})

/**
 * @desc    Get public settings (public settings accessible to all)
 * @route   GET /api/settings/public
 * @access  Public
 */
export const getPublicSettings = asyncHandler(async (req, res) => {
  const publicSettings = await Settings.find({
    key: { $in: ['leaderboard_enabled', 'month_reporting_enabled', 'weekly_reporting_enabled'] },
  })
    .select('key value')
    .lean()

  const settings = {}
  publicSettings.forEach((s) => {
    settings[s.key] = s.value
  })

  sendSuccessResponse(res, 200, 'Public settings retrieved successfully', { settings })
})
