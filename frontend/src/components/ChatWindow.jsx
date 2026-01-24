import { useState, useEffect, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import {
  Send,
  Trash2,
  Edit2,
  MoreVertical,
  Smile,
  Phone,
  Video,
  Info,
  Pin,
  Search,
  X,
  Forward,
  Bell,
  Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import GroupInfoPanel from './GroupInfoPanel'

export const ChatWindow = ({ conversation, onClose }) => {
  const { socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [pinnedMessage, setPinnedMessage] = useState(null)
  const [showInfo, setShowInfo] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [reactingToMessageId, setReactingToMessageId] = useState(null)
  const [showReactionMenu, setShowReactionMenu] = useState(null)
  const [forwardingMessageId, setForwardingMessageId] = useState(null)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [availableConversations, setAvailableConversations] = useState([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [draftMessages, setDraftMessages] = useState({})
  const [userStatuses, setUserStatuses] = useState({})
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const draftSaveTimeoutRef = useRef(null)

  const userId = localStorage.getItem('userId')
  const userName = localStorage.getItem('userName')
  // Check multiple token keys for compatibility
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')

  const emojis = [
    '😊',
    '😂',
    '❤️',
    '👍',
    '🔥',
    '✨',
    '😍',
    '🎉',
    '👏',
    '💯',
    '🚀',
    '💡',
    '⭐',
    '🌟',
    '💬',
    '👌',
    '😢',
    '😱',
    '🤔',
    '😎',
    '🙏',
    '💪',
    '🎯',
    '💖',
    '🔔',
    '👍🏻',
    '👍🏽',
    '👍🏾',
  ]

  // Format timestamp with time - safe date parsing
  const formatMessageTime = (date) => {
    if (!date) return 'Unknown'

    // Handle both ISO strings and Date objects
    let messageDate
    try {
      messageDate = typeof date === 'string' ? new Date(date) : new Date(date)

      // Validate date
      if (isNaN(messageDate.getTime())) {
        return 'Invalid date'
      }
    } catch (error) {
      return 'Invalid date'
    }

    const now = new Date()
    const diffMs = now - messageDate

    // Ensure diff is positive
    if (diffMs < 0) return 'Now'

    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter messages based on search
  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [filteredMessages])

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/messaging/conversations/${conversation._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    if (conversation && socket) {
      fetchMessages()
      socket.emit('join_conversation', conversation._id)

      return () => {
        socket.emit('leave_conversation', conversation._id)
      }
    }
  }, [conversation, socket, token])

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return

    socket.on('receive_message', (data) => {
      if (data.conversationId === conversation._id) {
        console.log('📨 Received message:', data)
        setMessages((prev) => [...prev, data])
      }
    })

    socket.on('message_sent', (data) => {
      console.log('✅ Message confirmed sent:', data)
      toast.success('Message sent')
    })

    socket.on('message_error', (data) => {
      console.error('❌ Message error:', data)
      toast.error(data.message || 'Failed to send message')
    })

    socket.on('user_typing', (data) => {
      if (data.userId !== userId) {
        setTypingUsers((prev) => {
          if (data.isTyping && !prev.includes(data.userName)) {
            return [...prev, data.userName]
          } else if (!data.isTyping) {
            return prev.filter((name) => name !== data.userName)
          }
          return prev
        })
      }
    })

    socket.on('message_edited', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === data.messageId ? { ...msg, content: data.content } : msg,
        ),
      )
    })

    socket.on('message_deleted', (data) => {
      setMessages((prev) => prev.filter((msg) => msg.messageId !== data.messageId))
    })

    socket.on('reaction_updated', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === data.messageId ? { ...msg, reactions: data.reactions } : msg,
        ),
      )
    })

    socket.on('message_pinned', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === data.messageId
            ? { ...msg, isPinned: data.isPinned, pinnedAt: data.pinnedAt }
            : msg,
        ),
      )
    })

    return () => {
      socket.off('receive_message')
      socket.off('message_sent')
      socket.off('message_error')
      socket.off('user_typing')
      socket.off('reaction_updated')
      socket.off('message_pinned')
      socket.off('message_edited')
      socket.off('message_deleted')
    }
  }, [socket, conversation._id, userId])

  // Handle typing
  const handleTyping = (value) => {
    setInput(value)

    if (socket) {
      socket.emit('typing', {
        conversationId: conversation._id,
        isTyping: value.length > 0,
        userName: localStorage.getItem('userName'),
      })
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('typing', {
          conversationId: conversation._id,
          isTyping: false,
          userName: localStorage.getItem('userName'),
        })
      }
    }, 3000)
  }

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !socket) {
      console.warn('Cannot send message - input empty or socket not connected')
      return
    }

    console.log('📤 Sending message:', {
      conversationId: conversation._id,
      content: input,
      senderId: userId,
      socketId: socket.id,
    })

    socket.emit('send_message', {
      conversationId: conversation._id,
      content: input,
      senderId: userId,
    })

    setInput('')
    setIsTyping(false)
  }

  // Edit message
  const handleEditMessage = (message) => {
    if (message.senderId?._id !== userId) {
      toast.error('You can only edit your own messages')
      return
    }
    setEditingMessageId(message.messageId)
    setEditingText(message.content)
    setShowMoreMenu(null)
  }

  // Save edit
  const saveEdit = async () => {
    if (!editingText.trim() || !socket) return

    socket.emit('edit_message', {
      messageId: editingMessageId,
      conversationId: conversation._id,
      content: editingText,
      userId,
    })

    setEditingMessageId(null)
    setEditingText('')
  }

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!socket) return

    socket.emit('delete_message', {
      messageId,
      conversationId: conversation._id,
      userId,
    })

    setShowMoreMenu(null)
  }

  // Add reaction to message
  const handleAddReaction = (messageId, emoji) => {
    if (!socket) return

    socket.emit('add_reaction', {
      messageId,
      conversationId: conversation._id,
      emoji,
      userId,
    })

    setShowReactionMenu(null)
  }

  // Pin message
  const handlePinMessage = (messageId) => {
    if (!socket) return

    socket.emit('pin_message', {
      messageId,
      conversationId: conversation._id,
      userId,
      isPinned: true,
    })

    setShowMoreMenu(null)
  }

  // Forward message
  const handleForwardMessage = (messageId) => {
    if (!socket) return
    // This would open a conversation picker
    console.log('Forward message:', messageId)
    toast.info('Message forwarding feature coming soon!')
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-xl shadow-2xl border border-slate-800/50 overflow-hidden">
      {/* Header - Modern gradient with glassmorphism */}
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-blue-700/80 border-b border-slate-700/50 shadow-xl backdrop-blur-sm gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
            {conversation.name}
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 font-medium truncate">
            {conversation.participants.length} members • Active now
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 sm:p-2.5 hover:bg-white/20 rounded-lg transition text-slate-200 hover:text-white backdrop-blur-sm"
            title="Search messages"
          >
            <Search size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 sm:p-2.5 hover:bg-white/20 rounded-lg transition text-slate-200 hover:text-white backdrop-blur-sm"
            title="Group info"
          >
            <Info size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 hover:bg-red-600/30 rounded-lg transition text-slate-200 hover:text-white backdrop-blur-sm"
            title="Close chat"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-sm">
          <div className="flex gap-2 sm:gap-2.5">
            <input
              type="text"
              placeholder="🔍 Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-lg text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-800/70 hover:bg-slate-700 text-slate-300 rounded-lg transition flex-shrink-0"
            >
              <X size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Group Info Panel */}
      {showInfo && (
        <div className="w-full bg-slate-900 border-b border-slate-800 p-4 max-h-48 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Group Members
          </h3>
          <div className="space-y-2">
            {conversation.participants.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
              >
                <span className="text-sm text-slate-300">{member.name}</span>
                {conversation.groupAdmin === member._id && (
                  <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">
                  {searchQuery
                    ? 'No messages match your search'
                    : 'No messages yet. Start a conversation!'}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg, index) => (
                <div
                  key={msg.messageId}
                  className={`flex ${msg.senderId?._id === userId ? 'justify-end' : 'justify-start'} group animate-fade-in px-2 sm:px-4`}
                >
                  <div
                    className={`w-full max-w-xs sm:max-w-sm md:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl relative backdrop-blur-sm transition transform hover:scale-105 shadow-md ${
                      msg.senderId?._id === userId
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-3xl shadow-blue-600/20'
                        : 'bg-slate-800/70 text-slate-100 rounded-bl-3xl shadow-slate-900/30 border border-slate-700/50'
                    }`}
                  >
                    {msg.senderId?._id !== userId && msg.senderId && (
                      <p className="text-xs font-semibold mb-1 text-blue-300">
                        {msg.senderId.name}
                      </p>
                    )}

                    {editingMessageId === msg.messageId ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white placeholder-slate-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 px-2 py-1 rounded text-white transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="text-xs bg-slate-600 hover:bg-slate-700 px-2 py-1 rounded text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <small
                          className={`text-xs opacity-70 mt-1 block ${msg.senderId?._id === userId ? 'text-blue-100' : 'text-slate-400'}`}
                        >
                          {formatMessageTime(msg.createdAt || msg.timestamp)}
                        </small>
                      </>
                    )}

                    {/* Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-2">
                        {msg.reactions
                          .reduce((acc, reaction) => {
                            const existing = acc.find((r) => r.emoji === reaction.emoji)
                            if (existing) {
                              existing.count++
                            } else {
                              acc.push({ emoji: reaction.emoji, count: 1 })
                            }
                            return acc
                          }, [])
                          .map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => handleAddReaction(msg.messageId, reaction.emoji)}
                              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs flex items-center gap-1 transition"
                            >
                              {reaction.emoji}
                              <span className="text-slate-400">{reaction.count}</span>
                            </button>
                          ))}
                      </div>
                    )}

                    {msg.senderId?._id === userId && !editingMessageId && (
                      <div className="absolute right-0 top-0 -mr-32 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {/* Reaction Button */}
                        <div className="relative">
                          <button
                            onClick={() => setShowReactionMenu(msg.messageId)}
                            className="p-1.5 rounded hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition bg-slate-700/50 hover:bg-slate-700/80"
                            title="Add reaction"
                          >
                            <Smile size={16} />
                          </button>
                          {showReactionMenu === msg.messageId && (
                            <div className="absolute top-8 right-0 bg-slate-800 shadow-2xl rounded-lg p-2 z-20 border border-slate-700 grid grid-cols-5 gap-1">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.messageId, emoji)}
                                  className="text-lg hover:scale-125 transition"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditMessage(msg)}
                          className="p-1.5 rounded hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition bg-slate-700/50 hover:bg-slate-700/80"
                          title="Edit message"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this message?')) {
                              handleDeleteMessage(msg.messageId)
                            }
                          }}
                          className="p-1.5 rounded hover:bg-red-600/20 text-slate-400 hover:text-red-400 transition bg-slate-700/50 hover:bg-slate-700/80"
                          title="Delete message"
                        >
                          <Trash2 size={16} />
                        </button>

                        {/* More Menu */}
                        <button
                          onClick={() => setShowMoreMenu(msg.messageId)}
                          className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition bg-slate-700/50 hover:bg-slate-700/80"
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {showMoreMenu === msg.messageId && (
                          <div className="absolute top-10 -right-32 bg-slate-800 shadow-2xl rounded-lg overflow-hidden z-10 border border-slate-700 min-w-max">
                            <button
                              onClick={() => handlePinMessage(msg.messageId)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            >
                              <Pin size={14} />
                              Pin Message
                            </button>
                            <button
                              onClick={() => handleForwardMessage(msg.messageId)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            >
                              <Send size={14} />
                              Forward
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reaction button for all users on hover */}
                    {msg.senderId?._id !== userId && !editingMessageId && (
                      <div className="absolute left-0 top-0 -ml-16 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          <button
                            onClick={() => setShowReactionMenu(msg.messageId)}
                            className="p-1 rounded hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition"
                            title="Add reaction"
                          >
                            <Smile size={16} />
                          </button>
                          {showReactionMenu === msg.messageId && (
                            <div className="absolute top-8 right-0 bg-slate-800 shadow-2xl rounded-lg p-2 z-20 border border-slate-700 grid grid-cols-5 gap-1">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleAddReaction(msg.messageId, emoji)}
                                  className="text-lg hover:scale-125 transition"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="text-sm text-slate-400 italic px-4 py-2">
                  <span className="inline-flex gap-1">
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                    <span className="flex gap-0.5">
                      <span
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0s' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      ></span>
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Section - Modern themed */}
      <div className="p-3 sm:p-4 md:p-5 border-t border-slate-800/50 bg-gradient-to-r from-slate-900/80 to-slate-900/60 backdrop-blur-sm">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-3 flex flex-wrap gap-1 sm:gap-2 p-3 sm:p-4 bg-slate-800/80 rounded-lg border border-slate-700/50 backdrop-blur-sm">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setInput(input + emoji)
                  setShowEmojiPicker(false)
                }}
                className="text-lg hover:bg-slate-700/50 p-2 sm:p-2.5 rounded-lg transition hover:scale-125 transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 sm:gap-3 items-end">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition backdrop-blur-sm flex-shrink-0"
          >
            <Smile size={18} className="sm:w-5 sm:h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') sendMessage()
            }}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800/70 border border-slate-700/50 rounded-lg text-slate-100 text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition backdrop-blur-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 transition flex items-center gap-2 font-medium shadow-lg shadow-blue-600/30 backdrop-blur-sm text-sm sm:text-base flex-shrink-0"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* Group Info Panel */}
      {showInfo && (
        <GroupInfoPanel
          conversation={conversation}
          onClose={() => setShowInfo(false)}
          userId={userId}
        />
      )}
    </div>
  )
}
