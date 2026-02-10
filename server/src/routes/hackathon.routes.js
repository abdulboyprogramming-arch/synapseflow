import express from 'express'
import {
  getHackathons,
  getHackathon,
  getHackathonProjects,
  getHackathonTeams,
  getHackathonLeaderboard,
  registerForHackathon,
  getHackathonTimeline,
  getHackathonResources,
} from '../controllers/hackathon.controller.js'
import { protect } from '../middleware/auth.middleware.js'

const router = express.Router()

// Public routes
router.get('/', getHackathons)
router.get('/:id', getHackathon)
router.get('/:id/projects', getHackathonProjects)
router.get('/:id/teams', getHackathonTeams)
router.get('/:id/leaderboard', getHackathonLeaderboard)
router.get('/:id/timeline', getHackathonTimeline)
router.get('/:id/resources', getHackathonResources)

// Protected routes
router.post('/:id/register', protect, registerForHackathon)

export default router
