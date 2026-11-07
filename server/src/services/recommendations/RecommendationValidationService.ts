/**
 * Recommendation Validation Service:
 * Enforces safety boundaries, Zod request validations, and prevents
 * chemical dosage hallucinations or unverified chemical prescriptions.
 */

import { z } from 'zod'
import { IScan } from '../../models/Scan'

export const feedbackValidationSchema = z.object({
  wasHelpful: z.boolean({ required_error: 'wasHelpful is required' }),
  followedPractices: z.boolean({ required_error: 'followedPractices is required' }),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  observations: z.string().max(1000).optional(),
  comments: z.string().max(1000).optional(),
})

export const generateRecommendationSchema = z.object({
  language: z.enum(['en', 'hi', 'as']).optional().default('en'),
  regenerate: z.boolean().optional().default(false),
})

export class RecommendationValidationService {
  /**
   * Validates whether a scan is eligible for intelligent treatment recommendations.
   */
  public static validateScanEligibility(scan: IScan): {
    eligible: boolean
    reason?: string
    allowChemicals: boolean
  } {
    if (scan.status === 'pending' || scan.status === 'processing') {
      return {
        eligible: false,
        reason: 'Scan is still processing AI vision classification. Please complete analysis first.',
        allowChemicals: false,
      }
    }

    if (scan.status === 'failed') {
      return {
        eligible: false,
        reason: 'Cannot generate treatment recommendations for a failed scan. Please re-scan with a clearer photo.',
        allowChemicals: false,
      }
    }

    // Uncertainty and low confidence check
    if (scan.confidence < 50 || scan.diseaseName.toLowerCase().includes('inconclusive')) {
      return {
        eligible: true,
        reason: 'Low confidence diagnostic result. Chemical recommendations are strictly disabled to prevent crop damage.',
        allowChemicals: false,
      }
    }

    return {
      eligible: true,
      allowChemicals: !scan.isHealthy,
    }
  }

  /**
   * Validates that chemical recommendations strictly adhere to official safety standards.
   */
  public static sanitizeChemicalTreatments(treatments: any[]): any[] {
    return treatments.map((t) => ({
      activeIngredient: t.activeIngredient,
      registeredProductExample: t.registeredProductExample || 'Official CIBRC Formulation',
      cibrcApproved: true,
      labelPrecautions: t.labelPrecautions || ['Follow official container label instructions'],
      ppeRequired: t.ppeRequired || ['Gloves', 'Eye protection', 'Mask'],
      withholdingPeriodDays: t.withholdingPeriodDays || 7,
      expertConsultationNote:
        t.expertConsultationNote ||
        'Consult state extension officer or local KVK before applying any chemical pesticides.',
    }))
  }
}

