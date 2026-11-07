import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth'
import {
  createCropRecommendation,
  getCropRecommendationHistory,
  getCropRecommendationById,
} from '../controllers/cropRecommendationController'
import { env } from '../config/env'

const router = Router()

// Rate limit: 10 recommendations per hour per user (skip in test mode)
const cropRecommendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 0 : 10,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many crop recommendation requests. Please try again in an hour.',
  },
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
})

// All routes require authentication
router.use(authenticate)

// POST /api/crops/recommend
router.post('/recommend', cropRecommendLimiter, createCropRecommendation)

// GET /api/crops/recommendations/history  (must come BEFORE /:id to avoid route conflict)
router.get('/recommendations/history', getCropRecommendationHistory)

// GET /api/crops/recommendations/:id
router.get('/recommendations/:id', getCropRecommendationById)

export default router

