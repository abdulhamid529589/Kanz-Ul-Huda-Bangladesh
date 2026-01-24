import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    type: {
      type: String,
      enum: ['message', 'group_created', 'member_added', 'member_removed', 'group_info_updated'],
      default: 'message',
    },
    title: String,
    body: String,
    senderName: String,
    groupName: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
