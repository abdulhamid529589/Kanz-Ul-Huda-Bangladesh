import express from 'express'
import { protect, authorize } from '../middleware/auth.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

router.use(protect)

// Get all users (admin only)
router.get('/', authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, data: users })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update own profile
router.put('/:id', async (req, res) => {
  try {
    // Check if user is updating their own profile or is admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update this profile' })
    }

    const { fullName, email, username, phone } = req.body

    // Check if email already exists (excluding current user)
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } })
      if (existingEmail) {
        return res.status(400).json({ success: false, message: 'Email already in use' })
      }
    }

    // Check if username already exists (excluding current user)
    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: req.params.id } })
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username already in use' })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email, username, phone },
      { new: true, runValidators: true },
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Change password
router.post('/:id/change-password', async (req, res) => {
  try {
    // Check if user is changing their own password
    if (req.user.id !== req.params.id) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to change this password' })
    }

    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide current and new password' })
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: 'New password must be at least 6 characters' })
    }

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)

    await user.save()

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete user (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    await user.deleteOne()
    res.json({ success: true, message: 'User deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create user (admin only)
router.post('/', authorize('admin'), async (req, res) => {
  try {
    const { username, password, fullName, email, role, status } = req.body

    const userExists = await User.findOne({ $or: [{ username }, { email }] })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    const user = await User.create({
      username,
      password,
      fullName,
      email,
      role: role || 'collector',
      status: status || 'active',
      createdBy: req.user.id,
    })

    res.status(201).json({ success: true, data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
