import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth'
import {
  getCurrentWeather,
  getForecast,
  getWeatherAdvisory,
  updateLocationPreference,
  getAlertHistory,
  dismissAlert,
  searchCities,
} from '../controllers/weatherController'

const router = Router()

// Rate limiting for weather endpoints: 60 requests per minute
const weatherLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many weather queries. Please slow down and try again in a minute.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

// All weather endpoints require farmer authentication
router.use(authenticate)
router.use(weatherLimiter)

// Weather data retrieval
router.get('/current', getCurrentWeather)
router.get('/forecast', getForecast)
router.get('/advisory', getWeatherAdvisory)

// Location preferences
router.post('/location', updateLocationPreference)
router.get('/cities', searchCities)

// Weather alerts management
router.get('/alerts/history', getAlertHistory)
router.patch('/alerts/:id/dismiss', dismissAlert)

export default router

