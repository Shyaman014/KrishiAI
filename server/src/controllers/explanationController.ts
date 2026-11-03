import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import axios from 'axios'
import { Scan } from '../models/Scan'
import { User } from '../models/User'
import { Activity } from '../models/Activity'
import { env } from '../config/env'
import logger from '../utils/logger'

/**
 * GET /api/scans/:id/analysis
 *
 * Retrieves the comprehensive disease analysis and agronomic explanation
 * for an authenticated farmer's crop scan.
 */
export const getScanAnalysis = async (
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
    const scan = await Scan.findOne({ _id: scanId, userId })
    if (!scan) {
      res.status(404).json({ success: false, message: 'Scan record not found.' })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        scan: {
          id: scan._id.toString(),
          cropName: scan.cropName,
          cropCategory: scan.cropCategory,
          growthStage: scan.growthStage,
          fieldLocation: scan.fieldLocation,
          imageUrl: scan.imageUrl,
          diseaseName: scan.diseaseName,
          severity: scan.severity,
          confidence: scan.confidence,
          status: scan.status,
          predictedCrop: scan.predictedCrop,
          predictedDisease: scan.predictedDisease,
          isHealthy: scan.isHealthy,
          topPredictions: scan.topPredictions,
          modelVersion: scan.modelVersion,
          inferenceDurationMs: scan.inferenceDurationMs,
          analyzedAt: scan.analyzedAt,
          explanation: scan.explanation,
          hasExplanation: !!(scan.explanation && scan.explanation.status === 'available'),
          createdAt: scan.createdAt,
        },
      },
    })
  } catch (error) {
    logger.error(`Error fetching analysis for scan ${scanId}`, error)
    next(error)
  }
}

/**
 * POST /api/scans/:id/generate-explanation
 *
 * Triggers or regenerates an intelligent agricultural explanation & treatment
 * advisory using Google Gemini and verified agronomic knowledge.
 */
export const generateExplanation = async (
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
    // 1. Fetch scan with user isolation
    const scan = await Scan.findOne({ _id: scanId, userId })
    if (!scan) {
      res.status(404).json({ success: false, message: 'Scan record not found.' })
      return
    }

    // 2. Validate scan completion status
    if (scan.status === 'pending' || scan.status === 'processing') {
      res.status(400).json({
        success: false,
        message: 'Scan image has not completed AI classification yet. Please run analyze first.',
      })
      return
    }

    if (scan.status === 'failed') {
      res.status(400).json({
        success: false,
        message: 'Cannot generate explanation for a failed scan. Please re-scan with a clearer photo.',
      })
      return
    }

    // 3. Resolve preferred language (en | hi | as)
    let targetLanguage: 'en' | 'hi' | 'as' = 'en'
    if (req.body.language && ['en', 'hi', 'as'].includes(req.body.language)) {
      targetLanguage = req.body.language
    } else {
      const user = await User.findById(userId).select('preferredLanguage')
      if (user && ['en', 'hi', 'as'].includes(user.preferredLanguage)) {
        targetLanguage = user.preferredLanguage as 'en' | 'hi' | 'as'
      }
    }

    const regenerate = Boolean(req.body.regenerate)

    // 4. Duplicate guard: return existing explanation if already present in target language
    if (
      !regenerate &&
      scan.explanation &&
      scan.explanation.overview &&
      scan.explanation.status === 'available' &&
      scan.explanation.language === targetLanguage
    ) {
      res.status(200).json({
        success: true,
        message: 'Retrieved existing disease explanation.',
        data: {
          explanation: scan.explanation,
          cached: true,
        },
      })
      return
    }

    // 5. Build payload for FastAPI explain endpoint
    const explainPayload = {
      crop: scan.predictedCrop || scan.cropName,
      disease: scan.predictedDisease || scan.diseaseName,
      confidence: scan.confidence,
      is_healthy: Boolean(scan.isHealthy),
      status: scan.status,
      top_predictions: (scan.topPredictions || []).map((p) => ({
        class_id: p.classId,
        raw_class: p.rawClass,
        crop: p.crop,
        disease: p.disease,
        is_healthy: p.isHealthy,
        severity: p.severity,
        confidence: p.confidence,
      })),
      language: targetLanguage,
      scan_id: scanId,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (env.AI_SERVICE_INTERNAL_KEY) {
      headers['X-Internal-Key'] = env.AI_SERVICE_INTERNAL_KEY
    }

    // 6. Call Python FastAPI AI Service
    let aiResponse
    try {
      aiResponse = await axios.post(
        `${env.AI_SERVICE_URL}/api/v1/explain`,
        explainPayload,
        {
          headers,
          timeout: 45_000,
        },
      )
    } catch (aiErr: unknown) {
      logger.error(`AI service call failed during explanation generation for scan ${scanId}`, aiErr)
      scan.explanation = {
        overview: 'Temporary explanation service outage. Please retry shortly.',
        symptoms: [],
        causes: [],
        environmentalConditions: [],
        impactOnGrowth: '',
        earlyWarningSigns: [],
        severityExplanation: '',
        prevention: [],
        sanitation: [],
        treatment: {
          generalApproaches: [],
          chemicalGuidance: [],
          organicTreatments: [],
          whenToSeekHelp: 'Contact local Krishi Vigyan Kendra for manual assistance.',
        },
        disclaimer: 'Notice: Service unavailable. Consult local extension authorities.',
        language: targetLanguage,
        referenceSources: ['ICAR Extension'],
        modelIdentifier: 'error-fallback',
        generatedAt: new Date(),
        status: 'failed',
        error: 'AI service unreachable.',
      }
      await scan.save()

      res.status(502).json({
        success: false,
        message: 'AI explanation service is temporarily unavailable. Please retry in a few moments.',
      })
      return
    }

    const explanationResult = aiResponse.data.explanation

    // 7. Update Scan document with structured explanation
    scan.explanation = {
      scientificName: explanationResult.scientific_name,
      overview: explanationResult.overview,
      symptoms: explanationResult.symptoms || [],
      causes: explanationResult.causes || [],
      environmentalConditions: explanationResult.environmental_conditions || [],
      impactOnGrowth: explanationResult.impact_on_growth || '',
      earlyWarningSigns: explanationResult.early_warning_signs || [],
      severityExplanation: explanationResult.severity_explanation || '',
      prevention: explanationResult.prevention || [],
      sanitation: explanationResult.sanitation || [],
      treatment: {
        generalApproaches: explanationResult.treatment?.general_approaches || [],
        chemicalGuidance: explanationResult.treatment?.chemical_guidance || [],
        organicTreatments: explanationResult.treatment?.organic_treatments || [],
        whenToSeekHelp: explanationResult.treatment?.when_to_seek_help || '',
      },
      disclaimer: explanationResult.disclaimer,
      language: targetLanguage,
      referenceSources: explanationResult.reference_sources || [],
      modelIdentifier: explanationResult.model_identifier,
      generatedAt: new Date(explanationResult.generated_at || Date.now()),
      status: 'available',
      error: undefined,
    }

    await scan.save()

    // 8. Log user activity
    try {
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'explanation_generated',
        title: 'Agronomic Advisory Generated',
        description: `Disease explanation created for ${scan.cropName} (${scan.diseaseName}) in ${targetLanguage.toUpperCase()}.`,
        metadata: {
          scanId: scan._id.toString(),
          cropName: scan.cropName,
          disease: scan.diseaseName,
          language: targetLanguage,
          modelIdentifier: explanationResult.model_identifier,
        },
      })
    } catch (actErr) {
      logger.error('Failed to log explanation_generated activity', actErr)
    }

    logger.info(`Explanation saved for scan ${scanId} | ${targetLanguage} | ${explanationResult.model_identifier}`)

    res.status(200).json({
      success: true,
      message: 'Intelligent disease explanation generated successfully.',
      data: {
        explanation: scan.explanation,
        cached: false,
      },
    })
  } catch (error) {
    logger.error(`Error in generateExplanation for scan ${scanId}`, error)
    next(error)
  }
}
