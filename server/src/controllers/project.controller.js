import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Project from '../models/Project.model.js'
import User from '../models/User.model.js'
import Hackathon from '../models/Hackathon.model.js'
import Notification from '../models/Notification.model.js'
import { validationResult } from 'express-validator'
import { uploadToCloudinary } from '../utils/cloudinary.js'

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
export const getProjects = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    search,
    status,
    difficulty,
    category,
    tags,
    techStack,
    hackathonId,
  } = req.query

  // Build query
  const query = { isPublic: true }

  // Search by title, description, or tags
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ]
  }

  // Filter by status
  if (status) {
    query.status = status
  }

  // Filter by difficulty
  if (difficulty) {
    query.difficulty = difficulty
  }

  // Filter by category
  if (category) {
    query.category = category
  }

  // Filter by tags
  if (tags) {
    query.tags = { $in: tags.split(',') }
  }

  // Filter by tech stack
  if (techStack) {
    query.techStack = { $in: techStack.split(',') }
  }

  // Filter by hackathon
  if (hackathonId) {
    query.hackathonId = hackathonId
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('hackathonId', 'name slug')
      .populate('team.userId', 'name avatar skills')
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

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)
    .populate('hackathonId', 'name slug startDate endDate')
    .populate('team.userId', 'name avatar skills github linkedin bio')
    .populate('judges.judgeId', 'name avatar role')
    .populate('lastUpdatedBy', 'name avatar')

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Increment views
  await project.incrementViews()

  res.json({
    success: true,
    data: { project },
  })
})

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400)
    throw new Error(errors.array()[0].msg)
  }

  const {
    title,
    description,
    problemStatement,
    solution,
    techStack,
    tags,
    repoUrl,
    demoUrl,
    videoUrl,
    hackathonId,
    category,
    difficulty,
  } = req.body

  // Check if hackathon exists and is active
  const hackathon = await Hackathon.findById(hackathonId)
  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  if (!hackathon.isActive()) {
    res.status(400)
    throw new Error('Hackathon is not currently active')
  }

  // Create project
  const project = await Project.create({
    title,
    description,
    problemStatement,
    solution,
    techStack: Array.isArray(techStack) ? techStack : techStack.split(','),
    tags: Array.isArray(tags) ? tags : tags.split(','),
    repoUrl,
    demoUrl,
    videoUrl,
    hackathonId,
    category,
    difficulty,
    team: [{
      userId: req.user._id,
      role: 'Team Lead',
    }],
    teamSize: 1,
    status: 'draft',
    lastUpdatedBy: req.user._id,
  })

  if (!project) {
    res.status(400)
    throw new Error('Invalid project data')
  }

  // Send notifications to team members
  const notificationPromises = project.team.map(async (member) => {
    if (member.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.userId,
        type: 'project_update',
        title: 'New Project Created',
        message: `${req.user.name} has created a new project: ${project.title}`,
        data: {
          projectId: project._id,
          metadata: {
            projectTitle: project.title,
          },
        },
        actionLink: `/projects/${project._id}`,
        actionText: 'View Project',
      })
    }
  })

  await Promise.all(notificationPromises)

  res.status(201).json({
    success: true,
    data: { project },
  })
})

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Team members only)
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to update this project')
  }

  // Update fields
  const updates = req.body
  
  // Handle arrays
  if (updates.techStack && typeof updates.techStack === 'string') {
    updates.techStack = updates.techStack.split(',')
  }
  
  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',')
  }
  
  updates.lastUpdatedBy = req.user._id

  Object.assign(project, updates)
  await project.save()

  // Notify team members about update
  const notificationPromises = project.team.map(async (member) => {
    if (member.userId.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.userId,
        type: 'project_update',
        title: 'Project Updated',
        message: `${req.user.name} has updated project: ${project.title}`,
        data: {
          projectId: project._id,
          metadata: {
            projectTitle: project.title,
          },
        },
        actionLink: `/projects/${project._id}`,
        actionText: 'View Changes',
      })
    }
  })

  await Promise.all(notificationPromises)

  res.json({
    success: true,
    data: { project },
  })
})

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Team leader only)
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team leader
  const isLeader = project.team.some(
    member => member.userId.toString() === req.user._id.toString() && member.role === 'Team Lead'
  )

  if (!isLeader) {
    res.status(403)
    throw new Error('Only team leader can delete the project')
  }

  // Soft delete: change status
  project.status = 'deleted'
  project.isPublic = false
  await project.save()

  // Notify team members
  const notificationPromises = project.team.map(async (member) => {
    await Notification.create({
      userId: member.userId,
      type: 'project_update',
      title: 'Project Deleted',
      message: `Project "${project.title}" has been deleted by the team leader`,
      data: {
        projectId: project._id,
        metadata: {
          projectTitle: project.title,
        },
      },
      priority: 'high',
    })
  })

  await Promise.all(notificationPromises)

  res.json({
    success: true,
    message: 'Project deleted successfully',
  })
})

// @desc    Upload project screenshots
// @route   POST /api/projects/:id/screenshots
// @access  Private (Team members only)
export const uploadScreenshots = asyncHandler(async (req, res) => {
  const { id } = req.params

  if (!req.files || req.files.length === 0) {
    res.status(400)
    throw new Error('Please upload at least one screenshot')
  }

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to upload screenshots for this project')
  }

  // Check maximum screenshots (5)
  if (project.screenshots.length + req.files.length > 5) {
    res.status(400)
    throw new Error('Maximum 5 screenshots allowed')
  }

  // Upload screenshots to Cloudinary
  const uploadPromises = req.files.map(file => 
    uploadToCloudinary(file.buffer, {
      folder: `projects/${id}/screenshots`,
      resource_type: 'image',
    })
  )

  const uploadResults = await Promise.all(uploadPromises)
  const screenshotUrls = uploadResults.map(result => result.secure_url)

  // Add screenshots to project
  project.screenshots = [...project.screenshots, ...screenshotUrls]
  await project.save()

  res.json({
    success: true,
    data: {
      screenshots: project.screenshots,
    },
    message: 'Screenshots uploaded successfully',
  })
})

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private (Team members only)
export const addTeamMember = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId, role } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400)
    throw new Error('Invalid ID format')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to add team members')
  }

  // Check if user exists
  const userToAdd = await User.findById(userId)
  if (!userToAdd) {
    res.status(404)
    throw new Error('User not found')
  }

  // Check if user is already a team member
  if (project.isTeamMember(userId)) {
    res.status(400)
    throw new Error('User is already a team member')
  }

  // Check team size limit
  if (project.team.length >= project.teamSize) {
    res.status(400)
    throw new Error('Team size limit reached')
  }

  // Add user to team
  project.team.push({
    userId,
    role: role || 'Team Member',
  })

  await project.save()

  // Send notification to the new team member
  await Notification.create({
    userId,
    type: 'team_invite',
    title: 'Added to Project Team',
    message: `You have been added to the project "${project.title}" as ${role || 'Team Member'}`,
    data: {
      projectId: project._id,
      metadata: {
        projectTitle: project.title,
        role: role || 'Team Member',
      },
    },
    actionLink: `/projects/${project._id}`,
    actionText: 'View Project',
  })

  res.json({
    success: true,
    data: { project },
    message: 'Team member added successfully',
  })
})

// @desc    Remove team member from project
// @route   DELETE /api/projects/:id/team/:memberId
// @access  Private (Team leader only)
export const removeTeamMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
    res.status(400)
    throw new Error('Invalid ID format')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team leader
  const isLeader = project.team.some(
    member => member.userId.toString() === req.user._id.toString() && member.role === 'Team Lead'
  )

  if (!isLeader) {
    res.status(403)
    throw new Error('Only team leader can remove team members')
  }

  // Check if member exists in team
  const memberIndex = project.team.findIndex(
    member => member.userId.toString() === memberId
  )

  if (memberIndex === -1) {
    res.status(404)
    throw new Error('Team member not found')
  }

  // Cannot remove yourself if you're the only leader
  if (memberId === req.user._id.toString()) {
    const leaders = project.team.filter(member => member.role === 'Team Lead')
    if (leaders.length <= 1) {
      res.status(400)
      throw new Error('Cannot remove the only team leader')
    }
  }

  // Remove member
  const removedMember = project.team.splice(memberIndex, 1)[0]
  await project.save()

  // Send notification to removed member
  await Notification.create({
    userId: memberId,
    type: 'project_update',
    title: 'Removed from Project Team',
    message: `You have been removed from the project "${project.title}"`,
    data: {
      projectId: project._id,
      metadata: {
        projectTitle: project.title,
      },
    },
    priority: 'high',
  })

  res.json({
    success: true,
    message: 'Team member removed successfully',
  })
})

// @desc    Like a project
// @route   POST /api/projects/:id/like
// @access  Private
export const likeProject = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user has already liked (in a real app, you'd track likes per user)
  // For simplicity, we'll just increment the count
  await project.incrementLikes()

  res.json({
    success: true,
    data: {
      likes: project.likes,
    },
    message: 'Project liked successfully',
  })
})

// @desc    Submit project for hackathon
// @route   POST /api/projects/:id/submit
// @access  Private (Team members only)
export const submitProject = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to submit this project')
  }

  // Check project requirements
  if (!project.repoUrl) {
    res.status(400)
    throw new Error('GitHub repository URL is required')
  }

  if (!project.videoUrl) {
    res.status(400)
    throw new Error('Demo video URL is required')
  }

  if (project.screenshots.length === 0) {
    res.status(400)
    throw new Error('At least one screenshot is required')
  }

  // Update project status
  project.status = 'submitted'
  project.submissionDate = new Date()
  await project.save()

  // Notify all team members
  const notificationPromises = project.team.map(async (member) => {
    await Notification.create({
      userId: member.userId,
      type: 'submission_status',
      title: 'Project Submitted!',
      message: `Project "${project.title}" has been successfully submitted for the hackathon`,
      data: {
        projectId: project._id,
        metadata: {
          projectTitle: project.title,
          submissionDate: project.submissionDate,
        },
      },
      actionLink: `/projects/${project._id}`,
      actionText: 'View Submission',
      priority: 'high',
    })
  })

  await Promise.all(notificationPromises)

  res.json({
    success: true,
    data: { project },
    message: 'Project submitted successfully',
  })
})

// @desc    Get project analytics
// @route   GET /api/projects/:id/analytics
// @access  Private (Team members only)
export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(id)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to view analytics for this project')
  }

  // Calculate analytics
  const analytics = {
    views: project.views,
    likes: project.likes,
    engagementRate: project.views > 0 ? ((project.likes / project.views) * 100).toFixed(2) : 0,
    submissionStatus: project.status,
    submissionDate: project.submissionDate,
    teamSize: project.teamSize,
    averageScore: project.averageScore,
    ranking: project.ranking,
    daysSinceSubmission: project.submissionDate
      ? Math.floor((new Date() - project.submissionDate) / (1000 * 60 * 60 * 24))
      : null,
  }

  res.json({
    success: true,
    data: { analytics },
  })
})
