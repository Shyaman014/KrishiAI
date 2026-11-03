import { Router } from 'express'
import {
  getOverview,
  getCropHealth,
  getRecentScans,
  getActivity,
} from '../controllers/dashboardController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All dashboard endpoints require valid authentication
router.use(authenticate)

router.get('/overview', getOverview)
router.get('/crop-health', getCropHealth)
router.get('/recent-scans', getRecentScans)
router.get('/activity', getActivity)

export default router

