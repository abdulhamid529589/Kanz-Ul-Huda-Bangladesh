import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import {
  getAllSettings,
  getSetting,
  createOrUpdateSetting,
  updateMultipleSettings,
  deleteSetting,
  resetToDefaults,
  getPublicSettings,
} from '../controllers/adminSettingsController.js'

const router = express.Router()

// Public route - no auth required
router.get('/public/all', getPublicSettings)

// All routes below require authentication
router.use(protect)

// All routes below require admin role
router.use(authorize('admin'))

// Middleware to check main admin for restricted settings
const checkMainAdminForRestrictedSettings = (req, res, next) => {
  const isMainAdmin = req.user?.isMainAdmin
  const key = req.body?.key || req.params?.key

  // Check if trying to update registration code settings without being main admin
  const hasRestrictedSettings = (settingsData) => {
    return settingsData.some(
      (s) => s.key && s.key.includes('registration') && s.key.includes('code'),
    )
  }

  // For batch update
  if (req.body?.settings) {
    if (hasRestrictedSettings(req.body.settings) && !isMainAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can modify registration code settings',
      })
    }
  }

  // For single setting POST
  if (key && key.includes('registration') && key.includes('code') && !isMainAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only main admin can modify registration code settings',
    })
  }

  next()
}

// Get all settings
router.get('/', getAllSettings)

// Reset settings to defaults - with restricted settings check
router.post('/reset/defaults', checkMainAdminForRestrictedSettings, resetToDefaults)

// Update multiple settings at once - with restricted settings check
router.put('/batch', checkMainAdminForRestrictedSettings, updateMultipleSettings)

// Get single setting
router.get('/:key', getSetting)

// Create or update single setting - with restricted settings check
router.post('/:key', checkMainAdminForRestrictedSettings, createOrUpdateSetting)

// Delete setting
router.delete('/:key', deleteSetting)

export default router
