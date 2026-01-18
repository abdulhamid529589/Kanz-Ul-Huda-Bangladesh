import Settings from '../models/Settings.js'
import User from '../models/User.js'
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

const initializeRegistrationCodeVersion = async () => {
  try {
    console.log('Initializing registration code version tracking...')

    // Check if settings already exist
    let settings = await Settings.findOne({ key: 'registrationCodeVersion' })

    if (!settings) {
      // Create new settings record
      settings = await Settings.create({
        key: 'registrationCodeVersion',
        value: 1,
        description: 'Current version of registration code. Increment this when code is changed.',
        category: 'general',
        dataType: 'number',
        version: 1,
      })
      console.log('✅ Created registration code version setting')
    } else {
      console.log(`✅ Registration code version already exists: v${settings.value}`)
    }

    // Update all existing users to have registrationCodeVersion if not set
    const usersUpdated = await User.updateMany(
      { registrationCodeVersion: { $exists: false } },
      { $set: { registrationCodeVersion: 1 } },
    )

    if (usersUpdated.modifiedCount > 0) {
      console.log(`✅ Updated ${usersUpdated.modifiedCount} users with registration code version`)
    } else {
      console.log('✅ All users already have registration code version')
    }

    console.log('\n✅ Registration code version tracking initialized successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

;(async () => {
  await connectDB()
  await initializeRegistrationCodeVersion()
})()
