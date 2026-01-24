import { useState, useEffect } from 'react'
import {
  X,
  Users,
  Copy,
  Trash2,
  LogOut,
  UserPlus,
  UserX,
  Settings,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSocket } from '../context/SocketContext'

export const GroupInfoPanel = ({
  conversation,
  onClose,
  userId,
  onMemberRemove,
  onGroupDelete,
  onLeaveGroup,
}) => {
  const [copied, setCopied] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)
  const { socket } = useSocket()

  // Get token from multiple possible keys
  const getToken = () =>
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      if (response.ok) {
        const users = await response.json()
        setAllUsers(users.filter((u) => !conversation.participants.find((p) => p._id === u._id)))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleCopyGroupId = () => {
    navigator.clipboard.writeText(conversation._id)
    setCopied(true)
    toast.success('Group ID copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        setLoading(true)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation._id}/leave`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
            },
          },
        )
        if (response.ok) {
          toast.success('Left group successfully!')
          onLeaveGroup?.()
          onClose()
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || 'Failed to leave group')
        }
      } catch (error) {
        console.error('Error leaving group:', error)
        toast.error('Failed to leave group')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      try {
        setLoading(true)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation._id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
            },
          },
        )

        if (response.ok) {
          toast.success('Group deleted successfully!')
          onGroupDelete?.()
          onClose()
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || 'Failed to delete group')
        }
      } catch (error) {
        console.error('Error deleting group:', error)
        toast.error('Failed to delete group')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error('Please select a user')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation._id}/add-participant`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: selectedUser }),
        },
      )

      if (response.ok) {
        toast.success('Member added successfully!')
        setShowAddMember(false)
        setSelectedUser('')
        fetchAllUsers()

        // Emit socket event
        if (socket) {
          const selectedUserData = allUsers.find((u) => u._id === selectedUser)
          socket.emit('member_added', {
            conversationId: conversation._id,
            memberId: selectedUser,
            memberName: selectedUserData?.fullName,
            addedByName: 'You',
            groupName: conversation.name,
          })
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        setLoading(true)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation._id}/remove-participant`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: memberId }),
          },
        )

        if (response.ok) {
          toast.success('Member removed successfully!')
          onMemberRemove?.(memberId)

          // Emit socket event
          if (socket) {
            const member = conversation.participants.find((p) => p._id === memberId)
            socket.emit('member_removed', {
              conversationId: conversation._id,
              memberId,
              memberName: member?.fullName,
              removedByName: 'Admin',
              groupName: conversation.name,
            })
          }
        } else {
          const errorData = await response.json()
          toast.error(errorData.message || 'Failed to remove member')
        }
      } catch (error) {
        console.error('Error removing member:', error)
        toast.error('Failed to remove member')
      } finally {
        setLoading(false)
      }
    }
  }

  const memberCount = conversation.participants?.length || 0
  const isGroupAdmin = conversation.groupAdmin?._id === userId

  return (
    <div className="fixed inset-0 sm:absolute sm:right-0 sm:top-0 sm:w-80 sm:h-full bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto z-40 rounded-xl sm:rounded-none">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-3 sm:p-4 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base truncate">
          <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
          Group Info
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition flex-shrink-0"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Group Details */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Group Image */}
        {conversation.groupImage && (
          <div className="flex justify-center">
            <img
              src={conversation.groupImage}
              alt={conversation.name}
              className="w-20 sm:w-24 h-20 sm:h-24 rounded-lg object-cover border border-slate-700"
            />
          </div>
        )}

        {/* Group Name */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Group Name</p>
          <p className="text-white font-medium text-base sm:text-lg truncate">
            {conversation.name}
          </p>
        </div>

        {/* Group Description */}
        {conversation.description && (
          <div>
            <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Description</p>
            <p className="text-slate-300 text-xs sm:text-sm break-words">
              {conversation.description}
            </p>
          </div>
        )}

        {/* Group ID */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Group ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs sm:text-sm bg-slate-800 text-slate-300 px-2 py-1 rounded flex-1 font-mono overflow-hidden text-ellipsis">
              {conversation._id}
            </code>
            <button
              onClick={handleCopyGroupId}
              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition flex-shrink-0"
              title="Copy Group ID"
            >
              <Copy size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Members Count */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">Members</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{memberCount}</p>
            </div>
            <Users className="text-blue-400 opacity-50 w-8 h-8 sm:w-8 sm:h-8" size={28} />
          </div>
        </div>

        {/* Created Date */}
        <div>
          <p className="text-xs text-slate-400 mb-1 uppercase font-semibold">Created</p>
          <p className="text-slate-300 text-sm">
            {new Date(conversation.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Members List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 uppercase font-semibold">Members</p>
            {isGroupAdmin && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center gap-1"
              >
                <UserPlus size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {showAddMember && isGroupAdmin && (
            <div className="mb-4 p-2 sm:p-3 bg-slate-800 rounded-lg space-y-2">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-2 py-1 bg-slate-700 text-white rounded border border-slate-600 text-xs sm:text-sm"
              >
                <option value="">Select a user...</option>
                {allUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUser || loading}
                className="w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs sm:text-sm transition"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {conversation.participants?.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{member.fullName}</span>
                    {conversation.groupAdmin?._id === member._id && (
                      <span className="text-xs bg-blue-600 text-white px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
                {isGroupAdmin && conversation.groupAdmin?._id !== member._id && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    disabled={loading}
                    className="p-1 text-red-400 hover:bg-red-600/20 rounded transition disabled:opacity-50 flex-shrink-0"
                    title="Remove member"
                  >
                    <UserX size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-700 pt-3 sm:pt-4 space-y-2">
          {isGroupAdmin && (
            <>
              <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition flex items-center justify-center gap-2 text-sm">
                <Settings size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Edit Group</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={handleDeleteGroup}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 rounded-lg transition flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Delete Group</span>
                <span className="sm:hidden">Delete</span>
              </button>
            </>
          )}
          <button
            onClick={handleLeaveGroup}
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 disabled:opacity-50 text-orange-400 rounded-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <LogOut size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Leave Group</span>
            <span className="sm:hidden">Leave</span>
          </button>
        </div>

        {/* Mute Notifications */}
        <div className="border-t border-slate-700 pt-3 sm:pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" defaultChecked={false} />
            <span className="text-xs sm:text-sm text-slate-300">Mute notifications</span>
          </label>
        </div>
      </div>
    </div>
  )
}

export default GroupInfoPanel
