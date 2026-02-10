import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User from '../models/User.model.js'

// @desc    Protect routes - verify JWT token
// @access  Private
export const protect = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from token
      req.user = await User.findById(decoded.userId).select('-password')

      if (!req.user) {
        res.status(401)
        throw new Error('User not found')
      }

      // Check if user is active
      if (!req.user.isActive) {
        res.status(403)
        throw new Error('Account has been deactivated')
      }

      next()
    } catch (error) {
      console.error('Auth middleware error:', error.message)
      
      if (error.name === 'JsonWebTokenError') {
        res.status(401)
        throw new Error('Invalid token')
      } else if (error.name === 'TokenExpiredError') {
        res.status(401)
        throw new Error('Token expired')
      } else {
        res.status(401)
        throw new Error('Not authorized')
      }
    }
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }
})

// @desc    Optional authentication - sets req.user if token exists
// @access  Public (sets user if authenticated)
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.userId).select('-password')
      
      if (req.user && !req.user.isActive) {
        req.user = null // Don't set user if account is deactivated
      }
    } catch (error) {
      // Invalid token - just continue without user
      req.user = null
    }
  }

  next()
})

// @desc    Refresh token middleware
// @access  Private
export const refreshToken = asyncHandler(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.headers['x-refresh-token']

  if (!refreshToken) {
    res.status(401)
    throw new Error('Refresh token required')
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    // Find user and generate new access token
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      res.status(401)
      throw new Error('User not found')
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '15m' }
    )

    // Attach new token to response
    res.setHeader('x-access-token', newAccessToken)
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401)
      throw new Error('Refresh token expired')
    } else {
      res.status(401)
      throw new Error('Invalid refresh token')
    }
  }
})

// @desc    Check if email is verified
// @access  Private
export const verifiedEmail = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401)
    throw new Error('Not authenticated')
  }

  if (!req.user.isVerified) {
    res.status(403)
    throw new Error('Please verify your email address')
  }

  next()
})
