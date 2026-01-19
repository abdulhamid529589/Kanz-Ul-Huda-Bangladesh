import mongoose from 'mongoose'

/**
 * AdminUserEmailVerification Schema
 * Tracks email verification for users created by admins
 * Users have 7 days to verify their email before account is deactivated
 */
const adminUserEmailVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    verificationToken: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Default 7 days
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    attempts: {
      type: Number,
      default: 0,
      // Max 5 resend attempts
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// TTL Index - auto-delete expired records after 7 days
adminUserEmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('AdminUserEmailVerification', adminUserEmailVerificationSchema)
