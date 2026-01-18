import express from 'express'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Placeholder for report generation
router.post('/generate', async (req, res) => {
  res.json({
    success: true,
    message: 'Report generation endpoint - To be implemented',
  })
})

export default router
