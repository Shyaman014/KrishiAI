import { Router } from 'express'
import healthRoutes from './healthRoutes'
import authRoutes from './authRoutes'
import dashboardRoutes from './dashboardRoutes'
import scanRoutes from './scanRoutes'
import recommendationRoutes from './recommendationRoutes'
import recommendationFeedbackRoutes from './recommendationFeedbackRoutes'
import weatherRoutes from './weatherRoutes'
import cropRecommendationRoutes from './cropRecommendationRoutes'
import marketRoutes from './marketRoutes'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/scans', scanRoutes)
router.use('/scans', recommendationRoutes)
router.use('/recommendations', recommendationFeedbackRoutes)
router.use('/weather', weatherRoutes)
router.use('/crops', cropRecommendationRoutes)
router.use('/markets', marketRoutes)

export default router
