/**
 * Standardized error response utility
 */

/**
 * Standard error response format
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {object} details - Additional error details (optional)
 */
export const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    message,
    ...(details && { details }),
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development' && details?.stack) {
    response.stack = details.stack
  }

  return res.status(statusCode).json(response)
}

/**
 * Standard success response format
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object} data - Response data
 */
export const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
  }

  return res.status(statusCode).json(response)
}

/**
 * Handle async errors in route handlers
 * @param {Function} fn - Async route handler function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Global error handler middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500
  let message = err.message || 'Internal Server Error'

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
    const errors = Object.values(err.errors).map((e) => e.message)
    return sendErrorResponse(res, statusCode, message, { errors })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyPattern)[0]
    message = `${field} already exists`
    return sendErrorResponse(res, statusCode, message)
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid ID format'
    return sendErrorResponse(res, statusCode, message)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
    return sendErrorResponse(res, statusCode, message)
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
    return sendErrorResponse(res, statusCode, message)
  }

  // AppError (operational errors)
  if (err.isOperational) {
    return sendErrorResponse(res, err.statusCode, err.message, err.details)
  }

  // Unknown errors - log them but don't expose details to client
  console.error('Unexpected Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  })

  // In production, don't expose error details
  const errorDetails = process.env.NODE_ENV === 'development' ? { stack: err.stack } : null

  return sendErrorResponse(res, statusCode, message, errorDetails)
}
