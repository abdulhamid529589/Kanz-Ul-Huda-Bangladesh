import Settings from '../models/Settings.js'
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

const migrateRegistrationCode = async () => {
  try {
    console.log('Migrating registration code to database...')

    // Get code from environment
    const codeFromEnv = process.env.REGISTRATION_CODE || 'KANZULHUDA2026'
    console.log(`Current code from .env: ${codeFromEnv.substring(0, 3)}***`)

    // Check if registration code already exists in database
    let codeSettings = await Settings.findOne({ key: 'registrationCode' })

    if (codeSettings) {
      console.log('✅ Registration code already in database, skipping migration')
    } else {
      // Create registration code setting
      await Settings.create({
        key: 'registrationCode',
        value: codeFromEnv,
        description: 'Current registration code for new user registrations',
        category: 'general',
        dataType: 'string',
      })
      console.log('✅ Registration code migrated to database')
    }

    // Ensure version tracking exists
    let versionSettings = await Settings.findOne({ key: 'registrationCodeVersion' })

    if (!versionSettings) {
      await Settings.create({
        key: 'registrationCodeVersion',
        value: 1,
        description: 'Current version of registration code',
        category: 'general',
        dataType: 'number',
      })
      console.log('✅ Registration code version initialized')
    }

    console.log('\n✅ Registration code migration completed successfully!')
    console.log('\nNOTE: Future changes to registration code should be done from Admin Settings UI')
    console.log('The .env file can still be used as a fallback, but database takes priority.')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

;(async () => {
  await connectDB()
  await migrateRegistrationCode()
})()
