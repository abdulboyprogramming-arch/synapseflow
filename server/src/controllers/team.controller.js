import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Team from '../models/Team.model.js'
import User from '../models/User.model.js'
import Hackathon from '../models/Hackathon.model.js'
import Notification from '../models/Notification.model.js'
import { validationResult } from 'express-validator'

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
export const getTeams = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    lookingFor,
    hackathonId,
    category,
    isPublic = true,
  } = req.query

  // Build query
  const query = { isPublic: isPublic === 'true' }

  // Search by name or description
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Filter by looking for skills
  if (lookingFor) {
    query.lookingFor = { $in: lookingFor.split(',') }
  }

  // Filter by hackathon
  if (hackathonId) {
    query.hackathonId = hackathonId
  }

  // Filter by category
  if (category) {
    query.category = category
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate('hackathonId', 'name slug')
      .populate('members.userId', 'name avatar skills')
      .populate('createdBy', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Team.countDocuments(query),
  ])

  // Add virtual fields to each team
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

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
export const getTeam = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)
    .populate('hackathonId', 'name slug description startDate endDate')
    .populate('members.userId', 'name avatar skills experienceLevel github linkedin')
    .populate('createdBy', 'name avatar')
    .populate('projectId', 'title description status')

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user can view private team
  if (!team.isPublic && !team.isMember(req.user?._id)) {
    res.status(403)
    throw new Error('Not authorized to view this team')
  }

  res.json({
    success: true,
    data: { team },
  })
})

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
export const createTeam = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400)
    throw new Error(errors.array()[0].msg)
  }

  const {
    name,
    description,
    hackathonId,
    category,
    maxMembers,
    lookingFor,
    requiredSkills,
    commitmentLevel,
    availability,
    timezone,
    isPublic,
  } = req.body

  // Check if hackathon exists
  const hackathon = await Hackathon.findById(hackathonId)
  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  // Check if hackathon is active for registration
  if (!hackathon.isRegistrationOpen()) {
    res.status(400)
    throw new Error('Hackathon registration is not currently open')
  }

  // Create team
  const team = await Team.create({
    name,
    description,
    hackathonId,
    category,
    maxMembers: maxMembers || 4,
    lookingFor: lookingFor ? (Array.isArray(lookingFor) ? lookingFor : lookingFor.split(',')) : [],
    requiredSkills: requiredSkills ? (Array.isArray(requiredSkills) ? requiredSkills : requiredSkills.split(',')) : [],
    commitmentLevel: commitmentLevel || 'serious',
    availability: availability || 'flexible',
    timezone: timezone || 'UTC',
    isPublic: isPublic !== false,
    members: [{
      userId: req.user._id,
      role: 'Team Leader',
      isLeader: true,
      invitationStatus: 'accepted',
    }],
    status: 'forming',
    createdBy: req.user._id,
  })

  if (!team) {
    res.status(400)
    throw new Error('Invalid team data')
  }

  res.status(201).json({
    success: true,
    data: { team },
  })
})

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team leader only)
export const updateTeam = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user is team leader
  if (!team.isLeader(req.user._id)) {
    res.status(403)
    throw new Error('Only team leader can update the team')
  }

  // Update fields
  const updates = req.body
  
  // Handle arrays
  if (updates.lookingFor && typeof updates.lookingFor === 'string') {
    updates.lookingFor = updates.lookingFor.split(',')
  }
  
  if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
    updates.requiredSkills = updates.requiredSkills.split(',')
  }

  Object.assign(team, updates)
  await team.save()

  // Notify team members about update
  const notificationPromises = team.members
    .filter(member => 
      member.invitationStatus === 'accepted' && 
      member.userId.toString() !== req.user._id.toString()
    )
    .map(async (member) => {
      await Notification.create({
        userId: member.userId,
        type: 'project_update',
        title: 'Team Updated',
        message: `${req.user.name} has updated team "${team.name}"`,
        data: {
          teamId: team._id,
          metadata: {
            teamName: team.name,
          },
        },
        actionLink: `/teams/${team._id}`,
        actionText: 'View Team',
      })
    })

  await Promise.all(notificationPromises)

  res.json({
    success: true,
    data: { team },
  })
})

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Team leader only)
export const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user is team leader
  if (!team.isLeader(req.user._id)) {
    res.status(403)
    throw new Error('Only team leader can delete the team')
  }

  // Soft delete: change status
  team.status = 'disbanded'
  team.isPublic = false
  await team.save()

  // Notify team members
  const notificationPromises = team.members
    .filter(member => member.invitationStatus === 'accepted')
    .map(async (member) => {
      await Notification.create({
        userId: member.userId,
        type: 'project_update',
        title: 'Team Disbanded',
        message: `Team "${team.name}" has been disbanded by the team leader`,
        data: {
          teamId: team._id,
          metadata: {
            teamName: team.name,
          },
        },
        priority: 'high',
      })
    })

  await Promise.all(notificationPromises)

  res.json({
    success: true,
    message: 'Team disbanded successfully',
  })
})

// @desc    Invite user to team
// @route   POST /api/teams/:id/invite
// @access  Private (Team members only)
export const inviteToTeam = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId, role } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400)
    throw new Error('Invalid ID format')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user is team member
  if (!team.isMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to invite users to this team')
  }

  // Check if team is full
  if (team.isFull()) {
    res.status(400)
    throw new Error('Team is full')
  }

  // Check if user exists
  const userToInvite = await User.findById(userId)
  if (!userToInvite) {
    res.status(404)
    throw new Error('User not found')
  }

  // Check if user is already invited or a member
  const existingInvitation = team.members.find(
    member => member.userId.toString() === userId
  )

  if (existingInvitation) {
    if (existingInvitation.invitationStatus === 'pending') {
      res.status(400)
      throw new Error('User already has a pending invitation')
    }
    if (existingInvitation.invitationStatus === 'accepted') {
      res.status(400)
      throw new Error('User is already a team member')
    }
  }

  // Send invitation
  await team.inviteMember(userId, role || 'Team Member')

  // Send notification to invited user
  await Notification.createTeamInvite(
    userId,
    team._id,
    req.user._id,
    team.name
  )

  res.json({
    success: true,
    message: 'Invitation sent successfully',
  })
})

// @desc    Respond to team invitation
// @route   POST /api/teams/:id/respond-invitation
// @access  Private
export const respondToInvitation = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { accept } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Find user's invitation
  const memberIndex = team.members.findIndex(
    member => 
      member.userId.toString() === req.user._id.toString() &&
      member.invitationStatus === 'pending'
  )

  if (memberIndex === -1) {
    res.status(404)
    throw new Error('No pending invitation found')
  }

  // Update invitation status
  team.members[memberIndex].invitationStatus = accept ? 'accepted' : 'rejected'
  
  if (accept) {
    team.members[memberIndex].joinedAt = new Date()
  }

  await team.save()

  // Send notification to team leader
  const teamLeader = team.members.find(member => member.isLeader)
  if (teamLeader) {
    await Notification.create({
      userId: teamLeader.userId,
      type: accept ? 'team_acceptance' : 'team_rejection',
      title: accept ? 'Invitation Accepted' : 'Invitation Declined',
      message: `${req.user.name} has ${accept ? 'accepted' : 'declined'} your invitation to join "${team.name}"`,
      data: {
        teamId: team._id,
        userId: req.user._id,
        metadata: {
          teamName: team.name,
          userName: req.user.name,
        },
      },
      actionLink: `/teams/${team._id}`,
      actionText: 'View Team',
    })
  }

  res.json({
    success: true,
    message: accept ? 'Invitation accepted successfully' : 'Invitation declined',
  })
})

// @desc    Request to join team
// @route   POST /api/teams/:id/join-request
// @access  Private
export const requestToJoin = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { message } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if team is public and looking for members
  if (!team.isPublic || !team.isLookingForMembers) {
    res.status(400)
    throw new Error('Team is not accepting new members')
  }

  // Check if team is full
  if (team.isFull()) {
    res.status(400)
    throw new Error('Team is full')
  }

  // Check if user is already a member or has pending invitation
  const existingMember = team.members.find(
    member => member.userId.toString() === req.user._id.toString()
  )

  if (existingMember) {
    if (existingMember.invitationStatus === 'pending') {
      res.status(400)
      throw new Error('You already have a pending invitation')
    }
    if (existingMember.invitationStatus === 'accepted') {
      res.status(400)
      throw new Error('You are already a team member')
    }
  }

  // Create join request (add as pending member)
  team.members.push({
    userId: req.user._id,
    role: 'Requested',
    isLeader: false,
    invitationStatus: 'pending',
  })

  await team.save()

  // Send notification to team leader
  const teamLeader = team.members.find(member => member.isLeader)
  if (teamLeader) {
    await Notification.create({
      userId: teamLeader.userId,
      type: 'team_join_request',
      title: 'New Join Request',
      message: `${req.user.name} wants to join "${team.name}"${message ? `: ${message}` : ''}`,
      data: {
        teamId: team._id,
        userId: req.user._id,
        metadata: {
          teamName: team.name,
          userName: req.user.name,
          message,
        },
      },
      actionLink: `/teams/${team._id}/requests`,
      actionText: 'View Request',
      priority: 'high',
    })
  }

  res.json({
    success: true,
    message: 'Join request sent successfully',
  })
})

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Team leader only)
export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
    res.status(400)
    throw new Error('Invalid ID format')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user is team leader
  if (!team.isLeader(req.user._id)) {
    res.status(403)
    throw new Error('Only team leader can remove team members')
  }

  // Cannot remove yourself if you're the only leader
  if (memberId === req.user._id.toString()) {
    const leaders = team.members.filter(member => member.isLeader && member.invitationStatus === 'accepted')
    if (leaders.length <= 1) {
      res.status(400)
      throw new Error('Cannot remove the only team leader')
    }
  }

  // Remove member
  await team.removeMember(memberId)

  // Send notification to removed member
  await Notification.create({
    userId: memberId,
    type: 'project_update',
    title: 'Removed from Team',
    message: `You have been removed from the team "${team.name}"`,
    data: {
      teamId: team._id,
      metadata: {
        teamName: team.name,
      },
    },
    priority: 'high',
  })

  res.json({
    success: true,
    message: 'Team member removed successfully',
  })
})

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
export const leaveTeam = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid team ID')
  }

  const team = await Team.findById(id)

  if (!team) {
    res.status(404)
    throw new Error('Team not found')
  }

  // Check if user is team member
  if (!team.isMember(req.user._id)) {
    res.status(400)
    throw new Error('You are not a member of this team')
  }

  // Check if user is the only leader
  const leaders = team.members.filter(
    member => member.isLeader && member.invitationStatus === 'accepted'
  )
  
  const isLeader = team.members.some(
    member => 
      member.userId.toString() === req.user._id.toString() && 
      member.isLeader
  )

  if (isLeader && leaders.length <= 1) {
    res.status(400)
    throw new Error('Cannot leave as the only team leader. Promote another leader first.')
  }

  // Remove user from team
  await team.removeMember(req.user._id)

  // Send notification to team leader (if not self)
  const teamLeader = team.members.find(member => member.isLeader && member.invitationStatus === 'accepted')
  if (teamLeader && teamLeader.userId.toString() !== req.user._id.toString()) {
    await Notification.create({
      userId: teamLeader.userId,
      type: 'project_update',
      title: 'Team Member Left',
      message: `${req.user.name} has left the team "${team.name}"`,
      data: {
        teamId: team._id,
        userId: req.user._id,
        metadata: {
          teamName: team.name,
          userName: req.user.name,
        },
      },
      actionLink: `/teams/${team._id}`,
      actionText: 'View Team',
    })
  }

  res.json({
    success: true,
    message: 'Successfully left the team',
  })
})

// @desc    Get team recommendations for user
// @route   GET /api/teams/recommendations
// @access  Private
export const getTeamRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  
  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // Find teams that match user's skills and interests
  const recommendations = await Team.find({
    isPublic: true,
    isLookingForMembers: true,
    status: 'forming',
    $or: [
      { lookingFor: { $in: user.skills } },
      { requiredSkills: { $in: user.skills } },
    ],
    'members.userId': { $ne: req.user._id }, // Not already a member
  })
  .populate('hackathonId', 'name slug')
  .populate('createdBy', 'name avatar')
  .limit(10)
  .lean()

  // Calculate match score for each team
  const recommendationsWithScore = recommendations.map(team => {
    const skillMatch = team.lookingFor.filter(skill => 
      user.skills.includes(skill)
    ).length
    
    const matchScore = team.lookingFor.length > 0
      ? (skillMatch / team.lookingFor.length) * 100
      : 0

    return {
      ...team,
      matchScore: Math.round(matchScore),
      availableSlots: team.maxMembers - team.members.filter(m => m.invitationStatus === 'accepted').length,
    }
  })

  // Sort by match score
  recommendationsWithScore.sort((a, b) => b.matchScore - a.matchScore)

  res.json({
    success: true,
    data: { recommendations: recommendationsWithScore },
  })
})
