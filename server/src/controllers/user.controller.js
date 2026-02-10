import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import User from '../models/User.model.js'
import Project from '../models/Project.model.js'
import Team from '../models/Team.model.js'
import { validationResult } from 'express-validator'
import { uploadToCloudinary } from '../utils/cloudinary.js'

// @desc    Get user profile by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid user ID')
  }

  const user = await User.findById(id)
    .select('-password -emailNotifications -pushNotifications -__v')
    .populate({
      path: 'projects',
      match: { isPublic: true },
      select: 'title description status tags techStack createdAt',
      options: { limit: 6, sort: { createdAt: -1 } },
    })
    .populate({
      path: 'teams',
      match: { isPublic: true, status: { $in: ['active', 'forming'] } },
      select: 'name description status maxMembers lookingFor',
      options: { limit: 6, sort: { createdAt: -1 } },
    })

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Get user's project statistics
  const projectStats = await Project.aggregate([
    { $match: { 'team.userId': new mongoose.Types.ObjectId(id), isPublic: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        submitted: {
          $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review', 'completed']] }, 1, 0] }
        },
        wins: {
          $sum: { $cond: [{ $eq: ['$status', 'winner'] }, 1, 0] }
        },
        averageScore: { $avg: '$averageScore' },
      },
    },
  ])

  // Get user's team statistics
  const teamStats = await Team.aggregate([
    { $match: { 'members.userId': new mongoose.Types.ObjectId(id), 'members.invitationStatus': 'accepted' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $in: ['$status', ['forming', 'active']] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
      },
    },
  ])

  const stats = {
    projects: projectStats[0] || { total: 0, submitted: 0, wins: 0, averageScore: 0 },
    teams: teamStats[0] || { total: 0, active: 0, completed: 0 },
  }

  res.json({
    success: true,
    data: {
      user: user.toPublicProfile(),
      stats,
    },
  })
})

// @desc    Get users with filtering
// @route   GET /api/users
// @access  Public
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    search,
    skills,
    experienceLevel,
    lookingForTeam,
    availability,
  } = req.query

  // Build query
  const query = { isActive: true, isVerified: true }

  // Search by name or skills
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { skills: { $in: [new RegExp(search, 'i')] } },
    ]
  }

  // Filter by skills
  if (skills) {
    query.skills = { $in: skills.split(',') }
  }

  // Filter by experience level
  if (experienceLevel) {
    query.experienceLevel = experienceLevel
  }

  // Filter by looking for team
  if (lookingForTeam !== undefined) {
    query.lookingForTeam = lookingForTeam === 'true'
  }

  // Filter by availability
  if (availability) {
    query.availability = availability
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name avatar skills experienceLevel bio lookingForTeam availability createdAt')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ])

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        pages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext,
        hasPrev,
      },
    },
  })
})

// @desc    Update user avatar
// @route   PUT /api/users/avatar
// @access  Private
export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400)
    throw new Error('Please upload an image file')
  }

  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(req.file.buffer, {
    folder: `users/${user._id}/avatars`,
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' },
    ],
  })

  // Update user avatar
  user.avatar = uploadResult.secure_url
  await user.save()

  res.json({
    success: true,
    data: {
      avatar: user.avatar,
    },
    message: 'Avatar updated successfully',
  })
})

// @desc    Get user's projects
// @route   GET /api/users/:id/projects
// @access  Public
export const getUserProjects = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 10, status } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid user ID')
  }

  // Build query
  const query = {
    'team.userId': new mongoose.Types.ObjectId(id),
    isPublic: true,
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('hackathonId', 'name slug')
      .select('title description status tags techStack views likes createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(query),
  ])

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        total,
        pages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext,
        hasPrev,
      },
    },
  })
})

// @desc    Get user's teams
// @route   GET /api/users/:id/teams
// @access  Public
export const getUserTeams = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 10, status } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid user ID')
  }

  // Build query
  const query = {
    'members.userId': new mongoose.Types.ObjectId(id),
    'members.invitationStatus': 'accepted',
    isPublic: true,
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate('hackathonId', 'name slug')
      .populate('members.userId', 'name avatar')
      .select('name description status maxMembers lookingFor createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Team.countDocuments(query),
  ])

  // Add virtual fields
  const teamsWithVirtuals = teams.map(team => ({
    ...team,
    memberCount: team.members.filter(m => m.invitationStatus === 'accepted').length,
  }))

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      teams: teamsWithVirtuals,
      pagination: {
        total,
        pages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext,
        hasPrev,
      },
    },
  })
})

// @desc    Get user's skills recommendations
// @route   GET /api/users/skills/recommendations
// @access  Private
export const getSkillRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('skills experienceLevel')

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Find popular skills from similar users
  const similarUsers = await User.find({
    experienceLevel: user.experienceLevel,
    _id: { $ne: user._id },
    isActive: true,
  })
  .select('skills')
  .limit(50)

  // Count skill frequencies
  const skillFrequency = {}
  similarUsers.forEach(similarUser => {
    similarUser.skills.forEach(skill => {
      if (!user.skills.includes(skill)) {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
      }
    })
  })

  // Get trending skills from recent projects
  const recentProjects = await Project.find({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
  })
  .select('techStack')
  .limit(100)

  const trendingSkills = {}
  recentProjects.forEach(project => {
    project.techStack.forEach(skill => {
      if (!user.skills.includes(skill)) {
        trendingSkills[skill] = (trendingSkills[skill] || 0) + 1
      }
    })
  })

  // Combine recommendations
  const recommendations = [
    ...Object.entries(skillFrequency)
      .map(([skill, frequency]) => ({
        skill,
        frequency,
        type: 'similar_users',
      })),
    ...Object.entries(trendingSkills)
      .map(([skill, frequency]) => ({
        skill,
        frequency,
        type: 'trending',
      })),
  ]

  // Sort by frequency and remove duplicates
  const uniqueRecommendations = {}
  recommendations.forEach(rec => {
    if (!uniqueRecommendations[rec.skill] || rec.frequency > uniqueRecommendations[rec.skill].frequency) {
      uniqueRecommendations[rec.skill] = rec
    }
  })

  const sortedRecommendations = Object.values(uniqueRecommendations)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20)

  // Get learning resources for top recommendations
  const topSkills = sortedRecommendations.slice(0, 5).map(rec => rec.skill)
  const learningResources = topSkills.map(skill => ({
    skill,
    resources: getLearningResources(skill),
  }))

  res.json({
    success: true,
    data: {
      currentSkills: user.skills,
      recommendations: sortedRecommendations,
      learningResources,
    },
  })
})

// @desc    Search users by skills
// @route   GET /api/users/search/skills
// @access  Public
export const searchUsersBySkills = asyncHandler(async (req, res) => {
  const { skills, excludeUserId } = req.query

  if (!skills) {
    res.status(400)
    throw new Error('Skills parameter is required')
  }

  const skillsArray = skills.split(',').map(skill => skill.trim())

  // Build query
  const query = {
    skills: { $in: skillsArray },
    isActive: true,
    lookingForTeam: true,
  }

  // Exclude specific user if provided
  if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) }
  }

  const users = await User.find(query)
    .select('name avatar skills experienceLevel bio availability')
    .limit(20)
    .lean()

  // Calculate match score for each user
  const usersWithMatchScore = users.map(user => {
    const matchingSkills = user.skills.filter(skill => 
      skillsArray.includes(skill)
    ).length
    
    const matchScore = skillsArray.length > 0
      ? (matchingSkills / skillsArray.length) * 100
      : 0

    return {
      ...user,
      matchScore: Math.round(matchScore),
      matchingSkills,
    }
  })

  // Sort by match score
  usersWithMatchScore.sort((a, b) => b.matchScore - a.matchScore)

  res.json({
    success: true,
    data: {
      users: usersWithMatchScore,
      requestedSkills: skillsArray,
    },
  })
})

// Helper function to get learning resources for a skill
const getLearningResources = (skill) => {
  const resources = {
    'React': [
      { name: 'React Documentation', url: 'https://reactjs.org/docs/getting-started.html', type: 'documentation' },
      { name: 'FreeCodeCamp React Course', url: 'https://www.freecodecamp.org/learn/front-end-libraries/react/', type: 'course' },
    ],
    'Node.js': [
      { name: 'Node.js Documentation', url: 'https://nodejs.org/en/docs/', type: 'documentation' },
      { name: 'The Net Ninja Node.js Course', url: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gcy9lrvMJ75z9maRw4byYp', type: 'course' },
    ],
    'Python': [
      { name: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'documentation' },
      { name: 'Automate the Boring Stuff', url: 'https://automatetheboringstuff.com/', type: 'book' },
    ],
    'TypeScript': [
      { name: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'documentation' },
      { name: 'TypeScript for Beginners', url: 'https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html', type: 'tutorial' },
    ],
    'UI/UX Design': [
      { name: 'Figma Learn', url: 'https://www.figma.com/learn/', type: 'course' },
      { name: 'Refactoring UI', url: 'https://www.refactoringui.com/', type: 'book' },
    ],
  }

  return resources[skill] || [
    { name: 'Search on YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}+tutorial`, type: 'video' },
    { name: 'Search on Udemy', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}`, type: 'course' },
  ]
}
