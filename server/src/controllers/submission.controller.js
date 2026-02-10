import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Submission from '../models/Submission.model.js'
import Project from '../models/Project.model.js'
import Team from '../models/Team.model.js'
import Hackathon from '../models/Hackathon.model.js'
import Notification from '../models/Notification.model.js'
import { validationResult } from 'express-validator'

// @desc    Create submission
// @route   POST /api/submissions
// @access  Private
export const createSubmission = asyncHandler(async (req, res) => {
  // Validate request
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400)
    throw new Error(errors.array()[0].msg)
  }

  const {
    projectId,
    title,
    summary,
    demoVideo,
    screenshots,
    presentation,
    documentation,
    additionalFiles,
    deployment,
  } = req.body

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
  if (!project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to submit for this project')
  }

  // Check if project is already submitted
  if (project.status === 'submitted' || project.status === 'under_review') {
    res.status(400)
    throw new Error('Project already submitted')
  }

  // Get team for this project
  const team = await Team.findOne({ projectId: project._id })
  if (!team) {
    res.status(404)
    throw new Error('Team not found for this project')
  }

  // Check if hackathon submission period is open
  const hackathon = await Hackathon.findById(project.hackathonId)
  if (!hackathon) {
    res.status(404)
    throw new Error('Hackathon not found')
  }

  if (!hackathon.isSubmissionOpen()) {
    // Check if submission is late
    const isLate = new Date() > hackathon.hackathonEnd
    if (!isLate) {
      res.status(400)
      throw new Error('Submission period is not open yet')
    }
  }

  // Create submission
  const submission = await Submission.create({
    projectId,
    hackathonId: project.hackathonId,
    teamId: team._id,
    title: title || project.title,
    summary: summary || project.description,
    assets: {
      demoVideo,
      screenshots: screenshots || project.screenshots,
      presentation,
      documentation,
      additionalFiles: additionalFiles || [],
    },
    deployment,
    submittedBy: req.user._id,
    status: 'submitted',
    submissionStatus: {
      isLate: new Date() > hackathon.hackathonEnd,
      isComplete: true,
    },
  })

  if (!submission) {
    res.status(400)
    throw new Error('Failed to create submission')
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
      title: 'Submission Created!',
      message: `Project "${project.title}" has been submitted for judging`,
      data: {
        projectId: project._id,
        submissionId: submission._id,
        metadata: {
          projectTitle: project.title,
          submissionDate: submission.submittedAt,
        },
      },
      actionLink: `/projects/${project._id}`,
      actionText: 'View Submission',
      priority: 'high',
    })
  })

  await Promise.all(notificationPromises)

  // Notify hackathon organizers (simplified)
  // In a real implementation, you'd notify actual organizers

  res.status(201).json({
    success: true,
    data: { submission },
    message: 'Submission created successfully',
  })
})

// @desc    Get submission by ID
// @route   GET /api/submissions/:id
// @access  Public (or Private based on hackathon visibility)
export const getSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid submission ID')
  }

  const submission = await Submission.findById(id)
    .populate('projectId', 'title description techStack tags')
    .populate('teamId', 'name members')
    .populate('hackathonId', 'name')
    .populate('judges.judgeId', 'name avatar role')
    .populate('submittedBy', 'name avatar')

  if (!submission) {
    res.status(404)
    throw new Error('Submission not found')
  }

  // Check if user can view submission
  const canView = await canUserViewSubmission(req.user, submission)
  if (!canView) {
    res.status(403)
    throw new Error('Not authorized to view this submission')
  }

  res.json({
    success: true,
    data: { submission },
  })
})

// @desc    Update submission
// @route   PUT /api/submissions/:id
// @access  Private (Team members only)
export const updateSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid submission ID')
  }

  const submission = await Submission.findById(id)

  if (!submission) {
    res.status(404)
    throw new Error('Submission not found')
  }

  // Check if user is team member
  const project = await Project.findById(submission.projectId)
  if (!project || !project.isTeamMember(req.user._id)) {
    res.status(403)
    throw new Error('Not authorized to update this submission')
  }

  // Check if submission can be updated
  if (submission.status !== 'draft' && submission.status !== 'submitted') {
    res.status(400)
    throw new Error('Submission cannot be updated in current status')
  }

  // Check if hackathon submission period is still open
  const hackathon = await Hackathon.findById(submission.hackathonId)
  if (!hackathon.isSubmissionOpen() && new Date() > hackathon.hackathonEnd) {
    res.status(400)
    throw new Error('Submission period has ended')
  }

  // Save current version before updating
  await submission.saveVersion()

  // Update submission
  const updates = req.body
  Object.assign(submission, updates)
  submission.lastModifiedBy = req.user._id
  submission.version += 1

  await submission.save()

  res.json({
    success: true,
    data: { submission },
    message: 'Submission updated successfully',
  })
})

// @desc    Add judge evaluation
// @route   POST /api/submissions/:id/judge
// @access  Private (Judge only)
export const addJudgeEvaluation = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { scores, comments, feedback } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid submission ID')
  }

  // Check if user is a judge
  if (req.user.role !== 'judge' && req.user.role !== 'admin') {
    res.status(403)
    throw new Error('Only judges can evaluate submissions')
  }

  const submission = await Submission.findById(id)

  if (!submission) {
    res.status(404)
    throw new Error('Submission not found')
  }

  // Check if judge has already evaluated this submission
  const existingEvaluation = submission.judges.find(
    judge => judge.judgeId.toString() === req.user._id.toString()
  )

  if (existingEvaluation) {
    res.status(400)
    throw new Error('You have already evaluated this submission')
  }

  // Add evaluation
  await submission.addJudgeEvaluation(
    req.user._id,
    scores,
    comments,
    feedback
  )

  // Notify team members about new evaluation
  const project = await Project.findById(submission.projectId)
  if (project) {
    const notificationPromises = project.team.map(async (member) => {
      await Notification.create({
        userId: member.userId,
        type: 'judging_result',
        title: 'New Evaluation Received',
        message: `Your submission "${project.title}" has received a new judge evaluation`,
        data: {
          projectId: project._id,
          submissionId: submission._id,
          metadata: {
            projectTitle: project.title,
            averageScore: submission.averageScore,
          },
        },
        actionLink: `/projects/${project._id}`,
        actionText: 'View Evaluation',
      })
    })

    await Promise.all(notificationPromises)
  }

  res.json({
    success: true,
    data: { submission },
    message: 'Evaluation submitted successfully',
  })
})

// @desc    Update submission status
// @route   PUT /api/submissions/:id/status
// @access  Private (Admin/Judge only)
export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { status, notes } = req.body

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid submission ID')
  }

  // Check if user is admin or judge
  if (req.user.role !== 'admin' && req.user.role !== 'judge') {
    res.status(403)
    throw new Error('Not authorized to update submission status')
  }

  const submission = await Submission.findById(id)

  if (!submission) {
    res.status(404)
    throw new Error('Submission not found')
  }

  // Update status
  const oldStatus = submission.status
  submission.status = status

  if (notes) {
    submission.submissionNotes = notes
  }

  await submission.save()

  // Update project status
  const project = await Project.findById(submission.projectId)
  if (project) {
    project.status = status
    await project.save()
  }

  // Notify team members about status change
  if (project) {
    const statusMessages = {
      accepted: 'has been accepted for the next round',
      rejected: 'has been rejected',
      winner: 'has won the hackathon!',
      runner_up: 'is a runner-up',
      honorable_mention: 'received an honorable mention',
    }

    const message = statusMessages[status] || `status changed to ${status}`

    const notificationPromises = project.team.map(async (member) => {
      await Notification.create({
        userId: member.userId,
        type: 'submission_status',
        title: `Submission ${status.replace('_', ' ').toUpperCase()}`,
        message: `Your submission "${project.title}" ${message}`,
        data: {
          projectId: project._id,
          submissionId: submission._id,
          metadata: {
            projectTitle: project.title,
            oldStatus,
            newStatus: status,
          },
        },
        actionLink: `/projects/${project._id}`,
        actionText: 'View Details',
        priority: 'high',
      })
    })

    await Promise.all(notificationPromises)
  }

  res.json({
    success: true,
    data: { submission },
    message: 'Submission status updated successfully',
  })
})

// @desc    Get submission leaderboard for hackathon
// @route   GET /api/submissions/hackathon/:hackathonId/leaderboard
// @access  Public
export const getHackathonLeaderboard = asyncHandler(async (req, res) => {
  const { hackathonId } = req.params
  const { limit = 50 } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
    res.status(400)
    throw new Error('Invalid hackathon ID')
  }

  const leaderboard = await Submission.getLeaderboard(hackathonId, parseInt(limit))

  res.json({
    success: true,
    data: { leaderboard },
  })
})

// @desc    Get user's submissions
// @route   GET /api/submissions/user/:userId
// @access  Public
export const getUserSubmissions = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { page = 1, limit = 10 } = req.query

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400)
    throw new Error('Invalid user ID')
  }

  // Find teams where user is a member
  const userTeams = await Team.find({
    'members.userId': userId,
    'members.invitationStatus': 'accepted',
  }).select('_id')

  const teamIds = userTeams.map(team => team._id)

  // Build query
  const query = { teamId: { $in: teamIds } }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [submissions, total] = await Promise.all([
    Submission.find(query)
      .populate('projectId', 'title description')
      .populate('hackathonId', 'name')
      .select('status totalScore averageScore ranking submittedAt')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Submission.countDocuments(query),
  ])

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      submissions,
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

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Private (Admin only)
export const deleteSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid submission ID')
  }

  // Check if user is admin
  if (req.user.role !== 'admin') {
    res.status(403)
    throw new Error('Only admins can delete submissions')
  }

  const submission = await Submission.findById(id)

  if (!submission) {
    res.status(404)
    throw new Error('Submission not found')
  }

  // Soft delete: mark as disqualified
  submission.submissionStatus.hasDisqualification = true
  submission.submissionStatus.disqualificationReason = 'Deleted by admin'
  submission.status = 'rejected'
  await submission.save()

  // Update project status
  const project = await Project.findById(submission.projectId)
  if (project) {
    project.status = 'rejected'
    await project.save()
  }

  res.json({
    success: true,
    message: 'Submission deleted successfully',
  })
})

// Helper function to check if user can view submission
const canUserViewSubmission = async (user, submission) => {
  // Admins and judges can view all submissions
  if (user && (user.role === 'admin' || user.role === 'judge')) {
    return true
  }

  // Team members can view their own submission
  const project = await Project.findById(submission.projectId)
  if (project && user && project.isTeamMember(user._id)) {
    return true
  }

  // Check hackathon visibility
  const hackathon = await Hackathon.findById(submission.hackathonId)
  if (!hackathon) return false

  // Public hackathons show submissions after judging
  if (hackathon.visibility === 'public') {
    const now = new Date()
    return now > hackathon.judgingEnd
  }

  return false
}
