import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

export const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)

  // Check multiple token keys for compatibility
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')
  const currentUserId = localStorage.getItem('userId')

  // Fetch available users
  useEffect(() => {
    if (isOpen && !availableUsers.length) {
      const fetchUsers = async () => {
        try {
          setFetchingUsers(true)

          // Debug logging
          console.log('📋 Token check:')
          console.log(
            '  accessToken:',
            localStorage.getItem('accessToken') ? '✅ Found' : '❌ Not found',
          )
          console.log('  token:', localStorage.getItem('token') ? '✅ Found' : '❌ Not found')
          console.log(
            '  authToken:',
            localStorage.getItem('authToken') ? '✅ Found' : '❌ Not found',
          )
          console.log('  Final token used:', token ? '✅ Found' : '❌ Not found')

          // Check if token exists
          if (!token) {
            console.warn('⚠️ No auth token found in localStorage')
            console.warn('Available keys:', Object.keys(localStorage))
            toast.error('Please log in to create groups')
            return
          }

          console.log('✅ Token found, fetching users...')

          const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/users`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })

          console.log('📊 Users API Response:', response.status, response.statusText)

          if (response.ok) {
            const data = await response.json()
            console.log('✅ Users fetched:', data.length, 'users')
            // Filter out current user
            setAvailableUsers(data.filter((user) => user._id !== currentUserId))
          } else if (response.status === 401) {
            console.error('❌ Unauthorized (401) - Token may be invalid or expired')
            toast.error('Your session has expired. Please log in again.')
          } else if (response.status === 403) {
            console.error('❌ Forbidden (403) - Permission denied')
            toast.error('Permission denied to access users')
          } else {
            const errorText = await response.text()
            console.error('❌ API Error:', response.status, errorText)
            toast.error(`Failed to load users: ${response.status}`)
          }
        } catch (error) {
          console.error('❌ Error fetching users:', error)
          toast.error('Failed to load users')
        } finally {
          setFetchingUsers(false)
        }
      }

      fetchUsers()
    }
  }, [isOpen, token, currentUserId])

  // Create group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Group name is required')
      return
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one member')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          participantIds: selectedUsers,
          description: groupDescription,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Group created successfully!')
        onGroupCreated(data)
        handleClose()
      } else {
        toast.error('Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Error creating group')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setGroupName('')
    setGroupDescription('')
    setSelectedUsers([])
    setSearchQuery('')
    onClose()
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const filteredUsers = availableUsers.filter((user) => {
    // Add safety checks for undefined fields
    const name = user.fullName || user.name || ''
    const email = user.email || ''
    const query = searchQuery.toLowerCase()

    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <button onClick={handleClose} className="text-slate-300 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
            />
          </div>

          {/* Members Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Members <span className="text-blue-400">({selectedUsers.length})</span>
            </label>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Users List */}
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-700 rounded-lg p-3 bg-slate-800/50">
              {fetchingUsers ? (
                <div className="text-center py-4">
                  <p className="text-slate-500">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-500">No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-700/50 rounded-lg cursor-pointer transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => toggleUserSelection(user._id)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 accent-blue-600 bg-slate-800 border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 truncate">
                        {user.fullName || user.name}
                      </p>
                      <p className="text-sm text-slate-400 truncate">{user.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Selected Users Pills */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = availableUsers.find((u) => u._id === userId)
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-500/30"
                  >
                    {user?.name}
                    <button
                      onClick={() => toggleUserSelection(userId)}
                      className="hover:text-blue-100 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-slate-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={loading || !groupName.trim() || selectedUsers.length === 0}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 transition font-medium shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}
