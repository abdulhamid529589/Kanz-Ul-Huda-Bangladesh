import { useState } from 'react'
import { Clock, Send, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const MessageScheduler = ({ conversationId, onSchedule, onClose }) => {
  const [messageContent, setMessageContent] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSchedule = async () => {
    if (!messageContent.trim()) {
      toast.error('Enter message content')
      return
    }

    if (!scheduleDate || !scheduleTime) {
      toast.error('Select date and time')
      return
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`)
    if (scheduledFor <= new Date()) {
      toast.error('Schedule time must be in the future')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/messages/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: messageContent,
          scheduledFor: scheduledFor.toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Message scheduled')
        onSchedule?.(data.scheduledMessage)
        resetForm()
        onClose?.()
      }
    } catch (error) {
      toast.error('Failed to schedule message')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setMessageContent('')
    setScheduleDate('')
    setScheduleTime('')
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 1)
    return now.toISOString().slice(0, 16)
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4 max-w-lg w-full">
      <div>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Clock size={20} className="text-blue-400" />
          Schedule Message
        </h2>
      </div>

      {/* Message Content */}
      <div>
        <label className="block text-sm text-slate-300 mb-2">Message</label>
        <textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="Enter your message..."
          rows="4"
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">{messageContent.length}/1000 characters</p>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">Date</label>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2">Time</label>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Scheduled Time Preview */}
      {scheduleDate && scheduleTime && (
        <div className="bg-blue-600/10 border border-blue-600/40 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-200">
            Message will be sent on{' '}
            <span className="font-medium">
              {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
            </span>
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSchedule}
          disabled={loading || !messageContent.trim() || !scheduleDate || !scheduleTime}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Clock size={16} />
          {loading ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    </div>
  )
}

export const ScheduledMessagesList = ({ conversationId }) => {
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchScheduled = async () => {
    try {
      const response = await fetch(`/api/messages/scheduled?conversationId=${conversationId}`)
      const data = await response.json()
      setScheduled(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch scheduled:', error)
    } finally {
      setLoading(false)
    }
  }

  const cancelScheduled = async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/scheduled`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setScheduled(scheduled.filter((m) => m._id !== messageId))
        toast.success('Scheduled message cancelled')
      }
    } catch (error) {
      toast.error('Failed to cancel message')
    }
  }

  if (loading) return <div className="text-slate-400">Loading...</div>

  if (scheduled.length === 0) return null

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
      <h3 className="font-semibold text-slate-200 flex items-center gap-2">
        <Clock size={16} className="text-blue-400" />
        Scheduled Messages ({scheduled.length})
      </h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {scheduled.map((msg) => (
          <div
            key={msg._id}
            className="p-2 bg-slate-700/50 rounded flex items-start justify-between gap-2 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 line-clamp-2">{msg.content}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(msg.scheduledFor).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => cancelScheduled(msg._id)}
              className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs transition-colors opacity-0 group-hover:opacity-100"
            >
              Cancel
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
