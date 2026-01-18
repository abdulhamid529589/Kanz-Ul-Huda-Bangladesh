import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'durood', 'member', 'submission', 'week', 'notification'],
      default: 'general',
    },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      default: 'string',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
)

export default mongoose.model('Settings', settingsSchema)
