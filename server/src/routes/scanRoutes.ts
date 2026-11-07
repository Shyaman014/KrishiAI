import { Router } from 'express'
import {
  uploadScan,
  getScans,
  getScanById,
  deleteScan,
} from '../controllers/scanController'
import { analyzeScan } from '../controllers/analyzeController'
import {
  getScanAnalysis,
  generateExplanation,
} from '../controllers/explanationController'
import { authenticate } from '../middleware/auth'
import { uploadLimiter, handleUploadMiddleware } from '../middleware/upload'

const router = Router()

// All scan endpoints require valid farmer authentication
router.use(authenticate)

// Image upload endpoint with rate limiting & Multer wrapper
router.post('/upload', uploadLimiter, handleUploadMiddleware, uploadScan)

// AI Analysis trigger endpoint
router.post('/:id/analyze', analyzeScan)

// AI Disease Explanation & Agronomic Advisory endpoints
router.get('/:id/analysis', getScanAnalysis)
router.post('/:id/generate-explanation', generateExplanation)

// History & retrieval endpoints
router.get('/', getScans)
router.get('/history', getScans)
router.get('/:id', getScanById)
router.delete('/:id', deleteScan)

export default router
