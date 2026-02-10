import express from 'express'
import { body } from 'express-validator'
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  inviteToTeam,
  respondToInvitation,
  requestToJoin,
  removeMember,
  leaveTeam,
  getTeamRecommendations,
} from '../controllers/team.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// Validation rules
const createTeamValidation = [
  body('name').trim().notEmpty().withMessage('Team name is required'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Team size must be between 2 and 10'),
]

// Public routes
router.get('/', getTeams)
router.get('/:id', getTeam)

// Protected routes
router.post('/', protect, createTeamValidation, createTeam)
router.put('/:id', protect, updateTeam)
router.delete('/:id', protect, deleteTeam)
router.post('/:id/invite', protect, inviteToTeam)
router.post('/:id/respond-invitation', protect, respondToInvitation)
router.post('/:id/join-request', protect, requestToJoin)
router.delete('/:id/members/:memberId', protect, removeMember)
router.post('/:id/leave', protect, leaveTeam)
router.get('/recommendations', protect, getTeamRecommendations)

export default router
