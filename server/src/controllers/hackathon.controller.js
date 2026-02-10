import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Hackathon from '../models/Hackathon.model.js'
import Project from '../models/Project.model.js'
import Team from '../models/Team.model.js'
import User from '../models/User.model.js'

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
export const getHackathons = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    locationType,
    category,
    upcomingOnly = false,
  } = req.query

  // Build query
  const query = { visibility: 'public' }

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tagline: { $regex: search, $options: 'i' } },
    ]
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Filter by location type
  if (locationType) {
    query.locationType = locationType
  }

  // Filter by category
  if (category) {
    query.categories = { $elemMatch: { name: category } }
  }

  // Filter for upcoming only
  if (upcomingOnly === 'true') {
    query.hackathonStart = { $gte: new Date() }
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [hackathons, total] = await Promise.all([
    Hackathon.find(query)
      .select('name tagline description logo banner status hackathonStart hackathonEnd locationType totalRegistrations')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Hackathon.countDocuments(query),
  ])

  // Add virtual fields
  const hackathonsWithVirtuals = hackathons.map(hackathon => ({
    ...hackathon,
    currentStatus: getCurrentStatus(hackathon),
    daysRemaining: getDaysRemaining(hackathon),
  }))

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      hackathons: hackathonsWithVirtuals,
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

// @desc    Get single hackathon
// @route   GET /api/hackathons/:id
// @access  Public
export const getHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const hackathon = await Hackathon.findById(id)
    .populate('createdBy', 'name avatar')
    .populate('lastUpdatedBy', 'name avatar')

  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  // Check if user can view private hackathon
  if (hackathon.visibility === 'private' && !req.user) {
    res.status(403)
    throw new Error('Not authorized to view this hackathon')
  }

  // Get hackathon statistics
  const [projectsCount, teamsCount, participantsCount] = await Promise.all([
    Project.countDocuments({ hackathonId: hackathon._id, isPublic: true }),
    Team.countDocuments({ hackathonId: hackathon._id, isPublic: true }),
    User.countDocuments({ 
      _id: { 
        $in: await Team.distinct('members.userId', { hackathonId: hackathon._id }) 
      } 
    }),
  ])

  // Update hackathon stats
  hackathon.totalProjects = projectsCount
  hackathon.totalTeams = teamsCount
  hackathon.totalRegistrations = participantsCount

  res.json({
    success: true,
    data: {
      hackathon: {
        ...hackathon.toObject(),
        currentStatus: hackathon.currentStatus,
        daysRemaining: hackathon.daysRemaining,
      },
      stats: {
        projects: projectsCount,
        teams: teamsCount,
        participants: participantsCount,
      },
    },
  })
})

// @desc    Get hackathon projects
// @route   GET /api/hackathons/:id/projects
// @access  Public
export const getHackathonProjects = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 12, sort = '-createdAt', category, status } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  // Build query
  const query = {
    hackathonId: id,
    isPublic: true,
  }

  // Filter by category
  if (category) {
    query.category = category
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('team.userId', 'name avatar')
      .select('title description tags techStack status views likes averageScore ranking createdAt')
      .sort(sort)
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

// @desc    Get hackathon teams
// @route   GET /api/hackathons/:id/teams
// @access  Public
export const getHackathonTeams = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { page = 1, limit = 12, lookingForMembers = true } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  // Build query
  const query = {
    hackathonId: id,
    isPublic: true,
    status: 'forming',
  }

  // Filter by looking for members
  if (lookingForMembers === 'true') {
    query.isLookingForMembers = true
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate('members.userId', 'name avatar')
      .populate('createdBy', 'name avatar')
      .select('name description lookingFor requiredSkills maxMembers members createdAt')
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
    availableSlots: team.maxMembers - team.members.filter(m => m.invitationStatus === 'accepted').length,
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

// @desc    Get hackathon leaderboard
// @route   GET /api/hackathons/:id/leaderboard
// @access  Public
export const getHackathonLeaderboard = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { limit = 20 } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const leaderboard = await Project.aggregate([
    {
      $match: {
        hackathonId: new mongoose.Types.ObjectId(id),
        isPublic: true,
        status: { $in: ['submitted', 'under_review', 'completed', 'winner'] },
        averageScore: { $gt: 0 },
      },
    },
    {
      $sort: { averageScore: -1, submissionDate: 1 },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: 'projectId',
        as: 'teamInfo',
      },
    },
    {
      $unwind: { path: '$teamInfo', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        averageScore: 1,
        ranking: 1,
        status: 1,
        teamName: '$teamInfo.name',
        teamMembers: {
          $map: {
            input: '$team',
            as: 'member',
            in: '$$member.userId',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teamMembers',
        foreignField: '_id',
        as: 'teamMembersInfo',
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        averageScore: 1,
        ranking: 1,
        status: 1,
        teamName: 1,
        teamMembers: {
          $map: {
            input: '$teamMembersInfo',
            as: 'member',
            in: {
              name: '$$member.name',
              avatar: '$$member.avatar',
            },
          },
        },
      },
    },
  ])

  // Add ranking if not present
  leaderboard.forEach((project, index) => {
    if (!project.ranking) {
      project.ranking = index + 1
    }
  })

  res.json({
    success: true,
    data: { leaderboard },
  })
})

// @desc    Register for hackathon
// @route   POST /api/hackathons/:id/register
// @access  Private
export const registerForHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const hackathon = await Hackathon.findById(id)

  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  // Check if registration is open
  if (!hackathon.isRegistrationOpen()) {
    res.status(400)
    throw new Error('Registration for this hackathon is not currently open')
  }

  // Check if user is already registered (has a team in this hackathon)
  const existingTeam = await Team.findOne({
    hackathonId: hackathon._id,
    'members.userId': req.user._id,
    'members.invitationStatus': 'accepted',
  })

  if (existingTeam) {
    res.status(400)
    throw new Error('You are already registered for this hackathon')
  }

  // Check if hackathon has participant limit
  if (hackathon.maxParticipants > 0) {
    const currentParticipants = await User.countDocuments({ 
      _id: { 
        $in: await Team.distinct('members.userId', { hackathonId: hackathon._id }) 
      } 
    })
    
    if (currentParticipants >= hackathon.maxParticipants) {
      res.status(400)
      throw new Error('Hackathon has reached maximum participant limit')
    }
  }

  // In a real implementation, you might:
  // 1. Create a registration record
  // 2. Process payment if there's a registration fee
  // 3. Send confirmation email
  // For now, we'll just return success

  res.json({
    success: true,
    message: 'Successfully registered for hackathon',
    data: {
      hackathon: {
        name: hackathon.name,
        hackathonStart: hackathon.hackathonStart,
        hackathonEnd: hackathon.hackathonEnd,
      },
      nextSteps: [
        'Create or join a team',
        'Start working on your project',
        'Submit before the deadline',
      ],
    },
  })
})

// @desc    Get hackathon timeline
// @route   GET /api/hackathons/:id/timeline
// @access  Public
export const getHackathonTimeline = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const hackathon = await Hackathon.findById(id)

  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  const timeline = hackathon.getTimeline().map(event => ({
    ...event,
    status: getEventStatus(event.date),
    daysFromNow: Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24)),
  }))

  res.json({
    success: true,
    data: { timeline },
  })
})

// @desc    Get hackathon resources
// @route   GET /api/hackathons/:id/resources
// @access  Public
export const getHackathonResources = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const hackathon = await Hackathon.findById(id)

  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  // Group resources by type
  const resourcesByType = {
    documentation: hackathon.resources.filter(r => r.type === 'documentation'),
    tutorials: hackathon.resources.filter(r => r.type === 'tutorial'),
    tools: hackathon.resources.filter(r => r.type === 'tool'),
    apis: hackathon.apisAndTools,
    templates: hackathon.resources.filter(r => r.type === 'template'),
  }

  res.json({
    success: true,
    data: {
      resources: resourcesByType,
      techStack: hackathon.techStack,
      categories: hackathon.categories,
    },
  })
})

// Helper functions
const getCurrentStatus = (hackathon) => {
  const now = new Date()
  
  if (now < hackathon.registrationStart) return 'upcoming'
  if (now >= hackathon.registrationStart && now <= hackathon.registrationEnd) return 'registration_open'
  if (now >= hackathon.hackathonStart && now <= hackathon.hackathonEnd) return 'in_progress'
  if (now >= hackathon.judgingStart && now <= hackathon.judgingEnd) return 'judging'
  if (now > hackathon.judgingEnd) return 'completed'
  return 'upcoming'
}

const getDaysRemaining = (hackathon) => {
  const now = new Date()
  let targetDate
  
  if (now < hackathon.registrationStart) {
    targetDate = hackathon.registrationStart
  } else if (now < hackathon.hackathonStart) {
    targetDate = hackathon.hackathonStart
  } else if (now < hackathon.hackathonEnd) {
    targetDate = hackathon.hackathonEnd
  } else {
    return 0
  }
  
  const diffTime = targetDate - now
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getEventStatus = (eventDate) => {
  const now = new Date()
  if (now > eventDate) return 'completed'
  if (now.toDateString() === eventDate.toDateString()) return 'today'
  return 'upcoming'
}
