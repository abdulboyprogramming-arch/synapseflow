import express from 'express'
import { body } from 'express-validator'
import {
  createSubmission,
  getSubmission,
  updateSubmission,
  addJudgeEvaluation,
  updateSubmissionStatus,
  getHackathonLeaderboard,
  getUserSubmissions,
  deleteSubmission,
} from '../controllers/submission.controller.js'
import { protect } from '../middleware/auth.middleware.js'
import { isAdmin, isJudge } from '../middleware/role.middleware.js'

const router = express.Router()

// Validation rules
const createSubmissionValidation = [
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('summary')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Summary must be at least 100 characters'),
  body('demoVideo').isURL().withMessage('Valid demo video URL is required'),
]

const judgeEvaluationValidation = [
  body('scores.innovation')
    .isInt({ min: 0, max: 10 })
    .withMessage('Innovation score must be between 0 and 10'),
  body('scores.execution')
    .isInt({ min: 0, max: 10 })
    .withMessage('Execution score must be between 0 and 10'),
  body('scores.presentation')
    .isInt({ min: 0, max: 10 })
    .withMessage('Presentation score must be between 0 and 10'),
  body('scores.impact')
    .isInt({ min: 0, max: 10 })
    .withMessage('Impact score must be between 0 and 10'),
  body('scores.completeness')
    .isInt({ min: 0, max: 10 })
    .withMessage('Completeness score must be between 0 and 10'),
]

// Protected routes (all submission routes require authentication)
router.use(protect)

// Team member routes
router.post('/', createSubmissionValidation, createSubmission)
router.get('/user/:userId', getUserSubmissions)
router.put('/:id', updateSubmission)

// Judge routes
router.post('/:id/judge', isJudge, judgeEvaluationValidation, addJudgeEvaluation)
router.put('/:id/status', isJudge, updateSubmissionStatus)

// Admin routes
router.delete('/:id', isAdmin, deleteSubmission)

// Public/Protected routes (depending on hackathon visibility)
router.get('/hackathon/:hackathonId/leaderboard', getHackathonLeaderboard)
router.get('/:id', getSubmission)

export default router
