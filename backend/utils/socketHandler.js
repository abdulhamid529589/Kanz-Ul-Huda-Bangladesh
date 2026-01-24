import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import UserStatus from '../models/UserStatus.js'
import Notification from '../models/Notification.js'
import logger from './logger.js'

// Map to store online users: userId -> [socketIds]
const userSockets = new Map()
// Map to store user status
const userStatusMap = new Map()

export const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`)

    // User comes online
    socket.on('user_online', async (userId) => {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, [])
      }
      userSockets.get(userId).push(socket.id)
      socket.userId = userId

      // Update user status in database
      await UserStatus.findOneAndUpdate(
        { userId },
        {
          status: 'online',
          lastSeen: new Date(),
        },
        { upsert: true },
      )

      // Update in-memory map
      userStatusMap.set(userId, {
        status: 'online',
        lastSeen: new Date(),
      })

      // Notify all users that someone is online
      io.emit('user_status', { userId, status: 'online', timestamp: new Date() })
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
    socket.on('typing', async (data) => {
      const { conversationId, isTyping, userName, userId } = data

      // Update typing status
      await UserStatus.findOneAndUpdate(
        { userId },
        {
          isTyping,
          currentConversation: isTyping ? conversationId : null,
        },
        { upsert: true },
      )

      io.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        userName,
        isTyping,
        timestamp: new Date(),
      })
    })

    // ========================================
    // 🔔 STATUS MANAGEMENT HANDLERS
    // ========================================

    // Update user status (online/away/offline)
    socket.on('status_update', async (data) => {
      const { userId, status, customStatus } = data

      await UserStatus.findOneAndUpdate(
        { userId },
        {
          status,
          customStatus: customStatus || '',
          lastSeen: new Date(),
        },
        { upsert: true },
      )

      userStatusMap.set(userId, {
        status,
        customStatus,
        lastSeen: new Date(),
      })

      // Broadcast status change to all users
      io.emit('user_status_changed', {
        userId,
        status,
        customStatus,
        timestamp: new Date(),
      })

      logger.info(`User ${userId} status changed to ${status}`)
    })

    // ========================================
    // 😊 REACTION HANDLERS
    // ========================================

    // Reaction already handled in socket handler, but add notification
    socket.on('reaction_added', async (data) => {
      try {
        const { messageId, conversationId, emoji, userId, senderName } = data

        // Create notification for message sender
        const message = await Message.findById(messageId).populate('senderId')

        if (message && message.senderId._id.toString() !== userId) {
          await Notification.create({
            userId: message.senderId._id,
            conversationId,
            messageId,
            type: 'message',
            title: `${senderName} reacted with ${emoji}`,
            body: `${message.content.substring(0, 50)}...`,
            senderName,
            groupName: (await Conversation.findById(conversationId)).name,
          })

          // Emit notification to user
          io.to(`user_${message.senderId._id}`).emit('new_notification', {
            type: 'reaction',
            emoji,
            senderName,
            messageId,
          })
        }
      } catch (error) {
        logger.error('Error handling reaction notification:', error)
      }
    })

    // ========================================
    // 🔔 NOTIFICATION HANDLERS
    // ========================================

    // Create notification
    socket.on('create_notification', async (data) => {
      try {
        const { userId, conversationId, type, title, body, senderName, groupName } = data

        const notification = await Notification.create({
          userId,
          conversationId,
          type,
          title,
          body,
          senderName,
          groupName,
        })

        // Send to user if online
        io.to(`user_${userId}`).emit('new_notification', notification)

        logger.info(`Notification created for user ${userId}`)
      } catch (error) {
        logger.error('Error creating notification:', error)
      }
    })

    // Join user room for direct notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`)
      logger.info(`User ${userId} joined personal notification room`)
    })

    // Leave user room
    socket.on('leave_user_room', (userId) => {
      socket.leave(`user_${userId}`)
      logger.info(`User ${userId} left personal notification room`)
    })

    // ========================================
    // 👥 GROUP MANAGEMENT HANDLERS
    // ========================================

    // Group created notification
    socket.on('group_created', async (data) => {
      try {
        const { conversationId, groupName, creatorName, participantIds } = data

        // Create notifications for all participants
        for (const participantId of participantIds) {
          if (participantId !== data.creatorId) {
            await Notification.create({
              userId: participantId,
              conversationId,
              type: 'group_created',
              title: `New group: ${groupName}`,
              body: `${creatorName} created the group`,
              senderName: creatorName,
              groupName,
            })

            // Send to user if online
            io.to(`user_${participantId}`).emit('new_notification', {
              type: 'group_created',
              groupName,
              creatorName,
              conversationId,
            })
          }
        }

        logger.info(`Group ${groupName} created notifications sent`)
      } catch (error) {
        logger.error('Error handling group created:', error)
      }
    })

    // Member added to group
    socket.on('member_added', async (data) => {
      try {
        const { conversationId, memberId, memberName, addedByName, groupName } = data

        const notification = await Notification.create({
          userId: memberId,
          conversationId,
          type: 'member_added',
          title: `Added to ${groupName}`,
          body: `${addedByName} added you to the group`,
          senderName: addedByName,
          groupName,
        })

        // Broadcast to group
        io.to(`conversation_${conversationId}`).emit('new_notification', {
          type: 'member_added',
          memberName,
          groupName,
          message: `${addedByName} added ${memberName} to the group`,
        })

        logger.info(`Member ${memberName} added to group ${groupName}`)
      } catch (error) {
        logger.error('Error handling member added:', error)
      }
    })

    // Member removed from group
    socket.on('member_removed', async (data) => {
      try {
        const { conversationId, memberId, memberName, removedByName, groupName } = data

        const notification = await Notification.create({
          userId: memberId,
          conversationId,
          type: 'member_removed',
          title: `Removed from ${groupName}`,
          body: `${removedByName} removed you from the group`,
          senderName: removedByName,
          groupName,
        })

        // Broadcast to group
        io.to(`conversation_${conversationId}`).emit('new_notification', {
          type: 'member_removed',
          memberName,
          groupName,
          message: `${removedByName} removed ${memberName} from the group`,
        })

        logger.info(`Member ${memberName} removed from group ${groupName}`)
      } catch (error) {
        logger.error('Error handling member removed:', error)
      }
    })

    // Group info updated
    socket.on('group_info_updated', async (data) => {
      try {
        const { conversationId, groupName, updatedByName, changes } = data

        // Broadcast update to group
        io.to(`conversation_${conversationId}`).emit('group_updated', {
          conversationId,
          groupName,
          updatedByName,
          changes,
          timestamp: new Date(),
        })

        logger.info(`Group ${groupName} info updated`)
      } catch (error) {
        logger.error('Error handling group update:', error)
      }
    })

    // ========================================
    // 🔍 SEARCH HANDLERS
    // ========================================

    // Search messages (handled via REST API)
    socket.on('search_messages', async (data) => {
      try {
        const { conversationId, query, requestId } = data

        if (!query || query.trim() === '') {
          socket.emit('search_error', { requestId, message: 'Query required' })
          return
        }

        const messages = await Message.find({
          conversationId,
          content: { $regex: query, $options: 'i' },
        })
          .limit(50)
          .populate('senderId', 'fullName profileImage')

        socket.emit('search_results', {
          requestId,
          messages,
          count: messages.length,
        })

        logger.info(`Search performed: "${query}" in conversation ${conversationId}`)
      } catch (error) {
        logger.error('Error searching:', error)
        socket.emit('search_error', { message: 'Search failed' })
      }
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
    socket.on('disconnect', async () => {
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

          // Update database
          await UserStatus.findOneAndUpdate(
            { userId },
            {
              status: 'offline',
              lastSeen: new Date(),
              isTyping: false,
            },
            { upsert: true },
          )

          userStatusMap.set(userId, {
            status: 'offline',
            lastSeen: new Date(),
          })

          io.emit('user_status', { userId, status: 'offline', timestamp: new Date() })
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
