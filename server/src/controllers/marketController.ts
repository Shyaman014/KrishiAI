import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { MarketDataService } from '../services/market/MarketDataService'
import { MarketPriceAlert } from '../models/MarketPriceAlert'
import { MarketFavorite } from '../models/MarketFavorite'
import { Activity } from '../models/Activity'
import { User } from '../models/User'

// ── Validation Schemas ───────────────────────────────────────────────────────

export const priceQuerySchema = z.object({
  commodity: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  market: z.string().trim().max(100).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'date_desc', 'name_asc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().int().min(10).max(1000).default(250),
})

export const historyQuerySchema = z.object({
  commodity: z.string({ required_error: 'commodity is required' }).trim().min(2),
  market: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  days: z.coerce.number().int().min(7).max(30).default(14),
})

export const createAlertSchema = z.object({
  commodity: z.string({ required_error: 'commodity is required' }).trim().min(2).max(100),
  targetPrice: z.number({ required_error: 'targetPrice is required' }).positive(),
  condition: z.enum(['above', 'below'], { required_error: 'condition must be "above" or "below"' }),
  mandiName: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
})

export const favoriteSchema = z.object({
  commodity: z.string({ required_error: 'commodity is required' }).trim().min(2).max(100),
  state: z.string().trim().max(100).optional(),
})

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/markets/prices
 * Query live/archive mandi prices with filtering, sorting and pagination.
 */
export async function getMarketPrices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = priceQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid market price query parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const data = await MarketDataService.getPrices(parsed.data)
    res.status(200).json({
      success: true,
      data,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/markets/commodities
 * List of available agricultural commodities with summary statistics.
 */
export async function getCommodities(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const commodities = await MarketDataService.getCommodities()
    res.status(200).json({
      success: true,
      data: commodities,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/markets/nearby
 * Discover mandis close to given GPS coordinates or user's saved location.
 */
export async function getNearbyMandis(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = nearbyQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinate parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    let lat = parsed.data.lat
    let lon = parsed.data.lon

    // If coordinates not provided in query, check user location preferences
    if (lat === undefined || lon === undefined) {
      if (req.user?.userId) {
        const user = await User.findById(req.user.userId).select('locationPreference')
        if (user?.locationPreference?.latitude && user?.locationPreference?.longitude) {
          lat = user.locationPreference.latitude
          lon = user.locationPreference.longitude
        }
      }
    }

    // Default to Punjab/Haryana agricultural hub (Ludhiana) if still undefined
    if (lat === undefined || lon === undefined) {
      lat = 30.901
      lon = 75.8573
    }

    const nearby = await MarketDataService.getNearbyMandis(lat, lon, parsed.data.radiusKm)
    res.status(200).json({
      success: true,
      data: {
        origin: { latitude: lat, longitude: lon },
        radiusKm: parsed.data.radiusKm,
        mandis: nearby,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/markets/history
 * Daily historical price trend for Recharts.
 */
export async function getHistoricalPrices(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = historyQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid historical price query parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const history = await MarketDataService.getHistoricalPrices(
      parsed.data.commodity,
      parsed.data.market || parsed.data.state,
      parsed.data.days,
    )

    res.status(200).json({
      success: true,
      data: history,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/markets/alerts
 * Create a target price alert for a commodity.
 */
export async function createPriceAlert(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = createAlertSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid alert configuration.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const alert = await MarketPriceAlert.create({
      userId: new mongoose.Types.ObjectId(userId),
      commodity: parsed.data.commodity,
      targetPrice: parsed.data.targetPrice,
      condition: parsed.data.condition,
      mandiName: parsed.data.mandiName,
      state: parsed.data.state,
    })

    // Log Activity
    await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'price_alert_created',
      title: `Price Alert Configured: ${alert.commodity}`,
      description: `Target set to ₹${alert.targetPrice}/Qtl (${alert.condition})`,
      metadata: {
        alertId: alert._id.toString(),
        commodity: alert.commodity,
        targetPrice: alert.targetPrice,
        condition: alert.condition,
      },
    })

    // Check immediately against current prices
    const currentPrices = await MarketDataService.getPrices({ commodity: alert.commodity })
    await MarketDataService.evaluateAlertsAgainstPrices(currentPrices.items)

    const refreshed = await MarketPriceAlert.findById(alert._id)

    res.status(201).json({
      success: true,
      message: 'Price alert created successfully.',
      data: refreshed || alert,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/markets/alerts
 * List user's active price alerts with triggered status.
 */
export async function getPriceAlerts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId

    // Retrieve active alerts
    const alerts = await MarketPriceAlert.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      data: alerts,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/markets/alerts/:id
 * Delete a price alert (user-isolated).
 */
export async function deletePriceAlert(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid alert ID.' })
      return
    }

    const alert = await MarketPriceAlert.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found or access denied.' })
      return
    }

    // Activity log
    await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'price_alert_deleted',
      title: `Price Alert Removed: ${alert.commodity}`,
      description: `Target alert for ₹${alert.targetPrice}/Qtl removed.`,
    })

    res.status(200).json({
      success: true,
      message: 'Price alert deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/markets/favorites
 * Toggle favorite commodity for farmer.
 */
export async function toggleFavorite(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = favoriteSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid favorite parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const existing = await MarketFavorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      commodity: parsed.data.commodity,
    })

    if (existing) {
      await MarketFavorite.deleteOne({ _id: existing._id })
      res.status(200).json({
        success: true,
        message: `Removed ${parsed.data.commodity} from favorites.`,
        isFavorite: false,
      })
      return
    }

    const favorite = await MarketFavorite.create({
      userId: new mongoose.Types.ObjectId(userId),
      commodity: parsed.data.commodity,
      state: parsed.data.state,
    })

    res.status(201).json({
      success: true,
      message: `Added ${parsed.data.commodity} to favorites.`,
      isFavorite: true,
      data: favorite,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/markets/favorites
 * Get all favorite commodities with current modal prices.
 */
export async function getFavorites(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const favorites = await MarketFavorite.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean()

    // Enrich with current market benchmark prices
    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        const prices = await MarketDataService.getPrices({
          commodity: fav.commodity,
          state: fav.state,
          limit: 1,
        })
        return {
          id: fav._id.toString(),
          commodity: fav.commodity,
          state: fav.state,
          currentPrice: prices.items[0] || null,
          createdAt: fav.createdAt,
        }
      }),
    )

    res.status(200).json({
      success: true,
      data: enriched,
    })
  } catch (err) {
    next(err)
  }
}
