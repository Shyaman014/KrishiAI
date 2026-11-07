import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { Scan } from '../models/Scan'
import { Recommendation } from '../models/Recommendation'
import { User } from '../models/User'
import { Activity } from '../models/Activity'
import { TreatmentRecommendationService } from '../services/recommendations/TreatmentRecommendationService'
import {
  generateRecommendationSchema,
  feedbackValidationSchema,
} from '../services/recommendations/RecommendationValidationService'
import logger from '../utils/logger'

/**
 * Rate limiter: allow each user/IP to generate at most 5 recommendations per hour.
 * Applied only to the POST /generate route.
 */
export const recommendationGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many recommendation requests. You may generate up to 5 recommendations per hour.',
  },
  skip: () => process.env.NODE_ENV === 'test',
})

/**
 * GET /api/scans/:id/recommendations
 *
 * Returns the active treatment recommendation for a farmer's scan.
 * Returns hasRecommendation: false when none exists yet.
 */
export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const scanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!scanId || !mongoose.Types.ObjectId.isValid(scanId)) {
    res.status(400).json({ success: false, message: 'Invalid scan ID format.' })
    return
  }

  try {
    // Verify scan ownership
    const scan = await Scan.findOne({ _id: scanId, userId })
    if (!scan) {
      res.status(404).json({ success: false, message: 'Scan record not found.' })
      return
    }

    const recommendation = await TreatmentRecommendationService.getRecommendationForScan(
      scanId,
      userId,
    )

    res.status(200).json({
      success: true,
      data: {
        hasRecommendation: recommendation !== null,
        recommendation: recommendation || null,
      },
    })
  } catch (error) {
    logger.error(`Error fetching recommendations for scan ${scanId}`, error)
    next(error)
  }
}

/**
 * POST /api/scans/:id/recommendations/generate
 *
 * Generates or regenerates an agricultural treatment recommendation
 * for a completed disease scan. Respects eligibility rules and
 * chemical safety boundaries.
 */
export const generateRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const scanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!scanId || !mongoose.Types.ObjectId.isValid(scanId)) {
    res.status(400).json({ success: false, message: 'Invalid scan ID format.' })
    return
  }

  // Validate request body with Zod
  const parseResult = generateRecommendationSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid request body.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  const { language: bodyLanguage, regenerate } = parseResult.data

  try {
    // Verify scan ownership
    const scan = await Scan.findOne({ _id: scanId, userId })
    if (!scan) {
      res.status(404).json({ success: false, message: 'Scan record not found.' })
      return
    }

    // Resolve language: body param > user preference > default 'en'
    let targetLanguage: 'en' | 'hi' | 'as' = bodyLanguage || 'en'
    if (!bodyLanguage || bodyLanguage === 'en') {
      const user = await User.findById(userId).select('preferredLanguage')
      if (user && ['en', 'hi', 'as'].includes(user.preferredLanguage)) {
        targetLanguage = user.preferredLanguage as 'en' | 'hi' | 'as'
      }
    }

    let recommendation
    let cached = false

    try {
      const prior = regenerate
        ? null
        : await TreatmentRecommendationService.getRecommendationForScan(scanId, userId)

      if (prior) {
        recommendation = prior
        cached = true
      } else {
        recommendation = await TreatmentRecommendationService.generateRecommendation(
          scan,
          userId,
          targetLanguage,
          regenerate ?? false,
        )
      }
    } catch (serviceErr: unknown) {
      const msg = serviceErr instanceof Error ? serviceErr.message : 'Service error'
      // Eligibility failures are user-facing 400s
      if (
        msg.includes('processing') ||
        msg.includes('failed scan') ||
        msg.includes('not eligible')
      ) {
        res.status(400).json({ success: false, message: msg })
        return
      }
      // AI outage
      if (msg.includes('AI service')) {
        res.status(502).json({
          success: false,
          message: 'Recommendation service is temporarily unavailable. Please retry shortly.',
        })
        return
      }
      throw serviceErr
    }

    // Log activity (non-blocking)
    try {
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'recommendation_generated',
        title: 'Treatment Recommendations Generated',
        description: `Agricultural recommendations created for ${scan.cropName || recommendation.cropName} in ${targetLanguage.toUpperCase()}.`,
        metadata: {
          scanId: scan._id.toString(),
          recommendationId: recommendation._id.toString(),
          cropName: recommendation.cropName,
          diseaseName: recommendation.diseaseName,
          language: targetLanguage,
          cached,
        },
      })
    } catch (actErr) {
      logger.error('Failed to log recommendation_generated activity', actErr)
    }

    logger.info(
      `Recommendation ${recommendation._id} returned for scan ${scanId} | cached=${cached}`,
    )

    res.status(200).json({
      success: true,
      message: cached
        ? 'Retrieved existing treatment recommendation.'
        : 'Treatment recommendation generated successfully.',
      data: { recommendation, cached },
    })
  } catch (error) {
    logger.error(`Error in generateRecommendations for scan ${scanId}`, error)
    next(error)
  }
}

/**
 * POST /api/recommendations/:recommendationId/feedback
 *
 * Records a farmer's feedback (rating, helpfulness, follow-up) on
 * a previously generated recommendation. Feedback is embedded in the document.
 */
export const submitFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const recommendationId = Array.isArray(req.params.recommendationId)
    ? req.params.recommendationId[0]
    : req.params.recommendationId

  if (!recommendationId || !mongoose.Types.ObjectId.isValid(recommendationId)) {
    res.status(400).json({ success: false, message: 'Invalid recommendation ID format.' })
    return
  }

  const parseResult = feedbackValidationSchema.safeParse(req.body)
  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid feedback data.',
      errors: parseResult.error.flatten().fieldErrors,
    })
    return
  }

  try {
    // Verify the recommendation belongs to this user before mutating
    const exists = await Recommendation.findOne({
      _id: new mongoose.Types.ObjectId(recommendationId),
      userId: new mongoose.Types.ObjectId(userId),
    })
    if (!exists) {
      res.status(404).json({
        success: false,
        message: 'Recommendation not found or access denied.',
      })
      return
    }

    const recommendation = await TreatmentRecommendationService.recordFeedback(
      recommendationId,
      userId,
      parseResult.data,
    )

    res.status(201).json({
      success: true,
      message: 'Feedback recorded. Thank you for helping us improve recommendations.',
      data: { recommendation },
    })
  } catch (error) {
    logger.error(`Error submitting feedback for recommendation ${recommendationId}`, error)
    next(error)
  }
}

