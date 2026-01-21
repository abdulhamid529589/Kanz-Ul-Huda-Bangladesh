import express from 'express'
import { protect } from '../middleware/auth.js'
import Message from '../models/Message.js'
import Conversation from '../models/Conversation.js'
import User from '../models/User.js'

const router = express.Router()

// Get all users for messaging (available to all authenticated users)
router.get('/users', protect, async (req, res) => {
  try {
    // Fetch users and filter out those without required fields
    const allUsers = await User.find()
      .select('_id fullName email profileImage status')
      .sort({ fullName: 1 })

    // Filter to ensure all users have required fields
    const validUsers = allUsers.filter((user) => user.fullName && user.email)

    console.log(`📊 Messaging Users: ${allUsers.length} total, ${validUsers.length} valid`)

    res.json(validUsers)
  } catch (error) {
    console.error('Error fetching users for messaging:', error)
    res.status(500).json({ message: 'Error fetching users' })
  }
})

// Create or get a group conversation
router.post('/conversations', protect, async (req, res) => {
  try {
    const { name, participantIds, groupImage, description } = req.body

    if (!name || !participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'Name and participants required' })
    }

    // Add current user as admin
    const allParticipants = [
      req.user._id,
      ...participantIds.filter((id) => id !== req.user._id.toString()),
    ]

    const conversation = new Conversation({
      name,
      isGroup: true,
      groupAdmin: req.user._id,
      participants: allParticipants,
      groupImage,
      description,
    })

    await conversation.save()
    await conversation.populate('participants', 'name email profileImage')

    res.status(201).json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ message: 'Error creating conversation' })
  }
})

// Get all conversations for a user
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name email profileImage status')
      .populate('lastMessage')
      .populate('groupAdmin', 'name email')
      .sort({ lastMessageAt: -1 })

    res.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ message: 'Error fetching conversations' })
  }
})

// Get a single conversation with messages
router.get('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { page = 1, limit = 50 } = req.query

    const skip = (page - 1) * limit

    // Get conversation details
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email profileImage status')
      .populate('groupAdmin', 'name email')

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    // Check if user is participant
    if (!conversation.participants.find((p) => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    // Get messages
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'name email profileImage')

    const total = await Message.countDocuments({ conversationId })

    // Reset unread count for this user
    if (conversation.unreadCounts.has(req.user._id.toString())) {
      conversation.unreadCounts.set(req.user._id.toString(), 0)
      await conversation.save()
    }

    res.json({
      conversation,
      messages: messages.reverse(),
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    res.status(500).json({ message: 'Error fetching conversation' })
  }
})

// Send message
router.post('/messages', protect, async (req, res) => {
  try {
    const { conversationId, content, mediaUrls } = req.body

    if (!conversationId || !content) {
      return res.status(400).json({ message: 'Conversation ID and content required' })
    }

    // Verify user is participant
    const conversation = await Conversation.findById(conversationId)
    if (
      !conversation ||
      !conversation.participants.find((p) => p.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    const message = new Message({
      conversationId,
      senderId: req.user._id,
      content,
      mediaUrls: mediaUrls || [],
    })

    await message.save()
    await message.populate('senderId', 'name email profileImage')

    // Update conversation
    conversation.lastMessage = message._id
    conversation.lastMessageAt = new Date()
    await conversation.save()

    res.status(201).json(message)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ message: 'Error sending message' })
  }
})

// Mark message as read
router.patch('/messages/:messageId/read', protect, async (req, res) => {
  try {
    const { messageId } = req.params

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    // Check if already read by this user
    const alreadyRead = message.readBy.find((r) => r.userId.toString() === req.user._id.toString())
    if (!alreadyRead) {
      message.readBy.push({
        userId: req.user._id,
        readAt: new Date(),
      })

      if (
        message.readBy.length ===
        (await Conversation.findById(message.conversationId)).participants.length - 1
      ) {
        message.isRead = true
      }

      await message.save()
    }

    res.json({ message: 'Message marked as read' })
  } catch (error) {
    console.error('Error marking as read:', error)
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

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    message.deletedBy.push(req.user._id)

    if (
      message.deletedBy.length >=
      (await Conversation.findById(message.conversationId)).participants.length
    ) {
      await Message.deleteOne({ _id: messageId })
    } else {
      await message.save()
    }

    res.json({ message: 'Message deleted' })
  } catch (error) {
    console.error('Error deleting message:', error)
    res.status(500).json({ message: 'Error deleting message' })
  }
})

// Edit message
router.patch('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params
    const { content } = req.body

    const message = await Message.findById(messageId)

    if (!message) {
      return res.status(404).json({ message: 'Message not found' })
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (!content || content.trim() === message.content.trim()) {
      return res.status(400).json({ message: 'New content required' })
    }

    // Add to edit history
    message.editHistory.push({
      content: message.content,
      editedAt: message.updatedAt,
    })

    message.content = content
    message.editedAt = new Date()

    await message.save()
    await message.populate('senderId', 'name email profileImage')

    res.json(message)
  } catch (error) {
    console.error('Error editing message:', error)
    res.status(500).json({ message: 'Error editing message' })
  }
})

// Update group info
router.patch('/conversations/:conversationId', protect, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { name, description, groupImage } = req.body

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can update info' })
    }

    if (name) conversation.name = name
    if (description) conversation.description = description
    if (groupImage) conversation.groupImage = groupImage

    await conversation.save()
    await conversation.populate('participants', 'name email profileImage')

    res.json(conversation)
  } catch (error) {
    console.error('Error updating group:', error)
    res.status(500).json({ message: 'Error updating group' })
  }
})

// Add participant to group
router.post('/conversations/:conversationId/add-participant', protect, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    if (conversation.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group admin can add participants' })
    }

    if (conversation.participants.find((p) => p.toString() === userId)) {
      return res.status(400).json({ message: 'User already in group' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    conversation.participants.push(userId)
    await conversation.save()
    await conversation.populate('participants', 'name email profileImage')

    res.json(conversation)
  } catch (error) {
    console.error('Error adding participant:', error)
    res.status(500).json({ message: 'Error adding participant' })
  }
})

// Remove participant from group
router.post('/conversations/:conversationId/remove-participant', protect, async (req, res) => {
  try {
    const { conversationId } = req.params
    const { userId } = req.body

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    // Either admin or the user themselves can remove
    if (
      conversation.groupAdmin.toString() !== req.user._id.toString() &&
      userId !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    conversation.participants = conversation.participants.filter((p) => p.toString() !== userId)
    await conversation.save()
    await conversation.populate('participants', 'name email profileImage')

    res.json(conversation)
  } catch (error) {
    console.error('Error removing participant:', error)
    res.status(500).json({ message: 'Error removing participant' })
  }
})

// Leave group
router.post('/conversations/:conversationId/leave', protect, async (req, res) => {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' })
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== req.user._id.toString(),
    )

    // If admin leaves, assign new admin
    if (
      conversation.groupAdmin.toString() === req.user._id.toString() &&
      conversation.participants.length > 0
    ) {
      conversation.groupAdmin = conversation.participants[0]
    }

    await conversation.save()
    await conversation.populate('participants', 'name email profileImage')

    res.json({ message: 'Left group successfully', conversation })
  } catch (error) {
    console.error('Error leaving group:', error)
    res.status(500).json({ message: 'Error leaving group' })
  }
})

// Upload file/image (simple base64 storage for now)
router.post('/upload', protect, async (req, res) => {
  try {
    const { file } = req.body

    if (!file) {
      return res.status(400).json({ message: 'No file provided' })
    }

    // For now, just return the base64 data as URL
    // In production, you would upload to S3, Cloudinary, etc.
    res.json({
      success: true,
      url: file,
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ message: 'Error uploading file' })
  }
})

export default router
