import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Notification from '../models/Notification.model.js'

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    read,
    type,
    priority,
    startDate,
    endDate,
  } = req.query

  // Build query
  const query = { userId: req.user._id }

  // Filter by read status
  if (read !== undefined) {
    query.isRead = read === 'true'
  }

  // Filter by type
  if (type) {
    query.type = type
  }

  // Filter by priority
  if (priority) {
    query.priority = priority
  }

  // Filter by date range
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  // Execute query with pagination
  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ])

  // Format notifications
  const formattedNotifications = notifications.map(notification => ({
    id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    data: notification.data,
    action: notification.actionLink ? {
      link: notification.actionLink,
      text: notification.actionText,
    } : null,
    priority: notification.priority,
    read: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    expiresAt: notification.expiresAt,
  }))

  // Calculate pagination info
  const pages = Math.ceil(total / limit)
  const hasNext = page < pages
  const hasPrev = page > 1

  res.json({
    success: true,
    data: {
      notifications: formattedNotifications,
      stats: {
        total,
        unread: unreadCount,
        read: total - unreadCount,
      },
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

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotification = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid notification ID')
  }

  const notification = await Notification.findOne({
    _id: id,
    userId: req.user._id,
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  // Mark as read when fetched
  if (!notification.isRead) {
    await notification.markAsRead()
  }

  res.json({
    success: true,
    data: { notification },
  })
})

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid notification ID')
  }

  const notification = await Notification.findOne({
    _id: id,
    userId: req.user._id,
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
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  )

  res.json({
    success: true,
    message: 'All notifications marked as read',
  })
})

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid notification ID')
  }

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId: req.user._id,
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully',
  })
})

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/read
// @access  Private
export const deleteReadNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    userId: req.user._id,
    isRead: true,
  })

  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} read notifications`,
  })
})

// @desc    Archive notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
export const archiveNotification = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400)
    throw new Error('Invalid notification ID')
  }

  const notification = await Notification.findOne({
    _id: id,
    userId: req.user._id,
  })

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  await notification.archive()

  res.json({
    success: true,
    message: 'Notification archived',
  })
})

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
export const getNotificationPreferences = asyncHandler(async (req, res) => {
  // In a real implementation, you'd store these preferences in the User model
  // For now, we'll return default preferences

  const defaultPreferences = {
    email: {
      teamInvites: true,
      projectUpdates: true,
      submissionStatus: true,
      deadlineReminders: true,
      announcements: true,
      weeklyDigest: true,
    },
    push: {
      teamInvites: true,
      projectUpdates: true,
      submissionStatus: true,
      newMessages: true,
    },
    inApp: {
      teamInvites: true,
      projectUpdates: true,
      submissionStatus: true,
      newMessages: true,
      deadlineReminders: true,
      announcements: true,
    },
    frequency: 'realtime', // realtime, hourly, daily, weekly
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  }

  res.json({
    success: true,
    data: { preferences: defaultPreferences },
  })
})

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body

  // In a real implementation, you'd save these preferences to the User model
  // For now, we'll just validate and return success

  if (!preferences || typeof preferences !== 'object') {
    res.status(400)
    throw new Error('Invalid preferences data')
  }

  // Validate preferences structure (simplified)
  const validTypes = ['email', 'push', 'inApp']
  const validCategories = [
    'teamInvites',
    'projectUpdates',
    'submissionStatus',
    'deadlineReminders',
    'announcements',
    'weeklyDigest',
    'newMessages',
  ]

  for (const type of validTypes) {
    if (preferences[type]) {
      for (const category in preferences[type]) {
        if (!validCategories.includes(category)) {
          res.status(400)
          throw new Error(`Invalid notification category: ${category}`)
        }
      }
    }
  }

  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: { preferences },
  })
})

// @desc    Get notification stats
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // Get stats by type
  const statsByType = await Notification.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        read: { $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } },
        unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
  ])

  // Get stats by priority
  const statsByPriority = await Notification.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$priority',
        total: { $sum: 1 },
        read: { $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
  ])

  // Get recent activity
  const recentActivity = await Notification.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 7 },
  ])

  res.json({
    success: true,
    data: {
      byType: statsByType,
      byPriority: statsByPriority,
      recentActivity,
    },
  })
})
