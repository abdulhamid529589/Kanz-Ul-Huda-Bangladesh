import express from 'express'
import Conversation from '../models/Conversation.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Archive conversation
router.patch('/:conversationId/archive', authenticate, async (req, res) => {
  try {
    const { isArchived } = req.body

    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      {
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        archivedBy: isArchived ? req.user.id : null,
      },
      { new: true },
    )

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    res.json({ success: true, conversation })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get archived conversations
router.get('/archived', authenticate, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
      isArchived: true,
    })
      .populate('participants', 'username email')
      .populate('groupAdmin', 'username')
      .populate('lastMessage')
      .sort({ archivedAt: -1 })

    res.json({ success: true, conversations })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete conversation (soft delete - for user only)
router.delete('/:conversationId', authenticate, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' })
    }

    // Remove user from participants
    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.user.id,
    )

    // If no participants left, delete conversation
    if (conversation.participants.length === 0) {
      await Conversation.findByIdAndDelete(req.params.conversationId)
    } else {
      await conversation.save()
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get conversations (with archived option)
router.get('/', authenticate, async (req, res) => {
  try {
    const { archived } = req.query
    const query = { participants: req.user.id }

    if (archived === 'true') {
      query.isArchived = true
    } else if (archived === 'false') {
      query.isArchived = false
    }

    const conversations = await Conversation.find(query)
      .populate('participants', 'username email')
      .populate('groupAdmin', 'username')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })

    res.json({ success: true, conversations })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
