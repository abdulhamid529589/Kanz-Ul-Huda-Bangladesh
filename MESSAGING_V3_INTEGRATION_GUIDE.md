# 🔌 Integration Guide - WhatsApp Upgrade Features

This guide shows how to integrate the new v3.0 features into your existing ChatWindow component.

---

## 1️⃣ Update ChatWindow Component

### Import New Components

Add these imports to your `ChatWindow.jsx`:

```jsx
import { MessageReactions } from './ReactionsPicker'
import { UserStatusIndicator } from './UserStatus'
import { SearchMessages } from './SearchMessages'
import { NotificationBell } from './NotificationsPanel'
```

### Add State for New Features

```jsx
const [showSearch, setShowSearch] = useState(false)
const [selectedMessage, setSelectedMessage] = useState(null)
const [userStatuses, setUserStatuses] = useState({})
```

### Add Message Reaction Handler

```jsx
const handleAddReaction = async (messageId, emoji) => {
  try {
    const response = await fetch(`/api/messaging/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emoji }),
    })

    if (response.ok) {
      const updatedMessage = await response.json()
      // Update local message state
      setMessages((prev) => prev.map((m) => (m._id === messageId ? updatedMessage : m)))

      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('reaction_added', {
          messageId,
          conversationId: selectedConversation._id,
          emoji,
          userId: user._id,
          senderName: user.fullName,
        })
      }
    }
  } catch (error) {
    console.error('Error adding reaction:', error)
    toast.error('Failed to add reaction')
  }
}
```

### Update Message Display with Reactions

```jsx
{
  messages.map((message) => (
    <div key={message._id} className="message-container">
      {/* Existing message content */}
      <div className="message-content">{message.content}</div>

      {/* NEW: Add Reactions Display */}
      {message.reactions && message.reactions.length > 0 && (
        <MessageReactions
          reactions={message.reactions}
          onAddReaction={(emoji) => handleAddReaction(message._id, emoji)}
          userId={user._id}
        />
      )}
    </div>
  ))
}
```

---

## 2️⃣ Update Conversation Header

### Add Search and User Status

```jsx
{
  /* Chat Header */
}
;<div className="flex items-center justify-between p-4 border-b border-slate-700">
  <div>
    <h2 className="font-bold text-white">{selectedConversation?.name}</h2>

    {/* NEW: Show member count and status */}
    <p className="text-xs text-slate-400">{selectedConversation?.participants?.length} members</p>
  </div>

  <div className="flex items-center gap-2">
    {/* NEW: Search Button */}
    <button
      onClick={() => setShowSearch(!showSearch)}
      className="p-2 rounded hover:bg-slate-700 transition"
      title="Search messages"
    >
      <Search size={20} />
    </button>

    {/* NEW: Notifications Bell */}
    <NotificationBell userId={user._id} />

    {/* Existing buttons... */}
  </div>
</div>

{
  /* NEW: Search Panel */
}
{
  showSearch && (
    <SearchMessages
      conversationId={selectedConversation?._id}
      onClose={() => setShowSearch(false)}
      onSelectMessage={(message) => {
        setSelectedMessage(message)
        // Scroll to message
        const element = document.getElementById(`message-${message._id}`)
        element?.scrollIntoView({ behavior: 'smooth' })
      }}
    />
  )
}
```

---

## 3️⃣ Update User List with Status Indicators

### Show Status for Each User

```jsx
{
  /* Users List or Sidebar */
}
{
  allUsers?.map((user) => (
    <div key={user._id} className="user-item p-3 hover:bg-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-white">{user.fullName}</p>

          {/* NEW: User Status Indicator */}
          <UserStatusIndicator userId={user._id} showLabel={false} size="sm" />
        </div>
      </div>
    </div>
  ))
}
```

---

## 4️⃣ Update Group Info Panel

The GroupInfoPanel is already updated with:

- ✅ Member management (add/remove)
- ✅ Enhanced group details
- ✅ Admin controls
- ✅ Leave/Delete group actions

Just ensure it's properly integrated:

```jsx
{
  showGroupInfo && (
    <GroupInfoPanel
      conversation={selectedConversation}
      onClose={() => setShowGroupInfo(false)}
      userId={user._id}
      onMemberRemove={(memberId) => {
        // Handle member removal
        setSelectedConversation((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p._id !== memberId),
        }))
      }}
      onGroupDelete={() => {
        // Handle group deletion
        setConversations((prev) => prev.filter((c) => c._id !== selectedConversation._id))
        setSelectedConversation(null)
      }}
      onLeaveGroup={() => {
        // Handle leaving group
        setConversations((prev) => prev.filter((c) => c._id !== selectedConversation._id))
        setSelectedConversation(null)
      }}
    />
  )
}
```

---

## 5️⃣ Socket.IO Event Listeners

Add these Socket.IO handlers to your `SocketContext` or wherever Socket events are managed:

```jsx
useEffect(() => {
  if (!socket) return

  // Listen for reaction updates
  socket.on('reaction_updated', (data) => {
    setMessages((prev) =>
      prev.map((msg) => (msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg)),
    )
  })

  // Listen for status changes
  socket.on('user_status_changed', (data) => {
    setUserStatuses((prev) => ({
      ...prev,
      [data.userId]: {
        status: data.status,
        customStatus: data.customStatus,
      },
    }))
  })

  // Listen for group updates
  socket.on('group_updated', (data) => {
    setSelectedConversation((prev) =>
      prev?._id === data.conversationId ? { ...prev, ...data.changes } : prev,
    )
  })

  // Listen for member changes
  socket.on('new_notification', (notification) => {
    console.log('New notification:', notification)
    // Handle notification
  })

  return () => {
    socket.off('reaction_updated')
    socket.off('user_status_changed')
    socket.off('group_updated')
    socket.off('new_notification')
  }
}, [socket])
```

---

## 6️⃣ Add User Status Selector to Profile/Settings

Add this to your user profile or settings area:

```jsx
import { UserStatusSelector } from '@/components/UserStatus'

export const UserProfilePanel = ({ user }) => {
  return (
    <div className="space-y-4 p-4">
      {/* User Info */}
      <div>
        <h3 className="font-bold text-white mb-2">Profile</h3>
        <p className="text-slate-300">{user.fullName}</p>
        <p className="text-sm text-slate-400">{user.email}</p>
      </div>

      {/* NEW: Status Selector */}
      <UserStatusSelector
        userId={user._id}
        onStatusChange={(status, customStatus) => {
          console.log('Status updated:', status, customStatus)
        }}
      />
    </div>
  )
}
```

---

## 7️⃣ Complete Example Integration

Here's how the updated ChatWindow structure might look:

```jsx
import { useState, useContext, useEffect } from 'react'
import { SocketContext } from '../context/SocketContext'
import { MessageReactions } from './ReactionsPicker'
import { UserStatusIndicator } from './UserStatus'
import { SearchMessages } from './SearchMessages'
import { NotificationBell } from './NotificationsPanel'
import { GroupInfoPanel } from './GroupInfoPanel'
import { Search, Users } from 'lucide-react'

export const ChatWindow = ({ selectedConversation, messages, user }) => {
  const { socket } = useContext(SocketContext)
  const [showSearch, setShowSearch] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)

  const handleAddReaction = async (messageId, emoji) => {
    // Implementation from step 1
  }

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      {/* Header with Search and Notifications */}
      <div className="border-b border-slate-700 p-4 flex items-center justify-between">
        <h2 className="font-bold text-white">{selectedConversation?.name}</h2>

        <div className="flex gap-2">
          <button onClick={() => setShowSearch(!showSearch)}>
            <Search size={20} />
          </button>
          <NotificationBell userId={user._id} />
          <button onClick={() => setShowGroupInfo(!showGroupInfo)}>
            <Users size={20} />
          </button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearch && (
        <SearchMessages
          conversationId={selectedConversation?._id}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Messages with Reactions */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message._id} id={`message-${message._id}`}>
            <div className="bg-slate-700 p-3 rounded">{message.content}</div>

            {/* Reactions */}
            {message.reactions?.length > 0 && (
              <MessageReactions
                reactions={message.reactions}
                onAddReaction={(emoji) => handleAddReaction(message._id, emoji)}
                userId={user._id}
              />
            )}
          </div>
        ))}
      </div>

      {/* Group Info Panel */}
      {showGroupInfo && (
        <GroupInfoPanel
          conversation={selectedConversation}
          onClose={() => setShowGroupInfo(false)}
          userId={user._id}
        />
      )}
    </div>
  )
}
```

---

## ✅ Verification Checklist

After integration, verify:

- [ ] Messages display with reactions
- [ ] Adding reaction works and updates in real-time
- [ ] User status shows online/offline/away
- [ ] Search finds messages correctly
- [ ] Notifications appear when enabled
- [ ] Group info panel opens/closes
- [ ] Add member button works (for admins)
- [ ] Remove member works (for admins)
- [ ] Leave group removes user
- [ ] All Socket.IO events fire correctly

---

## 🐛 Common Issues

### Reactions not showing on messages?

- Ensure Message component renders `reactions` array
- Check Message schema in backend has reactions field
- Verify Socket.IO `reaction_updated` listener is active

### Status not updating?

- Ensure `UserStatus.jsx` component is imported
- Check user has authentication token
- Verify Socket.IO user room subscription: `socket.join(\`user\_${userId}\`)`

### Search returning empty?

- Check message content is being indexed properly
- Verify user is part of the conversation
- Check regex pattern in search query

### Notifications not working?

- Enable browser notifications
- Check notification socket listener is registered
- Verify user room join event fires on login

---

## 📚 Additional Resources

- Backend API Reference: `/api/messaging` endpoints
- Socket.IO Events: Check socketHandler.js for all events
- Component Props: Check each component file for prop definitions
- Database Schemas: Check models/ folder

---

**Integration Complete! 🎉**

Your messaging system now has WhatsApp-level features with emoji reactions, user status, notifications, search, and enhanced group management.
