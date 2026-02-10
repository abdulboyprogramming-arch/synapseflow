import express from 'express'
import multer from 'multer'
import {
  getUserProfile,
  getUsers,
  updateAvatar,
  getUserProjects,
  getUserTeams,
  getSkillRecommendations,
  searchUsersBySkills,
} from '../controllers/user.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// Configure multer for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

// Public routes
router.get('/', getUsers)
router.get('/:id', getUserProfile)
router.get('/:id/projects', getUserProjects)
router.get('/:id/teams', getUserTeams)
router.get('/search/skills', searchUsersBySkills)

// Protected routes
router.put('/avatar', protect, upload.single('avatar'), updateAvatar)
router.get('/skills/recommendations', protect, getSkillRecommendations)

export default router
