import { useState, useEffect, useContext } from 'react'
import { Bell, X, Trash2, Loader } from 'lucide-react'
import { SocketContext } from '../context/SocketContext'
import toast from 'react-hot-toast'

export const NotificationsPanel = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const { socket } = useContext(SocketContext)

  useEffect(() => {
    fetchNotifications()

    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications((prev) => [notification, ...prev])
        setUnreadCount((prev) => prev + 1)
        toast.success(`New notification: ${notification.title}`)
      })
    }

    return () => {
      if (socket) {
        socket.off('new_notification')
      }
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messaging/notifications?page=${page}&limit=20`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Error loading notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await fetch(`/api/messaging/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`/api/messaging/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/messaging/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      setNotifications((prev) => prev.filter((n) => n._id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  return (
    <div className="fixed right-4 top-20 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-white" />
          <h3 className="font-bold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <div className="border-b border-slate-700 p-2 flex gap-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex-1 text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
          >
            Mark all read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader size={24} className="animate-spin text-slate-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400">
            <Bell size={32} className="opacity-50 mb-2" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                className={`p-3 hover:bg-slate-800/50 transition cursor-pointer ${
                  !notification.isRead ? 'bg-blue-600/10 border-l-2 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-white text-sm">{notification.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{notification.body}</p>
                    <p className="text-xs text-slate-500 mt-1.5">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteNotification(notification._id)
                    }}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const NotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const { socket } = useContext(SocketContext)

  useEffect(() => {
    fetchUnreadCount()

    if (socket) {
      socket.on('new_notification', () => {
        setUnreadCount((prev) => prev + 1)
      })
    }

    return () => {
      if (socket) {
        socket.off('new_notification')
      }
    }
  }, [socket])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`/api/messaging/notifications?unreadOnly=true`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && <NotificationsPanel userId={userId} onClose={() => setShowPanel(false)} />}
    </div>
  )
}

export default NotificationsPanel
