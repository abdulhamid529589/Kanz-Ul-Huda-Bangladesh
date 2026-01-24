import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrls: [
      {
        type: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: Date,
      },
    ],
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    editedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
    reactions: [
      {
        emoji: String,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: Date,
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    forwardedFrom: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
      conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
      },
      originalSender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    // Voice message support
    voiceUrl: {
      type: String,
      default: null,
    },
    voiceDuration: {
      type: Number,
      default: null,
    },
    // Mentions system
    mentions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        username: String,
        notified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Message scheduling
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    isScheduledSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

// Indexes for fast querying
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1 })
messageSchema.index({ isScheduled: 1, scheduledFor: 1 })
messageSchema.index({ 'mentions.userId': 1 })
messageSchema.index({ content: 'text' })

const Message = mongoose.model('Message', messageSchema)
export default Message
