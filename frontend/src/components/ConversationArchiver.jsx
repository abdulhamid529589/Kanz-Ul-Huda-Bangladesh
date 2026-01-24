import { useState } from 'react'
import { Archive, Unarchive, Trash2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ConversationArchiver = ({ conversation, onArchive, onUnarchive, onDelete }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleArchive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/conversations/${conversation._id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      })

      if (response.ok) {
        toast.success('Conversation archived')
        onArchive?.(conversation._id)
      }
    } catch (error) {
      toast.error('Failed to archive conversation')
    } finally {
      setLoading(false)
    }
  }

  const handleUnarchive = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/conversations/${conversation._id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: false }),
      })

      if (response.ok) {
        toast.success('Conversation unarchived')
        onUnarchive?.(conversation._id)
      }
    } catch (error) {
      toast.error('Failed to unarchive conversation')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/conversations/${conversation._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Conversation deleted')
        onDelete?.(conversation._id)
      }
    } catch (error) {
      toast.error('Failed to delete conversation')
    } finally {
      setLoading(false)
      setShowConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-2">
      {!conversation.isArchived ? (
        <button
          onClick={handleArchive}
          disabled={loading}
          className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <Archive size={16} />
          Archive Conversation
        </button>
      ) : (
        <button
          onClick={handleUnarchive}
          disabled={loading}
          className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <Unarchive size={16} />
          Unarchive Conversation
        </button>
      )}

      <button
        onClick={() => setShowConfirmDelete(true)}
        className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-2"
      >
        <Trash2 size={16} />
        Delete Conversation
      </button>

      {showConfirmDelete && (
        <div className="bg-red-600/10 border border-red-600/40 rounded-lg p-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200">
              Are you sure? This action cannot be undone. All messages will be permanently deleted.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const ArchivedConversationsList = ({ isOpen, onClose, onRestore }) => {
  const [archived, setArchived] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchArchived = async () => {
    try {
      const response = await fetch('/api/conversations?archived=true')
      const data = await response.json()
      setArchived(data.conversations || [])
    } catch (error) {
      console.error('Failed to fetch archived:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (!archived.length) {
    fetchArchived()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Archive size={20} className="text-slate-400" />
            Archived Conversations
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-slate-400">Loading...</div>
          ) : archived.length > 0 ? (
            <div className="space-y-2">
              {archived.map((conv) => (
                <div
                  key={conv._id}
                  className="p-3 bg-slate-800 rounded-lg flex items-center justify-between group hover:bg-slate-700 transition-colors"
                >
                  <div>
                    <p className="text-slate-200 font-medium">{conv.name}</p>
                    <p className="text-xs text-slate-400">
                      Archived on {new Date(conv.archivedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onRestore(conv._id)
                      setArchived(archived.filter((c) => c._id !== conv._id))
                    }}
                    className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded text-sm transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">No archived conversations</div>
          )}
        </div>
      </div>
    </div>
  )
}
