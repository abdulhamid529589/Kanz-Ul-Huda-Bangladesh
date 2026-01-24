import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    isGroup: {
      type: Boolean,
      default: true,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    groupImage: String,
    description: String,
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
    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Archive support
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
)

conversationSchema.index({ participants: 1 })
conversationSchema.index({ groupAdmin: 1 })
conversationSchema.index({ lastMessageAt: -1 })
conversationSchema.index({ isArchived: 1 })

const Conversation = mongoose.model('Conversation', conversationSchema)
export default Conversation
