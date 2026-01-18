// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Token refresh function
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  isRefreshing = false
  failedQueue = []
}

/**
 * Refresh access token using refresh token
 * @returns {Promise<string|null>} - New access token or null if refresh fails
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    return null
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (response.ok && data.success) {
      const newAccessToken = data.data?.accessToken || data.accessToken
      if (newAccessToken) {
        localStorage.setItem('accessToken', newAccessToken)
        return newAccessToken
      }
    }

    // Refresh failed, logout user
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    return null
  } catch (error) {
    console.error('Token refresh error:', error)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
    return null
  }
}

/**
 * Make API call with authentication and automatic token refresh
 * @param {string} endpoint - API endpoint (e.g., '/members')
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {string} token - JWT token (optional, uses accessToken from localStorage if not provided)
 * @returns {Promise} - Response object with ok and data properties
 */
export const apiCall = async (endpoint, options = {}, token = null) => {
  try {
    const accessToken = token || localStorage.getItem('accessToken')

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    })

    const data = await response.json()

    // If 401 and we have a refresh token, try to refresh and retry
    if (response.status === 401 && !token) {
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken && !isRefreshing) {
        isRefreshing = true

        try {
          const newAccessToken = await refreshAccessToken()

          if (newAccessToken) {
            processQueue(null, newAccessToken)

            // Retry the original request with new token
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newAccessToken}`,
                ...options.headers,
              },
            })

            const retryData = await retryResponse.json()

            return {
              ok: retryResponse.ok,
              status: retryResponse.status,
              data: retryData,
            }
          }
        } catch (error) {
          processQueue(error, null)
        }
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    }
  } catch (error) {
    console.error('API call error:', error)
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        message: 'Network error. Please check your connection.',
      },
    }
  }
}

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} - Relative time string
 */
export const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

  return new Date(date).toLocaleDateString()
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date and time
 */
export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(email)
}

export default apiCall
