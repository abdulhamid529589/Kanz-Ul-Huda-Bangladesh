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

async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' })

    if (adminExists) {
      console.log('ℹ️  Admin user already exists')
      console.log('Username:', adminExists.username)
      console.log('Email:', adminExists.email)
      process.exit(0)
    }

    await User.create({
      username: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
      fullName: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@kanzulhuda.com',
      role: 'admin',
      status: 'active',
    })

    console.log('✅ Admin user created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Login Credentials:')
    console.log('   Username:', process.env.DEFAULT_ADMIN_USERNAME || 'admin')
    console.log('   Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  IMPORTANT: Change the admin password after first login!')
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

seedAdmin()
