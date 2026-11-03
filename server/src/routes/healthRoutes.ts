import { Router } from 'express'
import { getHealth, getDocs } from '../controllers/healthController'

const router = Router()

// GET /api/health
router.get('/', getHealth)

// GET /api/health/docs
router.get('/docs', getDocs)

export default router
