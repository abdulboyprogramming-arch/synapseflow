import asyncHandler from 'express-async-handler'

// @desc    Check if user has required role(s)
// @param   {...string} roles - Required roles
// @access  Private
export const requireRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401)
      throw new Error('Not authenticated')
    }

    if (!roles.includes(req.user.role)) {
      res.status(403)
      throw new Error(`Required role(s): ${roles.join(', ')}`)
    }

    next()
  })
}

// @desc    Check if user is admin
// @access  Private
export const isAdmin = requireRole('admin')

// @desc    Check if user is judge
// @access  Private
export const isJudge = requireRole('judge', 'admin')

// @desc    Check if user is mentor
// @access  Private
export const isMentor = requireRole('mentor', 'admin')

// @desc    Check if user is participant or higher
// @access  Private
export const isParticipant = requireRole('participant', 'judge', 'mentor', 'admin')

// @desc    Check if user owns resource or has admin role
// @param   {Function} getResourceOwnerId - Function to get resource owner ID from request
// @access  Private
export const isOwnerOrAdmin = (getResourceOwnerId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401)
      throw new Error('Not authenticated')
    }

    // Admins can do anything
    if (req.user.role === 'admin') {
      return next()
    }

    // Get resource owner ID
    const ownerId = getResourceOwnerId(req)
    
    if (!ownerId) {
      res.status(404)
      throw new Error('Resource not found')
    }

    // Check if user is the owner
    if (ownerId.toString() !== req.user._id.toString()) {
      res.status(403)
      throw new Error('Not authorized to access this resource')
    }

    next()
  })
}

// @desc    Check if user is team leader or admin
// @param   {Function} getTeamId - Function to get team ID from request
// @access  Private
export const isTeamLeaderOrAdmin = (getTeamId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401)
      throw new Error('Not authenticated')
    }

    // Admins can do anything
    if (req.user.role === 'admin') {
      return next()
    }

    // Get team ID
    const teamId = getTeamId(req)
    
    if (!teamId) {
      res.status(404)
      throw new Error('Team not found')
    }

    // Import Team model
    const Team = (await import('../models/Team.model.js')).default
    
    // Check if user is team leader
    const team = await Team.findById(teamId)
    
    if (!team) {
      res.status(404)
      throw new Error('Team not found')
    }

    if (!team.isLeader(req.user._id)) {
      res.status(403)
      throw new Error('Only team leader can perform this action')
    }

    next()
  })
}

// @desc    Check if user is team member or admin
// @param   {Function} getTeamId - Function to get team ID from request
// @access  Private
export const isTeamMemberOrAdmin = (getTeamId) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401)
      throw new Error('Not authenticated')
    }

    // Admins can do anything
    if (req.user.role === 'admin') {
      return next()
    }

    // Get team ID
    const teamId = getTeamId(req)
    
    if (!teamId) {
      res.status(404)
      throw new Error('Team not found')
    }

    // Import Team model
    const Team = (await import('../models/Team.model.js')).default
    
    // Check if user is team member
    const team = await Team.findById(teamId)
    
    if (!team) {
      res.status(404)
      throw new Error('Team not found')
    }

    if (!team.isMember(req.user._id)) {
      res.status(403)
      throw new Error('Only team members can perform this action')
    }

    next()
  })
}
