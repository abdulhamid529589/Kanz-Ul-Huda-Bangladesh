import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err)
    process.exit(1)
  })

async function updateMainAdmin() {
  try {
    const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || '').toLowerCase()

    if (!mainAdminEmail) {
      console.error('❌ MAIN_ADMIN_EMAIL not set in .env')
      process.exit(1)
    }

    // Update the admin with the main admin email
    const result = await User.updateOne(
      { email: mainAdminEmail, role: 'admin' },
      { isMainAdmin: true },
    )

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      console.log('⚠️  Admin with email', mainAdminEmail, 'not found')
      console.log('Creating/updating admin...')

      // Check if any admin exists
      const adminExists = await User.findOne({ role: 'admin' })
      if (adminExists) {
        await User.updateOne(
          { _id: adminExists._id },
          {
            email: mainAdminEmail,
            isMainAdmin: true,
          },
        )
        console.log('✅ Updated existing admin to:', mainAdminEmail)
      }
    } else {
      console.log('✅ Updated admin with isMainAdmin: true')
    }

    // Also set all other admins to isMainAdmin: false
    await User.updateMany({ role: 'admin', email: { $ne: mainAdminEmail } }, { isMainAdmin: false })
    console.log('✅ Set all other admins to isMainAdmin: false')

    console.log('')
    console.log('Main Admin Email:', mainAdminEmail)

    process.exit(0)
  } catch (error) {
    console.error('❌ Error updating admin:', error.message)
    process.exit(1)
  }
}

updateMainAdmin()
