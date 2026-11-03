import { Router } from 'express'
import healthRoutes from './healthRoutes'
import authRoutes from './authRoutes'
import dashboardRoutes from './dashboardRoutes'
import scanRoutes from './scanRoutes'

const router = Router()

router.use('/health', healthRoutes)
router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/scans', scanRoutes)

export default router
