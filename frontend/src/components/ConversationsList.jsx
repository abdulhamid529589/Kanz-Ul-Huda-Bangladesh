import { useState, useEffect } from 'react'
import { Plus, Users, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export const ConversationsList = ({ onSelectConversation, onCreateGroup }) => {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Check multiple token keys for compatibility
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${import.meta.env.VITE_API_URL}/messaging/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        toast.error('Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchConversations()
      // Refresh every 30 seconds
      const interval = setInterval(fetchConversations, 30000)
      return () => clearInterval(interval)
    }
  }, [token])

  let filteredConversations = conversations.filter((conv) => {
    if (filter === 'groups') return conv.isGroup
    if (filter === 'unread')
      return conv.unreadCounts && Object.values(conv.unreadCounts).some((count) => count > 0)
    return true
  })

  // Apply search filter
  if (searchQuery.trim()) {
    filteredConversations = filteredConversations.filter((conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }

  return (
    <div className="w-full max-w-md bg-slate-900 rounded-lg shadow-2xl flex flex-col h-full border border-slate-800">
      {/* Header - Dark Gradient */}
      <div className="p-4 border-b border-slate-800 bg-gradient-to-r from-blue-600 via-purple-600 to-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
          <button
            onClick={onCreateGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition shadow-lg shadow-blue-600/20"
            title="Create group"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-3 relative">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 whitespace-nowrap ${
              filter === 'groups'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Users size={14} />
            Groups
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filter === 'unread'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-slate-400">Loading...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-center px-4">
              {searchQuery && 'No conversations match your search'}
              {!searchQuery && filter === 'all' && 'No conversations yet'}
              {!searchQuery && filter === 'groups' && 'No groups yet'}
              {!searchQuery && filter === 'unread' && 'No unread messages'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation)}
              className="w-full p-4 border-b border-slate-800 hover:bg-slate-800/50 transition text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 truncate group-hover:text-blue-400 transition">
                      {conversation.name}
                    </h3>
                    {conversation.isGroup && (
                      <span className="inline-flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-600/50">
                        <Users size={12} />
                        {conversation.participants.length}
                      </span>
                    )}
                  </div>

                  {conversation.lastMessage && (
                    <p className="text-sm text-slate-400 truncate mt-1">
                      {conversation.lastMessage.content || 'Media message'}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 mt-1">
                    {conversation.lastMessageAt &&
                      new Date(conversation.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>

                {conversation.unreadCounts &&
                  Object.values(conversation.unreadCounts).some((count) => count > 0) && (
                    <div className="ml-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-600/30">
                      {Object.values(conversation.unreadCounts).reduce((a, b) => a + b, 0)}
                    </div>
                  )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
