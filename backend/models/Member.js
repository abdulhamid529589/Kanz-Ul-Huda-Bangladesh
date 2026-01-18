import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [
        /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
        'Please enter a valid phone number',
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    category: {
      type: String,
      enum: ['VIP', 'Regular', 'Prospect', 'Inactive'],
      default: 'Regular',
    },
    memberSince: {
      type: Date,
      default: Date.now,
    },
    lastSubmissionDate: {
      type: Date,
    },
    totalLifetimeDurood: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
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

// Indexes for faster queries
memberSchema.index({ fullName: 'text', phoneNumber: 'text' })
memberSchema.index({ status: 1 })
memberSchema.index({ category: 1 })
memberSchema.index({ country: 1 })
memberSchema.index({ lastSubmissionDate: -1 })

// Virtual for submission count
memberSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'member',
})

// Calculate total submissions when needed
memberSchema.methods.updateLifetimeDurood = async function () {
  const Submission = mongoose.model('Submission')
  const result = await Submission.aggregate([
    { $match: { member: this._id } },
    { $group: { _id: null, total: { $sum: '$duroodCount' } } },
  ])

  this.totalLifetimeDurood = result.length > 0 ? result[0].total : 0
  await this.save()
  return this.totalLifetimeDurood
}

export default mongoose.model('Member', memberSchema)
