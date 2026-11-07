import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { OpenWeatherService } from '../services/weather/OpenWeatherService'
import { WeatherAdvisoryEngine } from '../services/weather/WeatherAdvisoryEngine'
import { WeatherAlertHistory } from '../models/WeatherAlertHistory'
import { User } from '../models/User'
import logger from '../utils/logger'

// ── Zod Query & Body Schemas ────────────────────────────────────────────────

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  city: z.string().trim().max(100).optional(),
  lang: z.enum(['en', 'hi', 'as']).optional().default('en'),
})

export const locationPreferenceSchema = z.object({
  cityName: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(10).default('IN'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(['gps', 'manual']).default('manual'),
})

// Default coordinates: Ludhiana, Punjab
const DEFAULT_LAT = 30.901
const DEFAULT_LON = 75.8573
const DEFAULT_CITY = 'Ludhiana, Punjab'

/**
 * Helper to resolve coordinates & location name from query or user profile
 */
async function resolveLocation(
  req: Request,
  queryData: z.infer<typeof weatherQuerySchema>,
): Promise<{ lat: number; lon: number; cityName?: string; lang: 'en' | 'hi' | 'as' }> {
  const userId = req.user?.userId
  let lat = queryData.lat
  let lon = queryData.lon
  let cityName = queryData.city
  let lang = queryData.lang || 'en'

  // If user provided city name but not coords, search city
  if ((lat === undefined || lon === undefined) && cityName) {
    const matched = await OpenWeatherService.searchCities(cityName)
    if (matched.length > 0) {
      lat = matched[0].lat
      lon = matched[0].lon
      cityName = matched[0].name
    }
  }

  // If coords still undefined, check User's saved location preference
  if (lat === undefined || lon === undefined) {
    if (userId) {
      const user = await User.findById(userId).select('locationPreference preferredLanguage')
      if (user?.locationPreference?.latitude && user?.locationPreference?.longitude) {
        lat = user.locationPreference.latitude
        lon = user.locationPreference.longitude
        cityName = user.locationPreference.cityName || cityName
      }
      if (user?.preferredLanguage && ['en', 'hi', 'as'].includes(user.preferredLanguage)) {
        lang = user.preferredLanguage as 'en' | 'hi' | 'as'
      }
    }
  }

  // Fallback to default agricultural hub
  if (lat === undefined || lon === undefined) {
    lat = DEFAULT_LAT
    lon = DEFAULT_LON
    cityName = cityName || DEFAULT_CITY
  }

  return { lat, lon, cityName, lang }
}

/**
 * GET /api/weather/current
 */
export const getCurrentWeather = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const parseResult = weatherQuerySchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid weather query parameters.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const { lat, lon, cityName, lang } = await resolveLocation(req, parseResult.data)
    const weather = await OpenWeatherService.getCurrentWeather(lat, lon, cityName, lang)

    res.status(200).json({
      success: true,
      data: weather,
    })
  } catch (err) {
    logger.error('Error in getCurrentWeather', err)
    next(err)
  }
}

/**
 * GET /api/weather/forecast
 */
export const getForecast = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const parseResult = weatherQuerySchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid forecast query parameters.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const { lat, lon, cityName, lang } = await resolveLocation(req, parseResult.data)
    const forecast = await OpenWeatherService.getForecast(lat, lon, cityName, lang)

    res.status(200).json({
      success: true,
      data: forecast,
    })
  } catch (err) {
    logger.error('Error in getForecast', err)
    next(err)
  }
}

/**
 * GET /api/weather/advisory
 */
export const getWeatherAdvisory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const parseResult = weatherQuerySchema.safeParse(req.query)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid advisory query parameters.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const userId = req.user!.userId
    const { lat, lon, cityName, lang } = await resolveLocation(req, parseResult.data)

    const [current, forecast] = await Promise.all([
      OpenWeatherService.getCurrentWeather(lat, lon, cityName, lang),
      OpenWeatherService.getForecast(lat, lon, cityName, lang),
    ])

    const advisory = await WeatherAdvisoryEngine.generateAdvisory(
      current,
      forecast,
      userId,
      lang,
    )

    res.status(200).json({
      success: true,
      data: {
        current,
        forecast,
        advisory,
      },
    })
  } catch (err) {
    logger.error('Error in getWeatherAdvisory', err)
    next(err)
  }
}

/**
 * POST /api/weather/location
 * Save or update user's preferred farm location
 */
export const updateLocationPreference = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const parseResult = locationPreferenceSchema.safeParse(req.body)

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid location parameters.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const { cityName, state, country, latitude, longitude, source } = parseResult.data

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          locationPreference: {
            cityName,
            state,
            country,
            latitude,
            longitude,
            source,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    ).select('locationPreference')

    res.status(200).json({
      success: true,
      message: 'Farm location preference updated successfully.',
      data: {
        locationPreference: user?.locationPreference,
      },
    })
  } catch (err) {
    logger.error('Error updating location preference', err)
    next(err)
  }
}

/**
 * GET /api/weather/alerts/history
 * Fetch active or historical weather alerts for the farmer
 */
export const getAlertHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId

  try {
    const alerts = await WeatherAlertHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
      dismissed: false,
      validUntil: { $gte: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(20)

    res.status(200).json({
      success: true,
      data: {
        alerts,
      },
    })
  } catch (err) {
    logger.error('Error in getAlertHistory', err)
    next(err)
  }
}

/**
 * PATCH /api/weather/alerts/:id/dismiss
 */
export const dismissAlert = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const alertId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!alertId || !mongoose.Types.ObjectId.isValid(alertId)) {
    res.status(400).json({ success: false, message: 'Invalid alert ID format.' })
    return
  }

  try {
    const alert = await WeatherAlertHistory.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(alertId), userId: new mongoose.Types.ObjectId(userId) },
      { $set: { dismissed: true } },
      { new: true },
    )

    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found or already dismissed.' })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Alert dismissed.',
    })
  } catch (err) {
    logger.error('Error in dismissAlert', err)
    next(err)
  }
}

/**
 * GET /api/weather/cities?q=...
 */
export const searchCities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const query = typeof req.query.q === 'string' ? req.query.q : ''

  if (!query || query.trim().length < 2) {
    res.status(200).json({ success: true, data: { cities: [] } })
    return
  }

  try {
    const cities = await OpenWeatherService.searchCities(query.trim())
    res.status(200).json({
      success: true,
      data: { cities },
    })
  } catch (err) {
    logger.error('Error in searchCities', err)
    next(err)
  }
}

