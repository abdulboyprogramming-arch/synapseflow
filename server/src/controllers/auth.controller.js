import asyncHandler from 'express-async-handler'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.model.js'
import Notification from '../models/Notification.model.js'
import { sendEmail } from '../utils/emailService.js'
import { validationResult } from 'express-validator'

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '7d',
  })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400)
    throw new Error(errors.array()[0].msg)
  }

  const { email, password, name, skills, github, linkedin } = req.body

  // Check if user exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    res.status(400)
    throw new Error('User already exists')
  }

  // Create user
  const user = await User.create({
    email,
    password,
    name,
    skills: skills || [],
    github,
    linkedin,
  })

  if (user) {
    // Generate token
    const token = generateToken(user._id)

    // Send welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to SynapseFlow! 🚀',
        template: 'welcome',
        context: {
          name: user.name,
          loginUrl: `${process.env.CLIENT_URL}/login`,
        },
      })
    } catch (error) {
      console.error('Welcome email failed:', error)
    }

    // Create welcome notification
    await Notification.create({
      userId: user._id,
      type: 'system',
      title: 'Welcome to SynapseFlow!',
      message: 'Get started by updating your profile and exploring hackathon projects.',
      actionLink: '/dashboard',
      actionText: 'Go to Dashboard',
    })

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          skills: user.skills,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
    })
  } else {
    res.status(400)
    throw new Error('Invalid user data')
  }
})

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate request
  if (!email || !password) {
    res.status(400)
    throw new Error('Please provide email and password')
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password')
  
  if (!user) {
    res.status(401)
    throw new Error('Invalid credentials')
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(403)
    throw new Error('Account has been deactivated')
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password)
  
  if (!isPasswordMatch) {
    res.status(401)
    throw new Error('Invalid credentials')
  }

  // Update last login
  user.lastLogin = new Date()
  await user.save()

  // Generate token
  const token = generateToken(user._id)

  res.json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        skills: user.skills,
        role: user.role,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
      },
    },
  })
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'projects',
      select: 'title description status createdAt',
      options: { limit: 5, sort: { createdAt: -1 } },
    })
    .populate({
      path: 'teams',
      select: 'name description status',
      options: { limit: 5, sort: { createdAt: -1 } },
    })

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Get unread notifications count
  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    isRead: false,
  })

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        role: user.role,
        isVerified: user.isVerified,
        lookingForTeam: user.lookingForTeam,
        availability: user.availability,
        totalProjects: user.totalProjects,
        totalWins: user.totalWins,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      stats: {
        projects: user.projects || [],
        teams: user.teams || [],
        unreadNotifications: unreadCount,
      },
    },
  })
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    bio,
    skills,
    experienceLevel,
    github,
    linkedin,
    portfolio,
    location,
    availability,
    lookingForTeam,
  } = req.body

  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Update fields
  user.name = name || user.name
  user.bio = bio || user.bio
  user.skills = skills || user.skills
  user.experienceLevel = experienceLevel || user.experienceLevel
  user.github = github || user.github
  user.linkedin = linkedin || user.linkedin
  user.portfolio = portfolio || user.portfolio
  user.location = location || user.location
  user.availability = availability || user.availability
  user.lookingForTeam = lookingForTeam !== undefined ? lookingForTeam : user.lookingForTeam

  await user.save()

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        experienceLevel: user.experienceLevel,
        github: user.github,
        linkedin: user.linkedin,
        portfolio: user.portfolio,
        location: user.location,
        availability: user.availability,
        lookingForTeam: user.lookingForTeam,
      },
    },
  })
})

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    res.status(400)
    throw new Error('Please provide current and new password')
  }

  if (newPassword.length < 8) {
    res.status(400)
    throw new Error('Password must be at least 8 characters')
  }

  const user = await User.findById(req.user._id).select('+password')

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    res.status(401)
    throw new Error('Current password is incorrect')
  }

  // Update password
  user.password = newPassword
  await user.save()

  // Send password change notification email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      template: 'password-changed',
      context: {
        name: user.name,
        timestamp: new Date().toLocaleString(),
      },
    })
  } catch (error) {
    console.error('Password change email failed:', error)
  }

  res.json({
    success: true,
    message: 'Password updated successfully',
  })
})

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) {
    res.status(400)
    throw new Error('Please provide email')
  }

  const user = await User.findOne({ email })

  if (!user) {
    // Don't reveal if user exists or not
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link',
    })
    return
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = Date.now() + 3600000 // 1 hour

  // Save reset token (in a real app, you'd save this to the database)
  // For now, we'll just simulate it
  user.resetPasswordToken = resetToken
  user.resetPasswordExpiry = resetTokenExpiry
  await user.save()

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`

  // Send email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl,
        expiryTime: '1 hour',
      },
    })
  } catch (error) {
    console.error('Password reset email failed:', error)
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    await user.save()
    
    res.status(500)
    throw new Error('Email could not be sent')
  }

  res.json({
    success: true,
    message: 'Password reset email sent',
  })
})

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params
  const { password } = req.body

  if (!password) {
    res.status(400)
    throw new Error('Please provide new password')
  }

  // Find user by reset token
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: Date.now() },
  })

  if (!user) {
    res.status(400)
    throw new Error('Invalid or expired reset token')
  }

  // Update password
  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpiry = undefined
  await user.save()

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful',
      template: 'password-reset-success',
      context: {
        name: user.name,
        timestamp: new Date().toLocaleString(),
      },
    })
  } catch (error) {
    console.error('Password reset confirmation email failed:', error)
  }

  res.json({
    success: true,
    message: 'Password reset successfully',
  })
})

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  // In JWT, we can't invalidate the token, but we can respond with success
  // In production, you might want to use a token blacklist or refresh token pattern
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = asyncHandler(async (req, res) => {
  const { confirmPassword } = req.body

  if (!confirmPassword) {
    res.status(400)
    throw new Error('Please confirm your password')
  }

  const user = await User.findById(req.user._id).select('+password')

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Verify password
  const isMatch = await user.comparePassword(confirmPassword)
  if (!isMatch) {
    res.status(401)
    throw new Error('Password is incorrect')
  }

  // Soft delete: mark as inactive instead of actually deleting
  user.isActive = false
  user.email = `deleted_${Date.now()}_${user.email}`
  await user.save()

  // Send goodbye email
  try {
    await sendEmail({
      to: user.email, // Original email is now modified
      subject: 'Account Deletion Confirmation',
      template: 'account-deleted',
      context: {
        name: user.name,
        deletionDate: new Date().toLocaleDateString(),
      },
    })
  } catch (error) {
    console.error('Account deletion email failed:', error)
  }

  res.json({
    success: true,
    message: 'Account deleted successfully',
  })
})

// @desc    Get user statistics
// @route   GET /api/auth/stats
// @access  Private
export const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  
  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Get additional stats from other models
  const Project = (await import('../models/Project.model.js')).default
  const Team = (await import('../models/Team.model.js')).default
  
  const [projects, teams, submissions] = await Promise.all([
    Project.countDocuments({ 'team.userId': user._id }),
    Team.countDocuments({ 'members.userId': user._id }),
    Project.countDocuments({ 
      'team.userId': user._id,
      status: { $in: ['submitted', 'under_review', 'completed'] }
    }),
  ])

  res.json({
    success: true,
    data: {
      stats: {
        totalProjects: projects,
        totalTeams: teams,
        totalSubmissions: submissions,
        winRate: user.totalProjects > 0 
          ? (user.totalWins / user.totalProjects * 100).toFixed(1) 
          : 0,
        experienceLevel: user.experienceLevel,
        memberSince: user.createdAt,
      },
    },
  })
})
