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
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
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
      } else {
        logout()
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [token])

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
        // Backend now returns: { success: true, message: '...', data: { token, user } }
        const token = data.data?.token || data.token
        const user = data.data?.user || data.user

        setToken(token)
        setUser(user)
        localStorage.setItem('token', token)
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
        // Backend now returns: { success: true, message: '...', data: { token, user } }
        const responseToken = data.data?.token || data.token
        const responseUser = data.data?.user || data.user

        if (!responseToken || !responseUser) {
          return { success: false, message: 'Invalid response format from server' }
        }

        setToken(responseToken)
        setUser(responseUser)
        localStorage.setItem('token', responseToken)
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
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
