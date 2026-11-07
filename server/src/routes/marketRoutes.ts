import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate, optionalAuth } from '../middleware/auth'
import {
  getMarketPrices,
  getCommodities,
  getNearbyMandis,
  getHistoricalPrices,
  createPriceAlert,
  getPriceAlerts,
  deletePriceAlert,
  toggleFavorite,
  getFavorites,
} from '../controllers/marketController'
import { env } from '../config/env'

const router = Router()

// Rate limit for alert creation: 20 per hour per user (bypassed in test)
const alertLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 0 : 20,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many price alert requests. Please try again later.',
  },
})

// Public & Optional Auth endpoints
router.get('/prices', optionalAuth, getMarketPrices)
router.get('/commodities', getCommodities)
router.get('/nearby', optionalAuth, getNearbyMandis)
router.get('/history', getHistoricalPrices)

// Authenticated Price Alerts endpoints
router.post('/alerts', authenticate, alertLimiter, createPriceAlert)
router.get('/alerts', authenticate, getPriceAlerts)
router.delete('/alerts/:id', authenticate, deletePriceAlert)

// Authenticated Favorites endpoints
router.post('/favorites', authenticate, toggleFavorite)
router.get('/favorites', authenticate, getFavorites)

export default router

