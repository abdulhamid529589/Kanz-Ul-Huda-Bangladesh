import User from '../models/User.js'
import { MAIN_ADMIN_EMAIL } from '../constants.js'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/kanz_ul_huda_durood'

  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }
}

const setMainAdmin = async () => {
  try {
    console.log(`Setting main admin for email: ${MAIN_ADMIN_EMAIL}`)

    // Find user with main admin email
    const user = await User.findOne({ email: MAIN_ADMIN_EMAIL })

    if (!user) {
      console.log(`⚠️  User with email ${MAIN_ADMIN_EMAIL} not found`)
      console.log('Please create this user first.')
      process.exit(1)
    }

    // Reset all other users to not be main admin
    await User.updateMany({ email: { $ne: MAIN_ADMIN_EMAIL } }, { isMainAdmin: false })

    // Set this user as main admin and admin role
    user.isMainAdmin = true
    user.role = 'admin'
    await user.save()

    console.log(`✅ Successfully set ${MAIN_ADMIN_EMAIL} as main admin`)
    console.log(`User details:`)
    console.log(`  - Username: ${user.username}`)
    console.log(`  - Full Name: ${user.fullName}`)
    console.log(`  - Email: ${user.email}`)
    console.log(`  - Role: ${user.role}`)
    console.log(`  - Is Main Admin: ${user.isMainAdmin}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

;(async () => {
  await connectDB()
  await setMainAdmin()
})()
