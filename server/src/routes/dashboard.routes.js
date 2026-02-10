import express from 'express'
import {
  getDashboardOverview,
  getActivityFeed,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getSubmissionChecklist,
  getProjectTimeline,
  getQuickStats,
} from '../controllers/dashboard.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// All dashboard routes require authentication
router.use(protect)

// Dashboard overview
router.get('/overview', getDashboardOverview)
router.get('/quick-stats', getQuickStats)

// Activity feed
router.get('/activity', getActivityFeed)

// Notifications
router.put('/notifications/:id/read', markNotificationAsRead)
router.put('/notifications/read-all', markAllNotificationsAsRead)

// Project management
router.get('/checklist/:projectId', getSubmissionChecklist)
router.get('/timeline', getProjectTimeline)

export default router
