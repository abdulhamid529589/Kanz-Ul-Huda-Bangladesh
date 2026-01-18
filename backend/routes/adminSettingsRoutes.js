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

// Get all settings
router.get('/', getAllSettings)

// Reset settings to defaults
router.post('/reset/defaults', resetToDefaults)

// Update multiple settings at once
router.put('/batch', updateMultipleSettings)

// Get single setting
router.get('/:key', getSetting)

// Create or update single setting
router.post('/:key', createOrUpdateSetting)

// Delete setting
router.delete('/:key', deleteSetting)

export default router
