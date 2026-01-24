import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { Circle, Clock } from 'lucide-react'

const statusColors = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-slate-500',
}

const statusLabels = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}

export const UserStatusIndicator = ({ userId, showLabel = true, size = 'sm' }) => {
  const [status, setStatus] = useState('offline')
  const [lastSeen, setLastSeen] = useState(null)
  const [customStatus, setCustomStatus] = useState('')
  const { socket } = useSocket()

  useEffect(() => {
    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/messaging/status/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStatus(data.status || 'offline')
          setLastSeen(data.lastSeen)
          setCustomStatus(data.customStatus || '')
        }
      } catch (error) {
        console.error('Error fetching status:', error)
      }
    }

    fetchStatus()

    // Listen for status updates
    if (socket) {
      socket.on('user_status', (data) => {
        if (data.userId === userId) {
          setStatus(data.status)
          setLastSeen(data.timestamp)
        }
      })

      socket.on('user_status_changed', (data) => {
        if (data.userId === userId) {
          setStatus(data.status)
          setCustomStatus(data.customStatus || '')
          setLastSeen(data.timestamp)
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('user_status')
        socket.off('user_status_changed')
      }
    }
  }, [userId, socket])

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }

  const formatLastSeen = (date) => {
    if (!date) return ''

    const now = new Date()
    const seen = new Date(date)
    const diffMs = now - seen
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return seen.toLocaleDateString()
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className={`${sizeClasses[size]} ${statusColors[status]} rounded-full`}
        title={statusLabels[status]}
      />
      {showLabel && (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-300">{statusLabels[status]}</span>
          {status === 'offline' && lastSeen && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={12} />
              {formatLastSeen(lastSeen)}
            </span>
          )}
          {customStatus && <span className="text-xs text-slate-400 italic">"{customStatus}"</span>}
        </div>
      )}
    </div>
  )
}

export const UserStatusSelector = ({ userId, onStatusChange }) => {
  const [status, setStatus] = useState('online')
  const [customStatus, setCustomStatus] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const { socket } = useSocket()

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)

    // Update backend
    try {
      await fetch('/api/messaging/status/update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          customStatus,
        }),
      })

      // Emit via socket
      if (socket) {
        socket.emit('status_update', {
          userId,
          status: newStatus,
          customStatus,
        })
      }

      onStatusChange?.(newStatus, customStatus)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleCustomStatusChange = async (value) => {
    setCustomStatus(value)

    try {
      await fetch('/api/messaging/status/update', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          customStatus: value,
        }),
      })
    } catch (error) {
      console.error('Error updating custom status:', error)
    }
  }

  return (
    <div className="space-y-2 p-3 bg-slate-800 border border-slate-700 rounded-lg">
      <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Status</p>

      <div className="flex gap-2">
        {Object.entries(statusLabels).map(([statusValue, label]) => (
          <button
            key={statusValue}
            onClick={() => handleStatusChange(statusValue)}
            className={`flex-1 px-3 py-1 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
              status === statusValue
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            <Circle size={10} className={statusColors[statusValue]} fill="currentColor" />
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-xs text-slate-400 hover:text-slate-300 transition"
        >
          + Custom status
        </button>

        {showCustomInput && (
          <input
            type="text"
            value={customStatus}
            onChange={(e) => handleCustomStatusChange(e.target.value)}
            placeholder='e.g., "In a meeting"'
            maxLength={30}
            className="w-full mt-2 px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 text-xs focus:border-blue-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  )
}

export default UserStatusIndicator
