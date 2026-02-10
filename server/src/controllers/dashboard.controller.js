import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Project from '../models/Project.model.js'
import Team from '../models/Team.model.js'
import Notification from '../models/Notification.model.js'
import Hackathon from '../models/Hackathon.model.js'
import Submission from '../models/Submission.model.js'

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Get user's active projects
  const projects = await Project.find({
    'team.userId': userId,
    status: { $in: ['draft', 'in_progress', 'submitted'] },
  })
  .populate('hackathonId', 'name')
  .select('title description status teamSize createdAt')
  .limit(5)
  .sort({ createdAt: -1 })

  // Get user's teams
  const teams = await Team.find({
    'members.userId': userId,
    'members.invitationStatus': 'accepted',
    status: { $in: ['forming', 'active'] },
  })
  .populate('hackathonId', 'name')
  .select('name description status maxMembers members lookingFor')
  .limit(5)
  .sort({ createdAt: -1 })

  // Get notifications
  const notifications = await Notification.find({
    userId,
    isRead: false,
  })
  .select('type title message createdAt')
  .limit(10)
  .sort({ createdAt: -1 })

  // Get active hackathons
  const activeHackathons = await Hackathon.find({
    status: { $in: ['registration_open', 'in_progress'] },
  })
  .select('name tagline startDate endDate locationType')
  .limit(3)
  .sort({ startDate: 1 })

  // Get upcoming deadlines
  const upcomingDeadlines = await Hackathon.find({
    $or: [
      { registrationEnd: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      { hackathonEnd: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
    ],
  })
  .select('name registrationEnd hackathonEnd')
  .limit(5)

  // Calculate stats
  const projectStats = await Project.aggregate([
    { $match: { 'team.userId': new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        submitted: {
          $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_review', 'completed']] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
      },
    },
  ])

  const teamStats = await Team.aggregate([
    { $match: { 'members.userId': new mongoose.Types.ObjectId(userId), 'members.invitationStatus': 'accepted' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $in: ['$status', ['forming', 'active']] }, 1, 0] }
        },
      },
    },
  ])

  const stats = {
    projects: projectStats[0] || { total: 0, submitted: 0, inProgress: 0 },
    teams: teamStats[0] || { total: 0, active: 0 },
    notifications: notifications.length,
  }

  res.json({
    success: true,
    data: {
      stats,
      projects,
      teams,
      notifications,
      activeHackathons,
      upcomingDeadlines,
    },
  })
})

// @desc    Get user activity feed
// @route   GET /api/dashboard/activity
// @access  Private
export const getActivityFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const userId = req.user._id
  const skip = (page - 1) * limit

  // Get notifications and convert to activity feed format
  const [activities, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId }),
  ])

  // Format activities
  const formattedActivities = activities.map(activity => ({
    id: activity._id,
    type: activity.type,
    title: activity.title,
    description: activity.message,
    time: activity.createdAt,
    read: activity.isRead,
    data: activity.data,
    action: activity.actionLink ? {
      link: activity.actionLink,
      text: activity.actionText,
    } : null,
  }))

  res.json({
    success: true,
    data: {
      activities: formattedActivities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext: page * limit < total,
      },
    },
  })
})

// @desc    Mark notification as read
// @route   PUT /api/dashboard/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user._id

  const notification = await Notification.findOne({
    _id: id,
    userId,
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  await notification.markAsRead()

  res.json({
    success: true,
    message: 'Notification marked as read',
  })
})

// @desc    Mark all notifications as read
// @route   PUT /api/dashboard/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id

  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  )

  res.json({
    success: true,
    message: 'All notifications marked as read',
  })
})

// @desc    Get submission checklist
// @route   GET /api/dashboard/checklist/:projectId
// @access  Private
export const getSubmissionChecklist = asyncHandler(async (req, res) => {
  const { projectId } = req.params
  const userId = req.user._id

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400)
    throw new Error('Invalid project ID')
  }

  const project = await Project.findById(projectId)

  if (!project) {
    res.status(404)
    throw new Error('Project not found')
  }

  // Check if user is team member
  if (!project.isTeamMember(userId)) {
    res.status(403)
    throw new Error('Not authorized to view this project')
  }

  // Get submission requirements from hackathon
  const hackathon = await Hackathon.findById(project.hackathonId)
  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  // Build checklist based on project and hackathon requirements
  const checklist = [
    {
      id: 'project_basics',
      title: 'Project Basics',
      items: [
        {
          id: 'title',
          label: 'Project Title',
          completed: !!project.title,
          required: true,
        },
        {
          id: 'description',
          label: 'Project Description',
          completed: !!project.description && project.description.length >= 50,
          required: true,
        },
        {
          id: 'problem_solution',
          label: 'Problem & Solution',
          completed: !!project.problemStatement && !!project.solution,
          required: true,
        },
      ],
    },
    {
      id: 'technical',
      title: 'Technical Requirements',
      items: [
        {
          id: 'github_repo',
          label: 'GitHub Repository',
          completed: !!project.repoUrl,
          required: true,
          value: project.repoUrl,
        },
        {
          id: 'tech_stack',
          label: 'Technology Stack',
          completed: project.techStack && project.techStack.length > 0,
          required: true,
          value: project.techStack?.length || 0,
        },
        {
          id: 'tags',
          label: 'Project Tags',
          completed: project.tags && project.tags.length > 0,
          required: true,
          value: project.tags?.length || 0,
        },
      ],
    },
    {
      id: 'media',
      title: 'Media & Documentation',
      items: [
        {
          id: 'demo_video',
          label: '2-3 Minute Demo Video',
          completed: !!project.videoUrl,
          required: true,
          value: project.videoUrl,
        },
        {
          id: 'screenshots',
          label: 'Project Screenshots',
          completed: project.screenshots && project.screenshots.length > 0,
          required: true,
          value: project.screenshots?.length || 0,
          minRequired: 1,
        },
        {
          id: 'live_demo',
          label: 'Live Demo URL (Optional)',
          completed: !!project.demoUrl,
          required: false,
          value: project.demoUrl,
        },
      ],
    },
    {
      id: 'team',
      title: 'Team Information',
      items: [
        {
          id: 'team_members',
          label: 'Team Members',
          completed: project.team && project.team.length > 0,
          required: true,
          value: project.team?.length || 0,
        },
        {
          id: 'team_roles',
          label: 'Clear Roles & Responsibilities',
          completed: project.team && project.team.every(member => member.role),
          required: true,
        },
      ],
    },
    {
      id: 'hackathon',
      title: 'Hackathon Requirements',
      items: hackathon.submissionRequirements.map((req, index) => ({
        id: `hackathon_req_${index}`,
        label: req,
        completed: true, // Assume completed for now
        required: true,
      })),
    },
  ]

  // Calculate completion percentage
  const totalItems = checklist.flatMap(section => section.items).length
  const completedItems = checklist
    .flatMap(section => section.items)
    .filter(item => item.completed).length
  
  const completionPercentage = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100)
    : 0

  res.json({
    success: true,
    data: {
      checklist,
      stats: {
        totalItems,
        completedItems,
        completionPercentage,
        canSubmit: completionPercentage >= 90, // Allow submission at 90% completion
        projectStatus: project.status,
        submissionDeadline: hackathon.hackathonEnd,
      },
    },
  })
})

// @desc    Get user's project timeline
// @route   GET /api/dashboard/timeline
// @access  Private
export const getProjectTimeline = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Get user's projects with submissions
  const projects = await Project.find({
    'team.userId': userId,
    status: { $in: ['submitted', 'under_review', 'completed', 'winner'] },
  })
  .populate('hackathonId', 'name startDate endDate')
  .select('title status submissionDate averageScore ranking')
  .sort({ submissionDate: -1 })

  // Format timeline events
  const timeline = projects.flatMap(project => {
    const events = []

    // Project creation
    events.push({
      id: `${project._id}_created`,
      type: 'project_created',
      title: 'Project Created',
      description: `Started working on "${project.title}"`,
      date: project.createdAt,
      project: project.title,
      projectId: project._id,
    })

    // Project submission
    if (project.submissionDate) {
      events.push({
        id: `${project._id}_submitted`,
        type: 'project_submitted',
        title: 'Project Submitted',
        description: `Submitted "${project.title}" for judging`,
        date: project.submissionDate,
        project: project.title,
        projectId: project._id,
      })
    }

    // Judging results
    if (project.averageScore > 0) {
      events.push({
        id: `${project._id}_judged`,
        type: 'project_judged',
        title: 'Judging Completed',
        description: `Received score: ${project.averageScore.toFixed(1)}/10`,
        date: project.updatedAt,
        project: project.title,
        projectId: project._id,
        score: project.averageScore,
      })
    }

    // Ranking/winning
    if (project.ranking) {
      events.push({
        id: `${project._id}_ranked`,
        type: 'project_ranked',
        title: 'Final Ranking',
        description: `Placed ${project.ranking}${this.getOrdinal(project.ranking)}`,
        date: project.updatedAt,
        project: project.title,
        projectId: project._id,
        ranking: project.ranking,
      })
    }

    return events
  })

  // Sort by date
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date))

  res.json({
    success: true,
    data: { timeline },
  })
})

// @desc    Get quick stats for dashboard widgets
// @route   GET /api/dashboard/quick-stats
// @access  Private
export const getQuickStats = asyncHandler(async (req, res) => {
  const userId = req.user._id
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get counts
  const [
    totalProjects,
    activeProjects,
    totalTeams,
    pendingInvitations,
    upcomingDeadlines,
    recentActivity,
  ] = await Promise.all([
    Project.countDocuments({ 'team.userId': userId }),
    Project.countDocuments({
      'team.userId': userId,
      status: { $in: ['draft', 'in_progress'] },
    }),
    Team.countDocuments({
      'members.userId': userId,
      'members.invitationStatus': 'accepted',
      status: { $in: ['forming', 'active'] },
    }),
    Team.countDocuments({
      'members.userId': userId,
      'members.invitationStatus': 'pending',
    }),
    Hackathon.countDocuments({
      hackathonEnd: { $gte: now, $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
    }),
    Notification.countDocuments({
      userId,
      createdAt: { $gte: weekAgo },
    }),
  ])

  // Get skill match opportunities
  const user = await User.findById(userId).select('skills')
  const matchingTeams = await Team.countDocuments({
    isPublic: true,
    isLookingForMembers: true,
    lookingFor: { $in: user.skills },
    'members.userId': { $ne: userId },
    status: 'forming',
  })

  res.json({
    success: true,
    data: {
      projects: {
        total: totalProjects,
        active: activeProjects,
      },
      teams: {
        total: totalTeams,
        pendingInvitations,
      },
      opportunities: {
        matchingTeams,
        upcomingDeadlines,
      },
      activity: {
        recent: recentActivity,
      },
    },
  })
})

// Helper function for ordinal numbers
const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
