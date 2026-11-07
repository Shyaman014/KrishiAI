import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { submitFeedback } from '../controllers/recommendationController'

const router = Router()

// All feedback routes require authentication
router.use(authenticate)

// POST /api/recommendations/:recommendationId/feedback
router.post('/:recommendationId/feedback', submitFeedback)

export default router

