import express from 'express'
import multer from 'multer'
import { body } from 'express-validator'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  uploadScreenshots,
  addTeamMember,
  removeTeamMember,
  likeProject,
  submitProject,
  getProjectAnalytics,
} from '../controllers/project.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  },
})

// Validation rules
const createProjectValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 characters'),
  body('problemStatement')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Problem statement must be at least 100 characters'),
  body('solution')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Solution must be at least 100 characters'),
  body('repoUrl').isURL().withMessage('Valid GitHub URL is required'),
  body('videoUrl').isURL().withMessage('Valid demo video URL is required'),
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
]

// Public routes
router.get('/', getProjects)
router.get('/:id', getProject)

// Protected routes
router.post('/', protect, createProjectValidation, createProject)
router.put('/:id', protect, updateProject)
router.delete('/:id', protect, deleteProject)
router.post(
  '/:id/screenshots',
  protect,
  upload.array('screenshots', 5),
  uploadScreenshots
)
router.post('/:id/team', protect, addTeamMember)
router.delete('/:id/team/:memberId', protect, removeTeamMember)
router.post('/:id/like', protect, likeProject)
router.post('/:id/submit', protect, submitProject)
router.get('/:id/analytics', protect, getProjectAnalytics)

export default router
