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
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl shadow-2xl flex flex-col h-full border border-slate-800/50">
      {/* Header - Modern gradient with glassmorphism */}
      <div className="p-3 sm:p-4 md:p-5 border-b border-slate-800/50 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-700/80 shadow-xl backdrop-blur-sm rounded-t-xl">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
            Messages
          </h1>
          <button
            onClick={onCreateGroup}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:p-2.5 rounded-lg transition shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 backdrop-blur-sm flex-shrink-0"
            title="Create group"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-3 sm:mb-4 relative">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="🔍 Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-xs sm:text-sm transition backdrop-blur-sm"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap backdrop-blur-sm ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('groups')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1 whitespace-nowrap backdrop-blur-sm ${
              filter === 'groups'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
            }`}
          >
            <Users size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">Groups</span>
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap backdrop-blur-sm ${
              filter === 'unread'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
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
              className="w-full p-3 sm:p-4 border-b border-slate-800/50 hover:bg-slate-800/40 transition text-left group backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-100 truncate group-hover:text-blue-400 transition text-sm">
                      {conversation.name}
                    </h3>
                    {conversation.isGroup && (
                      <span className="inline-flex items-center gap-1 bg-purple-600/30 text-purple-300 text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-purple-600/50 flex-shrink-0">
                        <Users size={10} className="sm:w-[12px] sm:h-[12px]" />
                        <span className="hidden sm:inline">{conversation.participants.length}</span>
                      </span>
                    )}
                  </div>

                  {conversation.lastMessage && (
                    <p className="text-xs text-slate-400 truncate mt-1 sm:mt-1.5 leading-relaxed">
                      {conversation.lastMessage.content || '📎 Media message'}
                    </p>
                  )}

                  <p className="text-xs text-slate-600 mt-1 sm:mt-1.5 font-medium">
                    {conversation.lastMessageAt &&
                      new Date(conversation.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>

                {conversation.unreadCounts &&
                  Object.values(conversation.unreadCounts).some((count) => count > 0) && (
                    <div className="ml-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center text-xs font-bold shadow-lg shadow-red-600/40 flex-shrink-0">
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
