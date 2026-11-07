/**
 * Treatment Recommendation Service:
 * Core orchestrator synthesizing disease knowledge, agricultural stage context,
 * validation boundaries, and persistence into intelligent farmer recommendations.
 */

import mongoose from 'mongoose'
import { IScan } from '../../models/Scan'
import {
  Recommendation,
  IRecommendation,
  RecommendationLanguage,
  IRecommendationFeedback,
} from '../../models/Recommendation'
import { DiseaseKnowledgeService } from './DiseaseKnowledgeService'
import { AgriculturalGuidanceService } from './AgriculturalGuidanceService'
import { RecommendationValidationService } from './RecommendationValidationService'
import { GeminiExplanationService } from './GeminiExplanationService'
import logger from '../../utils/logger'

export class TreatmentRecommendationService {
  /**
   * Retrieves the active recommendation for a given scan and user.
   */
  public static async getRecommendationForScan(
    scanId: string,
    userId: string,
  ): Promise<IRecommendation | null> {
    return Recommendation.findOne({
      scanId: new mongoose.Types.ObjectId(scanId),
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
    })
  }

  /**
   * Generates or regenerates an intelligent agricultural treatment recommendation.
   */
  public static async generateRecommendation(
    scan: IScan,
    userId: string,
    language: RecommendationLanguage = 'en',
    regenerate: boolean = false,
  ): Promise<IRecommendation> {
    const scanId = scan._id.toString()

    // 1. Validation check
    const eligibility = RecommendationValidationService.validateScanEligibility(scan)
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason || 'Scan is not eligible for treatment recommendation.')
    }

    // 2. Duplicate guard: return existing active recommendation if present in same language
    if (!regenerate) {
      const existing = await Recommendation.findOne({
        scanId: new mongoose.Types.ObjectId(scanId),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
        language,
      })
      if (existing) {
        logger.info(`Returning cached recommendation ${existing._id} for scan ${scanId}`)
        return existing
      }
    }

    // 3. Mark prior active recommendations as superseded if regenerating
    await Recommendation.updateMany(
      {
        scanId: new mongoose.Types.ObjectId(scanId),
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active',
      },
      { $set: { status: 'superseded' } },
    )

    // 4. Retrieve structured agricultural knowledge
    const cropName = scan.predictedCrop || scan.cropName
    const diseaseName = scan.predictedDisease || scan.diseaseName
    const knowledge = DiseaseKnowledgeService.getTreatmentKnowledge(cropName, diseaseName)

    // Context for personalization
    const context = {
      cropName,
      growthStage: scan.growthStage,
      fieldLocation: scan.fieldLocation,
      farmerObservations: scan.additionalObservations,
      isHealthy: Boolean(scan.isHealthy),
    }

    const stageSpecificAdvice = AgriculturalGuidanceService.getStageSpecificAdvice(context)
    const expertGuidance = AgriculturalGuidanceService.getExpertGuidance(
      Boolean(scan.isHealthy),
      scan.confidence,
    )

    // Build actions & practices
    const immediateActions = knowledge?.immediateActions || [
      {
        action: 'Routine Visual Inspection',
        urgency: 'low' as const,
        instructions: 'Scout adjacent plants and check for further foliar changes.',
      },
    ]

    const culturalPractices = knowledge?.culturalPractices || [
      {
        practice: 'Standard Cultural Hygiene',
        details: 'Maintain clean beds, optimal plant spacing, and drip irrigation.',
        stageApplicability: scan.growthStage || 'Vegetative',
      },
    ]

    const biologicalControls = knowledge?.biologicalControls || []

    // If chemical recommendations are disallowed (low confidence or healthy), strictly clear them
    const chemicalTreatments = eligibility.allowChemicals && knowledge?.chemicalTreatments
      ? RecommendationValidationService.sanitizeChemicalTreatments(knowledge.chemicalTreatments)
      : []

    const safetyPrecautions = knowledge?.safetyPrecautions || [
      'Always follow verified agricultural extension advisories and check container labels.',
    ]

    const referenceSources = knowledge?.referenceSources || [
      'ICAR - Indian Council of Agricultural Research',
      'TNAU Agritech Portal',
    ]

    // Summary text
    await GeminiExplanationService.generateSummary(
      cropName,
      diseaseName,
      Boolean(scan.isHealthy),
      language,
      immediateActions.length,
    )

    // 5. Create and persist recommendation document
    const recommendation = new Recommendation({
      scanId: new mongoose.Types.ObjectId(scanId),
      userId: new mongoose.Types.ObjectId(userId),
      cropName,
      diseaseName,
      isHealthy: Boolean(scan.isHealthy),
      confidence: scan.confidence,
      growthStage: scan.growthStage,
      fieldLocation: scan.fieldLocation,
      farmerObservations: scan.additionalObservations,
      immediateActions,
      culturalPractices,
      biologicalControls,
      chemicalTreatments,
      safetyPrecautions,
      stageSpecificAdvice,
      expertConsultationGuidance: expertGuidance,
      referenceSources,
      language,
      modelIdentifier: 'krishi-treatment-engine-v1',
      status: 'active',
    })

    await recommendation.save()
    logger.info(`Generated and saved recommendation ${recommendation._id} for scan ${scanId}`)

    return recommendation
  }

  /**
   * Records farmer feedback for an existing recommendation.
   */
  public static async recordFeedback(
    recommendationId: string,
    userId: string,
    feedbackData: Omit<IRecommendationFeedback, 'submittedAt'>,
  ): Promise<IRecommendation> {
    const recommendation = await Recommendation.findOne({
      _id: new mongoose.Types.ObjectId(recommendationId),
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (!recommendation) {
      throw new Error('Recommendation record not found or access denied.')
    }

    recommendation.feedback = {
      ...feedbackData,
      submittedAt: new Date(),
    }

    await recommendation.save()
    logger.info(`Recorded feedback for recommendation ${recommendationId} by user ${userId}`)

    return recommendation
  }
}

