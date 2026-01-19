import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { DB_NAME } from './constants.js'

// Load environment variables
dotenv.config()

// Import utilities
import { globalErrorHandler } from './utils/errorHandler.js'
import logger from './utils/logger.js'
import { initializeEmailService } from './utils/emailService.js'
import { scheduleCleanupJobs } from './utils/cleanupJobs.js'

// Import Routes
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import memberRoutes from './routes/memberRoutes.js'
import submissionRoutes from './routes/submissionRoutes.js'
import statsRoutes from './routes/statsRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import personalReportRoutes from './routes/personalReportRoutes.js'
import adminUserRoutes from './routes/adminUserRoutes.js'
import adminMemberRoutes from './routes/adminMemberRoutes.js'
import adminSettingsRoutes from './routes/adminSettingsRoutes.js'
import registrationCodeRoutes from './routes/registrationCodeRoutes.js'
import registrationRequestRoutes from './routes/registrationRequestRoutes.js'

const app = express()

// Initialize email service
initializeEmailService()

// Security Middleware
app.use(helmet())
app.use(compression())

// CORS Configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
)

// Body Parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
// Use Winston logger for production
logger.info('Server starting...', { env: process.env.NODE_ENV })

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
})

// Rate limiting is handled in authRoutes.js
app.use('/api/users', generalLimiter)
app.use('/api/members', generalLimiter)
app.use('/api/submissions', generalLimiter)
app.use('/api/stats', generalLimiter)
app.use('/api/reports', generalLimiter)
app.use('/api/personal-reports', generalLimiter)
app.use('/api/admin/users', generalLimiter)
app.use('/api/admin/members', generalLimiter)
app.use('/api/admin/settings', generalLimiter)

// Database Connection
const MONGO_URI = process.env.MONGODB_URI || `mongodb://localhost:27017/${DB_NAME}`

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('MongoDB Connected Successfully')
    console.log('✅ MongoDB Connected Successfully')
  })
  .catch((err) => {
    logger.error('MongoDB Connection Error', err)
    console.error('❌ MongoDB Connection Error:', err.message)
    process.exit(1)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/personal-reports', personalReportRoutes)

// Admin Routes
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/members', adminMemberRoutes)
app.use('/api/admin/settings', adminSettingsRoutes)
app.use('/api/admin/settings', registrationCodeRoutes)

// Registration Requests
app.use('/api/registration-requests', registrationRequestRoutes)

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Kanz ul Huda Durood System API',
    timestamp: new Date().toISOString(),
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

// Global Error Handler (must be last middleware)
app.use(globalErrorHandler)

// Start Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  const weekStartDay = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][process.env.WEEK_START_DAY || 6]

  logger.info('Server started', { port: PORT, env: process.env.NODE_ENV, weekStartDay })
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log(`📅 Week starts on: ${weekStartDay}`)

  // Schedule background cleanup jobs
  scheduleCleanupJobs()
})
