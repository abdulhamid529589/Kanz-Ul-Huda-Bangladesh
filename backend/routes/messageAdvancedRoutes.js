import express from 'express'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Search messages with advanced filters
router.get('/search', authenticate, async (req, res) => {
  try {
    const { conversationId, q, from, startDate, endDate, hasMedia, hasReactions } = req.query

    const query = { conversationId }

    if (q) {
      query.$text = { $search: q }
    }

    if (from) {
      const user = await User.findOne({ username: from })
      if (user) query.senderId = user._id
    }

    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        query.createdAt.$lte = end
      }
    }

    if (hasMedia === 'true') {
      query.mediaUrls = { $exists: true, $not: { $size: 0 } }
    }

    if (hasReactions === 'true') {
      query.reactions = { $exists: true, $not: { $size: 0 } }
    }

    const messages = await Message.find(query)
      .populate('senderId', 'username email')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({
      success: true,
      messages: messages.map((m) => ({
        ...m.toObject(),
        senderName: m.senderId?.username || 'Unknown',
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Schedule message
router.post('/schedule', authenticate, async (req, res) => {
  try {
    const { conversationId, content, scheduledFor } = req.body

    if (!content || !scheduledFor) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    const scheduled = new Date(scheduledFor)
    if (scheduled <= new Date()) {
      return res.status(400).json({ success: false, error: 'Schedule time must be in future' })
    }

    const message = new Message({
      conversationId,
      senderId: req.user.id,
      content,
      isScheduled: true,
      scheduledFor: scheduled,
    })

    await message.save()

    res.json({
      success: true,
      scheduledMessage: message,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get scheduled messages
router.get('/scheduled', authenticate, async (req, res) => {
  try {
    const { conversationId } = req.query

    const messages = await Message.find({
      conversationId,
      isScheduled: true,
      isScheduledSent: false,
      senderId: req.user.id,
    }).sort({ scheduledFor: 1 })

    res.json({ success: true, messages })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Cancel scheduled message
router.delete('/:messageId/scheduled', authenticate, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.messageId)

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Add mention to message
router.post('/:messageId/mentions', authenticate, async (req, res) => {
  try {
    const { userId, username } = req.body
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        $push: {
          mentions: { userId, username, notified: false },
        },
      },
      { new: true },
    )

    res.json({ success: true, message })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Process scheduled messages (run periodically)
router.post('/process-scheduled', async (req, res) => {
  try {
    const now = new Date()
    const messages = await Message.find({
      isScheduled: true,
      isScheduledSent: false,
      scheduledFor: { $lte: now },
    }).populate('senderId conversationId')

    for (const message of messages) {
      // Emit socket event to send the message
      message.isScheduledSent = true
      await message.save()
      // Notify clients via socket if connected
    }

    res.json({
      success: true,
      processedCount: messages.length,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
