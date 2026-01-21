import { useState } from 'react'
import { X, Users, Copy, Trash2, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export const GroupInfoPanel = ({ conversation, onClose, userId }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyGroupId = () => {
    navigator.clipboard.writeText(conversation._id)
    setCopied(true)
    toast.success('Group ID copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      toast.info('Leave feature coming soon!')
    }
  }

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      toast.info('Delete feature coming soon!')
    }
  }

  const memberCount = conversation.participants?.length || 0
  const isGroupAdmin = conversation.groupAdmin?._id === userId

  return (
    <div className="absolute right-0 top-0 w-80 h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto z-40">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Users size={18} />
          Group Info
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Group Details */}
      <div className="p-4 space-y-4">
        {/* Group Name */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Group Name</p>
          <p className="text-white font-medium text-lg">{conversation.groupName}</p>
        </div>

        {/* Group ID */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Group ID</p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-slate-800 text-slate-300 px-2 py-1 rounded flex-1 font-mono overflow-hidden text-ellipsis">
              {conversation._id}
            </code>
            <button
              onClick={handleCopyGroupId}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Copy Group ID"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Members Count */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Members</p>
              <p className="text-2xl font-bold text-white">{memberCount}</p>
            </div>
            <Users className="text-blue-400 opacity-50" size={32} />
          </div>
        </div>

        {/* Created Date */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Created</p>
          <p className="text-slate-300">
            {new Date(conversation.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Members List */}
        <div>
          <p className="text-xs text-slate-400 mb-2 uppercase font-semibold">Members</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {conversation.participants?.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition"
              >
                <div>
                  <p className="text-sm font-medium text-white">{member.fullName}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                {conversation.groupAdmin?._id === member._id && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Admin</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-700 pt-4 space-y-2">
          {isGroupAdmin && (
            <>
              <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                <Users size={16} />
                Manage Members
              </button>
              <button
                onClick={handleDeleteGroup}
                className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete Group
              </button>
            </>
          )}
          <button
            onClick={handleLeaveGroup}
            className="w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Leave Group
          </button>
        </div>

        {/* Mute Notifications */}
        <div className="border-t border-slate-700 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" defaultChecked={false} />
            <span className="text-sm text-slate-300">Mute notifications</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default GroupInfoPanel
