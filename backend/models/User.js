import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    role: {
      type: String,
      enum: ['admin', 'collector'],
      default: 'collector',
    },
    isMainAdmin: {
      type: Boolean,
      default: false,
    },
    registrationCodeVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpiry: {
      type: Date,
      default: null,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  } catch (error) {
    throw error
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.model('User', userSchema)
