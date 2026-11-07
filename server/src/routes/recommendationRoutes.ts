import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  getRecommendations,
  generateRecommendations,
  recommendationGenerateLimiter,
} from '../controllers/recommendationController'

const router = Router()

// All recommendation scan routes require authentication
router.use(authenticate)

// GET  /api/scans/:id/recommendations         — fetch active recommendation
router.get('/:id/recommendations', getRecommendations)

// POST /api/scans/:id/recommendations/generate — generate or regenerate
router.post(
  '/:id/recommendations/generate',
  recommendationGenerateLimiter,
  generateRecommendations,
)

export default router

