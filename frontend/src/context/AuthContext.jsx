import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create Auth Context
const AuthContext = createContext()

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'))
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'))
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  // For backward compatibility
  const token = accessToken

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    setRefreshToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout()
      return false
    }

    try {
      // Check if registration code version changed
      const versionResponse = await fetch(`${API_URL}/admin/settings/registration-code-version`)
      const versionData = await versionResponse.json()
      const currentCodeVersion = versionData.data?.version || 1
      const userCodeVersion = user?.registrationCodeVersion || 1

      // If user's code version is different, logout (code was changed)
      if (userCodeVersion !== currentCodeVersion) {
        console.log('Registration code was changed. Logging out...')
        logout()
        return false
      }

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const newAccessToken = data.data?.accessToken || data.accessToken
        if (newAccessToken) {
          setAccessToken(newAccessToken)
          localStorage.setItem('accessToken', newAccessToken)
          return true
        }
      }

      logout()
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const fetchUser = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Backend now returns: { success: true, message: '...', data: { user } }
        const user = data.data?.user || data.user
        if (user) {
          setUser(user)
        } else {
          // Invalid response format, logout
          logout()
        }
      } else if (response.status === 401 && refreshToken) {
        // Try to refresh token
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          logout()
        }
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchUser()
    }
  }, [fetchUser])

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Registration without 2FA returns token
        const token = data.data?.token || data.token
        const user = data.data?.user || data.user

        if (token) {
          setAccessToken(token)
          setUser(user)
          localStorage.setItem('accessToken', token)
        }
        return { success: true, message: data.message }
      } else {
        // Handle validation errors
        const errorMessage =
          data.message ||
          (data.errors && data.errors.length > 0
            ? data.errors[0].msg || data.errors[0].message
            : 'Registration failed. Please try again.')
        return { success: false, message: errorMessage }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Backend now returns: { success: true, message: '...', data: { accessToken, refreshToken, user } }
        const responseAccessToken = data.data?.accessToken || data.accessToken
        const responseRefreshToken = data.data?.refreshToken || data.refreshToken
        const responseUser = data.data?.user || data.user

        if (!responseAccessToken || !responseRefreshToken || !responseUser) {
          return { success: false, message: 'Invalid response format from server' }
        }

        setAccessToken(responseAccessToken)
        setRefreshToken(responseRefreshToken)
        setUser(responseUser)
        localStorage.setItem('accessToken', responseAccessToken)
        localStorage.setItem('refreshToken', responseRefreshToken)
        return { success: true }
      } else {
        // Handle validation errors
        const errorMessage =
          data.message ||
          (data.errors && data.errors.length > 0
            ? data.errors[0].msg || data.errors[0].message
            : 'Login failed. Please try again.')
        return { success: false, message: errorMessage }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Network error. Please try again.' }
    }
  }

  const value = {
    user,
    token,
    accessToken,
    refreshToken,
    loading,
    register,
    login,
    logout,
    refreshAccessToken,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isMainAdmin: user?.isMainAdmin || false,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
