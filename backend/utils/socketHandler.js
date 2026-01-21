import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import logger from './logger.js'

// Map to store online users: userId -> [socketIds]
const userSockets = new Map()

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`)

    // User comes online
    socket.on('user_online', (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, [])
      }
      userSockets.get(userId).push(socket.id)
      socket.userId = userId

      // Notify all users that someone is online
      io.emit('user_status', { userId, status: 'online' })
      logger.info(`User ${userId} is now online`)
    })

    // Join a conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`)
      logger.info(`User ${socket.userId} joined conversation ${conversationId}`)
    })

    // Leave a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`)
    })

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, mediaUrls, senderId } = data

        if (!conversationId || !content || !senderId) {
          socket.emit('message_error', { message: 'Missing required fields' })
          return
        }

        // Create message in database
        const message = new Message({
          conversationId,
          senderId,
          content,
          mediaUrls: mediaUrls || [],
        })

        await message.save()
        await message.populate('senderId', 'name email profileImage')

        // Update conversation
        const conversation = await Conversation.findByIdAndUpdate(
          conversationId,
          {
            lastMessage: message._id,
            lastMessageAt: new Date(),
          },
          { new: true },
        )

        // Emit to all users in the conversation
        io.to(`conversation_${conversationId}`).emit('receive_message', {
          messageId: message._id,
          conversationId,
          senderId: message.senderId,
          content,
          mediaUrls: message.mediaUrls,
          timestamp: message.createdAt,
        })

        // Confirm to sender
        socket.emit('message_sent', {
          messageId: message._id,
          timestamp: message.createdAt,
        })

        logger.info(`Message sent in conversation ${conversationId}`)
      } catch (error) {
        logger.error('Error sending message:', error)
        socket.emit('message_error', { message: 'Failed to send message' })
      }
    })

    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping, userName } = data

      io.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName,
        isTyping,
        timestamp: new Date(),
      })
    })

    // Mark message as read
    socket.on('message_read', async (data) => {
      try {
        const { messageId, conversationId, userId } = data

        const message = await Message.findByIdAndUpdate(
          messageId,
          {
            $push: {
              readBy: {
                userId,
                readAt: new Date(),
              },
            },
          },
          { new: true },
        )

        io.to(`conversation_${conversationId}`).emit('message_read_update', {
          messageId,
          userId,
          readAt: new Date(),
        })

        logger.info(`Message ${messageId} marked as read by ${userId}`)
      } catch (error) {
        logger.error('Error marking message as read:', error)
      }
    })

    // Edit message
    socket.on('edit_message', async (data) => {
      try {
        const { messageId, conversationId, content, userId } = data

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('message_error', { message: 'Message not found' })
          return
        }

        if (message.senderId.toString() !== userId) {
          socket.emit('message_error', { message: 'Not authorized' })
          return
        }

        // Add to edit history
        message.editHistory.push({
          content: message.content,
          editedAt: message.updatedAt,
        })

        message.content = content
        message.editedAt = new Date()
        await message.save()

        // Emit edit to all users in conversation
        io.to(`conversation_${conversationId}`).emit('message_edited', {
          messageId,
          content,
          editedAt: message.editedAt,
        })

        logger.info(`Message ${messageId} edited`)
      } catch (error) {
        logger.error('Error editing message:', error)
        socket.emit('message_error', { message: 'Failed to edit message' })
      }
    })

    // Delete message
    socket.on('delete_message', async (data) => {
      try {
        const { messageId, conversationId, userId } = data

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('message_error', { message: 'Message not found' })
          return
        }

        if (message.senderId.toString() !== userId) {
          socket.emit('message_error', { message: 'Not authorized' })
          return
        }

        // Mark as deleted by user
        if (!message.deletedBy.includes(userId)) {
          message.deletedBy.push(userId)
          await message.save()
        }

        // Emit deletion to all users in conversation
        io.to(`conversation_${conversationId}`).emit('message_deleted', {
          messageId,
          deletedBy: userId,
        })

        logger.info(`Message ${messageId} deleted by ${userId}`)
      } catch (error) {
        logger.error('Error deleting message:', error)
        socket.emit('message_error', { message: 'Failed to delete message' })
      }
    })

    // Add reaction to message
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, conversationId, emoji, userId } = data

        if (!messageId || !emoji || !userId) {
          socket.emit('message_error', { message: 'Missing required fields' })
          return
        }

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('message_error', { message: 'Message not found' })
          return
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          (r) => r.emoji === emoji && r.userId.toString() === userId,
        )

        if (existingReaction) {
          // Remove reaction
          message.reactions = message.reactions.filter(
            (r) => !(r.emoji === emoji && r.userId.toString() === userId),
          )
        } else {
          // Add reaction
          message.reactions.push({
            emoji,
            userId,
            createdAt: new Date(),
          })
        }

        await message.save()

        // Emit to conversation
        io.to(`conversation_${conversationId}`).emit('reaction_updated', {
          messageId,
          reactions: message.reactions,
          emoji,
          userId,
          action: existingReaction ? 'removed' : 'added',
        })

        logger.info(`Reaction ${emoji} on message ${messageId}`)
      } catch (error) {
        logger.error('Error adding reaction:', error)
        socket.emit('message_error', { message: 'Failed to add reaction' })
      }
    })

    // Pin/Unpin message
    socket.on('pin_message', async (data) => {
      try {
        const { messageId, conversationId, userId, isPinned } = data

        if (!messageId || !userId) {
          socket.emit('message_error', { message: 'Missing required fields' })
          return
        }

        const message = await Message.findById(messageId)
        if (!message) {
          socket.emit('message_error', { message: 'Message not found' })
          return
        }

        message.isPinned = isPinned
        message.pinnedBy = userId
        message.pinnedAt = isPinned ? new Date() : null

        await message.save()

        // Emit to conversation
        io.to(`conversation_${conversationId}`).emit('message_pinned', {
          messageId,
          isPinned,
          pinnedAt: message.pinnedAt,
          pinnedBy: userId,
        })

        logger.info(`Message ${messageId} ${isPinned ? 'pinned' : 'unpinned'}`)
      } catch (error) {
        logger.error('Error pinning message:', error)
        socket.emit('message_error', { message: 'Failed to pin message' })
      }
    })

    // Forward message
    socket.on('forward_message', async (data) => {
      try {
        const { messageId, targetConversationId, senderId, content } = data

        if (!messageId || !targetConversationId || !senderId) {
          socket.emit('message_error', { message: 'Missing required fields' })
          return
        }

        const originalMessage = await Message.findById(messageId)
        if (!originalMessage) {
          socket.emit('message_error', { message: 'Message not found' })
          return
        }

        // Create forwarded message
        const forwardedMessage = new Message({
          conversationId: targetConversationId,
          senderId,
          content: content || originalMessage.content,
          mediaUrls: originalMessage.mediaUrls || [],
          isForwarded: true,
          forwardedFrom: {
            messageId: originalMessage._id,
            conversationId: originalMessage.conversationId,
            originalSender: originalMessage.senderId,
          },
        })

        await forwardedMessage.save()
        await forwardedMessage.populate('senderId', 'name email profileImage')

        // Emit to target conversation
        io.to(`conversation_${targetConversationId}`).emit('receive_message', {
          messageId: forwardedMessage._id,
          conversationId: targetConversationId,
          senderId: forwardedMessage.senderId,
          content: forwardedMessage.content,
          mediaUrls: forwardedMessage.mediaUrls,
          timestamp: forwardedMessage.createdAt,
          isForwarded: true,
          forwardedFrom: forwardedMessage.forwardedFrom,
        })

        socket.emit('message_forwarded', {
          messageId: forwardedMessage._id,
          conversationId: targetConversationId,
        })

        logger.info(`Message ${messageId} forwarded to conversation ${targetConversationId}`)
      } catch (error) {
        logger.error('Error forwarding message:', error)
        socket.emit('message_error', { message: 'Failed to forward message' })
      }
    })

    // User disconnects
    socket.on('disconnect', () => {
      const userId = socket.userId

      if (userId && userSockets.has(userId)) {
        const sockets = userSockets.get(userId)
        const index = sockets.indexOf(socket.id)

        if (index !== -1) {
          sockets.splice(index, 1)
        }

        // If user has no more connections, mark as offline
        if (sockets.length === 0) {
          userSockets.delete(userId)
          io.emit('user_status', { userId, status: 'offline' })
          logger.info(`User ${userId} is now offline`)
        }
      }

      logger.info(`User disconnected: ${socket.id}`)
    })
  })
}

export const getOnlineUsers = () => {
  return Array.from(userSockets.keys())
}

export const getUserSockets = (userId) => {
  return userSockets.get(userId) || []
}
