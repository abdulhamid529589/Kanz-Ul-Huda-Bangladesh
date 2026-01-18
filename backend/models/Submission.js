import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member is required'],
    },
    weekStartDate: {
      type: Date,
      required: [true, 'Week start date is required'],
    },
    weekEndDate: {
      type: Date,
      required: [true, 'Week end date is required'],
    },
    duroodCount: {
      type: Number,
      required: [true, 'Durood count is required'],
      min: [1, 'Durood count must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Durood count must be a whole number',
      },
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by is required'],
    },
    submissionDateTime: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate submissions for same member in same week
submissionSchema.index({ member: 1, weekStartDate: 1 }, { unique: true })

// Indexes for faster queries
submissionSchema.index({ weekStartDate: 1, weekEndDate: 1 })
submissionSchema.index({ submittedBy: 1 })
submissionSchema.index({ submissionDateTime: -1 })

// Pre-save middleware to update member's last submission date and lifetime total
submissionSchema.post('save', async function () {
  const Member = mongoose.model('Member')
  const member = await Member.findById(this.member)

  if (member) {
    member.lastSubmissionDate = this.submissionDateTime
    await member.updateLifetimeDurood()
  }
})

// Post-update middleware
submissionSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const Member = mongoose.model('Member')
    const member = await Member.findById(doc.member)
    if (member) {
      await member.updateLifetimeDurood()
    }
  }
})

// Post-delete middleware
submissionSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Member = mongoose.model('Member')
    const member = await Member.findById(doc.member)
    if (member) {
      await member.updateLifetimeDurood()
    }
  }
})

export default mongoose.model('Submission', submissionSchema)
