import mongoose from 'mongoose'

const userStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['online', 'away', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    customStatus: {
      type: String,
      default: '',
    },
    isTyping: {
      type: Boolean,
      default: false,
    },
    currentConversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null,
    },
  },
  { timestamps: true },
)

const UserStatus = mongoose.model('UserStatus', userStatusSchema)
export default UserStatus
