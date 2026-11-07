import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import axios from 'axios'
import { env } from '../config/env'
import { CropRecommendation } from '../models/CropRecommendation'
import { Activity } from '../models/Activity'
import { OpenWeatherService } from '../services/weather/OpenWeatherService'
import { User } from '../models/User'
import logger from '../utils/logger'

// ── Zod Schemas ─────────────────────────────────────────────────────────────

export const cropRecommendBodySchema = z.object({
  N: z.number({ required_error: 'N (Nitrogen) is required' }).min(0).max(300),
  P: z.number({ required_error: 'P (Phosphorus) is required' }).min(0).max(300),
  K: z.number({ required_error: 'K (Potassium) is required' }).min(0).max(300),
  temperature: z.number({ required_error: 'temperature is required' }).min(-10).max(55).optional(),
  humidity: z.number().min(0).max(100).optional(),
  ph: z.number({ required_error: 'ph (soil pH) is required' }).min(0).max(14),
  rainfall: z.number({ required_error: 'rainfall is required' }).min(0).max(600),
  soilType: z.string().trim().max(80).optional(),
  season: z.enum(['kharif', 'rabi', 'zaid', 'year-round']).optional(),
  language: z.enum(['en', 'hi', 'as']).default('en'),
  // Optional location context
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  cityName: z.string().trim().max(100).optional(),
})

const historyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attempt to fetch current weather for location context.
 * Never throws – returns null on any failure.
 */
async function fetchWeatherContext(
  userId: string,
  lat?: number,
  lon?: number,
  cityName?: string,
): Promise<{
  temperature?: number
  humidity?: number
  condition?: string
  source?: string
  lat?: number
  lon?: number
  cityName?: string
} | null> {
  try {
    let resolvedLat = lat
    let resolvedLon = lon
    let resolvedCity = cityName

    // If coords not supplied, try user saved preference
    if (resolvedLat === undefined || resolvedLon === undefined) {
      const user = await User.findById(userId).select('locationPreference')
      if (user?.locationPreference?.latitude && user?.locationPreference?.longitude) {
        resolvedLat = user.locationPreference.latitude
        resolvedLon = user.locationPreference.longitude
        resolvedCity = resolvedCity ?? user.locationPreference.cityName
      }
    }

    if (resolvedLat === undefined || resolvedLon === undefined) return null

    const weather = await OpenWeatherService.getCurrentWeather(resolvedLat, resolvedLon)
    return {
      temperature: weather.current.temp,
      humidity: weather.current.humidity,
      condition: weather.current.condition ?? weather.current.description,
      source: weather.source ?? 'OpenWeather',
      lat: resolvedLat,
      lon: resolvedLon,
      cityName: resolvedCity,
    }
  } catch (err) {
    logger.warn('Weather context fetch failed for crop recommendation: %s', (err as Error).message)
    return null
  }
}

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/crops/recommend
 * Generate top-3 crop recommendations from AI service.
 */
export async function createCropRecommendation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = cropRecommendBodySchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const data = parsed.data

    // ── Weather context (non-blocking) ───────────────────────────────────────
    const weatherCtx = await fetchWeatherContext(
      userId,
      data.latitude,
      data.longitude,
      data.cityName,
    )

    // ── Resolve temperature / humidity from weather if not provided ──────────
    const effectiveTemp = data.temperature ?? weatherCtx?.temperature
    const effectiveHumidity = data.humidity ?? weatherCtx?.humidity

    if (effectiveTemp === undefined) {
      res.status(400).json({
        success: false,
        message:
          'temperature is required. Provide it in the request body or allow location access for automatic weather detection.',
      })
      return
    }
    if (effectiveHumidity === undefined) {
      res.status(400).json({
        success: false,
        message:
          'humidity is required. Provide it in the request body or allow location access for automatic weather detection.',
      })
      return
    }

    // ── Call AI service ───────────────────────────────────────────────────────
    const aiServiceUrl = env.AI_SERVICE_URL
    const internalKey = env.AI_SERVICE_INTERNAL_KEY

    const aiPayload = {
      N: data.N,
      P: data.P,
      K: data.K,
      temperature: effectiveTemp,
      humidity: effectiveHumidity,
      ph: data.ph,
      rainfall: data.rainfall,
      language: data.language,
    }

    let aiResponse: {
      model_version: string
      recommendations: Array<{
        rank: number
        crop: string
        confidence: number
        confidence_pct: number
        supporting_factors: Array<{
          factor: string
          value: string
          importance_pct: string
          explanation: string
        }>
        growing_duration: string
        water_requirement: string
        suitable_season: string
        soil_requirement: string
        description: string
        source: string
        disclaimer: string
      }>
      disclaimer: string
      data_source_note: string
    }

    try {
      const aiRes = await axios.post(`${aiServiceUrl}/api/v1/recommend-crop`, aiPayload, {
        headers: {
          'Content-Type': 'application/json',
          ...(internalKey ? { 'X-Internal-Key': internalKey } : {}),
        },
        timeout: 15_000,
      })
      aiResponse = aiRes.data
    } catch (aiErr) {
      if (axios.isAxiosError(aiErr) && aiErr.response?.status === 422) {
        res.status(400).json({
          success: false,
          message: 'Invalid agronomic parameters rejected by AI service.',
          details: aiErr.response.data?.detail ?? undefined,
        })
        return
      }
      logger.error('AI service crop recommendation error: %s', (aiErr as Error).message)
      res.status(503).json({
        success: false,
        message: 'Crop recommendation service is temporarily unavailable. Please try again.',
      })
      return
    }

    // ── Map & persist ────────────────────────────────────────────────────────
    const recommendations = aiResponse.recommendations.map((rec) => ({
      rank: rec.rank,
      cropName: rec.crop,
      confidence: rec.confidence,
      confidencePct: rec.confidence_pct,
      supportingFactors: rec.supporting_factors.map((f) => ({
        factor: f.factor,
        value: f.value,
        importancePct: f.importance_pct,
        explanation: f.explanation,
      })),
      growingDuration: rec.growing_duration,
      waterRequirement: rec.water_requirement,
      suitableSeason: rec.suitable_season,
      soilRequirement: rec.soil_requirement,
      description: rec.description,
      source: rec.source,
    }))

    const record = await CropRecommendation.create({
      userId: new mongoose.Types.ObjectId(userId),
      inputs: {
        N: data.N,
        P: data.P,
        K: data.K,
        temperature: effectiveTemp,
        humidity: effectiveHumidity,
        ph: data.ph,
        rainfall: data.rainfall,
        soilType: data.soilType,
        season: data.season,
      },
      location:
        weatherCtx?.lat !== undefined
          ? {
              cityName: weatherCtx.cityName,
              latitude: weatherCtx.lat,
              longitude: weatherCtx.lon,
            }
          : undefined,
      weatherContext: weatherCtx
        ? {
            temperature: weatherCtx.temperature,
            humidity: weatherCtx.humidity,
            condition: weatherCtx.condition,
            source: weatherCtx.source,
          }
        : undefined,
      recommendations,
      language: data.language,
      modelVersion: aiResponse.model_version,
      disclaimer: aiResponse.disclaimer,
      dataSourceNote: aiResponse.data_source_note,
    })

    // ── Activity log ─────────────────────────────────────────────────────────
    await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'crop_recommendation_generated',
      title: 'Crop Recommendation Generated',
      description: `Top crop: ${recommendations[0]?.cropName ?? 'unknown'} (${
        ((recommendations[0]?.confidence ?? 0) * 100).toFixed(1)
      }% confidence)`,
      metadata: {
        recommendationId: record._id.toString(),
        topCrop: recommendations[0]?.cropName,
        language: data.language,
      },
    })

    res.status(200).json({
      success: true,
      data: {
        id: record._id.toString(),
        modelVersion: aiResponse.model_version,
        recommendations,
        inputs: record.inputs,
        weatherContext: record.weatherContext ?? null,
        location: record.location ?? null,
        disclaimer: aiResponse.disclaimer,
        dataSourceNote: aiResponse.data_source_note,
        createdAt: record.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/crops/recommendations/history
 * Return paginated crop recommendation history for the authenticated user.
 */
export async function getCropRecommendationHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = historyQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      CropRecommendation.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v')
        .lean(),
      CropRecommendation.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ])

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/crops/recommendations/:id
 * Return a single crop recommendation by ID (user-isolated).
 */
export async function getCropRecommendationById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid recommendation ID.' })
      return
    }

    const record = await CropRecommendation.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select('-__v')
      .lean()

    if (!record) {
      res.status(404).json({
        success: false,
        message: 'Recommendation not found or access denied.',
      })
      return
    }

    res.status(200).json({ success: true, data: record })
  } catch (err) {
    next(err)
  }
}

