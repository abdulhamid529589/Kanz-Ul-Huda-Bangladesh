import { createContext, useContext, useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // Get API URL from environment and convert to Socket.IO base URL
    let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

    // Remove /api path if present - Socket.IO needs base URL
    const socketUrl = apiUrl.replace(/\/api\/?$/, '') || 'http://localhost:5000'

    console.log('🔌 Attempting Socket.IO connection to:', socketUrl)
    console.log('📍 Environment VITE_API_URL:', import.meta.env.VITE_API_URL)

    // Verify backend is accessible first
    fetch(`${socketUrl}/api/health`)
      .then((res) => {
        console.log('✅ Backend is accessible')
      })
      .catch((err) => {
        console.warn('⚠️ Backend might not be responding:', err.message)
      })

    // Create socket connection with improved options
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 15,
      transports: ['websocket', 'polling'],
      forceNew: false,
      autoConnect: true,
      upgrade: true,
      secure: socketUrl.startsWith('https'),
      rejectUnauthorized: false,
      path: '/socket.io/',
      multiplex: false,
    })

    // Connection event
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully:', newSocket.id)
      setIsConnected(true)

      // Notify server that user is online
      const userId = localStorage.getItem('userId')
      if (userId) {
        newSocket.emit('user_online', userId)
        console.log('📤 Emitted user_online for userId:', userId)
      }
    })

    // Connect error event
    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      if (error.message) {
        console.error('Error message:', error.message)
      }
      console.log('⏳ Retrying connection...')
    })

    // User status changed
    newSocket.on('user_status', (data) => {
      console.log('👥 User status:', data)
      if (data.status === 'online') {
        setOnlineUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId]
          }
          return prev
        })
      } else {
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId))
      }
    })

    // Disconnect event
    newSocket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected. Reason:', reason)
      setIsConnected(false)
    })

    // Reconnect event
    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    // Reconnect attempt
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt:', attemptNumber)
    })

    // Reconnect failed
    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts')
    })

    // Error event
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      console.log('🧹 Cleaning up Socket.IO connection')
      if (newSocket && newSocket.connected) {
        newSocket.disconnect()
      }
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
