import mongoose from 'mongoose'
import crypto from 'crypto'

const passwordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    resetToken: {
      type: String,
      required: true,
      unique: true,
    },
    resetTokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Method to generate reset token
passwordResetSchema.statics.generateResetToken = async function (email) {
  // Generate a unique token
  const token = crypto.randomBytes(32).toString('hex')

  // Hash the token for storage
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  // Delete any existing reset tokens for this email
  await this.deleteMany({ email: email.toLowerCase() })

  // Create new reset record
  const resetRecord = await this.create({
    email: email.toLowerCase(),
    resetToken: token,
    resetTokenHash: tokenHash,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes validity
  })

  return token
}

// Method to verify reset token
passwordResetSchema.statics.verifyResetToken = async function (email, token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const resetRecord = await this.findOne({
    email: email.toLowerCase(),
    resetTokenHash: tokenHash,
  })

  if (!resetRecord) {
    return { valid: false, message: 'Invalid reset token' }
  }

  // Check if token is expired
  if (new Date() > resetRecord.expiresAt) {
    await this.deleteOne({ _id: resetRecord._id })
    return { valid: false, message: 'Reset token has expired' }
  }

  // Check if token is already used
  if (resetRecord.isUsed) {
    return { valid: false, message: 'This reset token has already been used' }
  }

  // Check attempts
  if (resetRecord.attempts >= 5) {
    await this.deleteOne({ _id: resetRecord._id })
    return { valid: false, message: 'Too many reset attempts. Please request a new reset link.' }
  }

  return { valid: true, resetRecord }
}

export default mongoose.model('PasswordReset', passwordResetSchema)
