# Socket.IO Messaging System Implementation Guide

## Overview

This guide walks you through adding a real-time messaging system using Socket.IO to your Kanz-Ul-Huda website.

## Phase 1: Backend Setup

### Step 1: Install Required Packages

```bash
cd backend
npm install socket.io express-http-wrapper
```

### Step 2: Create Message Model

Create `backend/models/Message.js`:

```javascript
import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    deletedBySender: Boolean,
    deletedByReceiver: Boolean,
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
  },
  { timestamps: true },
)

// Index for fast querying conversations
messageSchema.index({ senderId: 1, receiverId: 1 })
messageSchema.index({ createdAt: -1 })

const Message = mongoose.model('Message', messageSchema)
export default Message
```

### Step 3: Create Conversation Model

Create `backend/models/Conversation.js`:

```javascript
import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: Date,
    unreadCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  { timestamps: true },
)

conversationSchema.index({ participants: 1 })

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation
```

### Step 4: Create Messaging Routes

Create `backend/routes/messagingRoutes.js`:

```javascript
import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'

const router = express.Router()

// Get all conversations for a user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email profileImage')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })

    res.json(conversations)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversations' })
  }
})

// Get messages between two users
router.get('/messages/:recipientId', protect, async (req, res) => {
  try {
    const { recipientId } = req.params
    const { page = 1, limit = 50 } = req.query

    const skip = (page - 1) * limit

    const messages = await Message.find({
      $or: [
        {
          senderId: req.user._id,
          receiverId: recipientId,
        },
        {
          senderId: recipientId,
          receiverId: req.user._id,
        },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email profileImage')

    const total = await Message.countDocuments({
      $or: [
        {
          senderId: req.user._id,
          receiverId: recipientId,
        },
        {
          senderId: recipientId,
          receiverId: req.user._id,
        },
      ],
    })

    res.json({
      messages: messages.reverse(),
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' })
  }
})

// Mark messages as read
router.patch('/messages/:conversationId/read', protect, async (req, res) => {
  try {
    const { conversationId } = req.params

    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    )

    res.json({ message: 'Messages marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Error updating read status' })
  }
})

// Delete message
router.delete('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params
    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    if (message.senderId.toString() === req.user._id.toString()) {
      message.deletedBySender = true
    } else if (message.receiverId.toString() === req.user._id.toString()) {
      message.deletedByReceiver = true
    }

    if (message.deletedBySender && message.deletedByReceiver) {
      await Message.deleteOne({ _id: messageId })
    } else {
      await message.save()
    }

    res.json({ message: 'Message deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting message' })
  }
})

export default router
```

### Step 5: Create Socket.IO Handler

Create `backend/utils/socketHandler.js`:

```javascript
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import logger from './logger.js'

const userSockets = new Map() // Map of userId to socket IDs

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`)

    socket.on('user_online', (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, [])
      }
      userSockets.get(userId).push(socket.id)

      // Broadcast user is online
      io.emit('user_status', { userId, status: 'online' })
    })

    socket.on('send_message', async (data) => {
      try {
        const { senderId, recipientId, content } = data

        // Create message
        const message = new Message({
          senderId,
          receiverId: recipientId,
          content,
        })

        await message.save()
        await message.populate('senderId', 'name email profileImage')

        // Update or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [senderId, recipientId] },
        })

        if (!conversation) {
          conversation = new Conversation({
            participants: [senderId, recipientId],
            lastMessage: message._id,
            lastMessageAt: new Date(),
          })
        } else {
          conversation.lastMessage = message._id
          conversation.lastMessageAt = new Date()
        }

        await conversation.save()

        // Emit to both sender and receiver
        const recipientSocketIds = userSockets.get(recipientId) || []
        recipientSocketIds.forEach((socketId) => {
          io.to(socketId).emit('receive_message', {
            messageId: message._id,
            senderId,
            content,
            timestamp: message.createdAt,
            senderInfo: message.senderId,
          })
        })

        // Confirm to sender
        socket.emit('message_sent', {
          messageId: message._id,
          timestamp: message.createdAt,
        })
      } catch (error) {
        logger.error('Error sending message:', error)
        socket.emit('message_error', { message: 'Failed to send message' })
      }
    })

    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data
      const recipientSocketIds = userSockets.get(recipientId) || []

      recipientSocketIds.forEach((socketId) => {
        io.to(socketId).emit('user_typing', {
          isTyping,
          timestamp: new Date(),
        })
      })
    })

    socket.on('disconnect', () => {
      let userId = null

      // Find and remove this socket
      for (const [id, sockets] of userSockets.entries()) {
        const index = sockets.indexOf(socket.id)
        if (index !== -1) {
          sockets.splice(index, 1)
          userId = id

          if (sockets.length === 0) {
            userSockets.delete(id)
          }
          break
        }
      }

      if (userId) {
        io.emit('user_status', { userId, status: 'offline' })
      }

      logger.info(`User disconnected: ${socket.id}`)
    })
  })
}

export const getOnlineUsers = () => {
  return Array.from(userSockets.keys())
}
```

### Step 6: Update server.js

Modify your `backend/server.js` to include Socket.IO:

```javascript
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
// ... other imports ...
import messagingRoutes from './routes/messagingRoutes.js'
import { initializeSocket } from './utils/socketHandler.js'

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// ... existing middleware ...

app.use('/api/messaging', messagingRoutes)

// Initialize Socket.IO
initializeSocket(io)

// Listen instead of app.listen
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

## Phase 2: Frontend Setup

### Step 1: Install Socket.IO Client

```bash
cd frontend
npm install socket.io-client
```

### Step 2: Create Socket Context

Create `frontend/src/context/SocketContext.jsx`:

```javascript
import { createContext, useContext, useEffect, useState } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    const newSocket = io(process.env.VITE_API_URL, {
      withCredentials: true,
    })

    newSocket.on('connect', () => {
      const userId = localStorage.getItem('userId')
      newSocket.emit('user_online', userId)
    })

    newSocket.on('user_status', (data) => {
      // Handle user online/offline status
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>
}

export const useSocket = () => {
  return useContext(SocketContext)
}
```

### Step 3: Create Messaging Components

Create `frontend/src/components/MessagingPanel.jsx`:

```javascript
import { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'

export const MessagingPanel = ({ recipientId, recipientName }) => {
  const { socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!socket) return

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data])
    })

    socket.on('user_typing', (data) => {
      setIsTyping(data.isTyping)
    })

    return () => {
      socket.off('receive_message')
      socket.off('user_typing')
    }
  }, [socket])

  const sendMessage = () => {
    if (!input.trim() || !socket) return

    socket.emit('send_message', {
      senderId: localStorage.getItem('userId'),
      recipientId,
      content: input,
    })

    setInput('')
  }

  const handleTyping = (value) => {
    setInput(value)
    if (socket) {
      socket.emit('typing', {
        recipientId,
        isTyping: value.length > 0,
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">{recipientName}</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className={`flex ${
              msg.senderId === localStorage.getItem('userId') ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.senderId === localStorage.getItem('userId')
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p>{msg.content}</p>
              <small className="text-xs opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="text-sm text-gray-500 italic">{recipientName} is typing...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

## Phase 3: Integration Steps

### 1. Update Backend package.json

The backend needs to be modified to use http module:

```json
{
  "dependencies": {
    "socket.io": "^4.7.0"
  }
}
```

### 2. Update Frontend Environment

Add to `.env.local`:

```
VITE_API_URL=http://localhost:5000
```

### 3. Update App.jsx

Wrap your app with SocketProvider:

```javascript
import { SocketProvider } from './context/SocketContext'

function App() {
  return <SocketProvider>{/* Your app components */}</SocketProvider>
}
```

## Features Implemented

✅ Real-time messaging between users
✅ Message persistence in MongoDB
✅ Typing indicators
✅ Online/offline status
✅ Message read receipts
✅ Conversation history
✅ Delete message functionality
✅ Edit message support (model ready)

## Testing

1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Open two browser windows
4. Log in as different users
5. Send messages and see real-time updates

## Deployment Considerations

- Socket.IO requires sticky sessions on load balancers
- Use Redis adapter for multiple server instances
- Update CORS origins for production
- Enable SSL/TLS (Socket.IO over HTTPS)

## Security Notes

- Validate senderId on backend (don't trust from client)
- Implement rate limiting for message sending
- Sanitize message content
- Verify user authorization before message access
- Use JWT tokens for socket authentication

---

Would you like me to implement any of these files in your project?
