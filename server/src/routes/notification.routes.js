import express from 'express'
import {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  archiveNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationStats,
} from '../controllers/notification.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// All notification routes require authentication
router.use(protect)

// Notification management
router.get('/', getNotifications)
router.get('/:id', getNotification)
router.put('/:id/read', markAsRead)
router.put('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)
router.delete('/read', deleteReadNotifications)
router.put('/:id/archive', archiveNotification)

// Preferences
router.get('/preferences', getNotificationPreferences)
router.put('/preferences', updateNotificationPreferences)

// Stats
router.get('/stats', getNotificationStats)

export default router
