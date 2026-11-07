/**
 * Gemini Explanation Service:
 * Translates and contextualizes recommendation guidance using Google Gemini or
 * reliable multilingual templates when Gemini API is offline.
 */

import axios from 'axios'
import { env } from '../../config/env'
import logger from '../../utils/logger'
import { RecommendationLanguage } from '../../models/Recommendation'

export class GeminiExplanationService {
  /**
   * Generates a conversational multilingual summary of recommended actions.
   */
  public static async generateSummary(
    cropName: string,
    diseaseName: string,
    isHealthy: boolean,
    language: RecommendationLanguage = 'en',
    immediateActionsCount: number,
  ): Promise<string> {
    if (isHealthy) {
      if (language === 'hi') {
        return `आपकी ${cropName} की फसल स्वस्थ और रोगमुक्त दिखाई दे रही है। अनुशंसित संतुलित पोषण और नियमित निगरानी जारी रखें।`
      }
      if (language === 'as') {
        return `আপোনাৰ ${cropName} শস্য স্বাস্থ্যৱান আৰু নিৰোগী দেখা গৈছে। নিয়মিত পৰ্যবেক্ষণ আৰু উপযুক্ত পুষ্টি পৰিচালনা অব্যাহত ৰাখক।`
      }
      return `Your ${cropName} foliage appears healthy with no active pathogen detected. Maintain standard agronomic monitoring and balanced fertigation.`
    }

    // Try calling AI service explanation if configured
    try {
      if (env.AI_SERVICE_URL) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (env.AI_SERVICE_INTERNAL_KEY) {
          headers['X-Internal-Key'] = env.AI_SERVICE_INTERNAL_KEY
        }

        const res = await axios.post(
          `${env.AI_SERVICE_URL}/api/v1/explain`,
          {
            crop: cropName,
            disease: diseaseName,
            confidence: 85,
            is_healthy: false,
            status: 'completed',
            language,
          },
          { headers, timeout: 10_000 },
        )

        if (res.data?.explanation?.overview) {
          return res.data.explanation.overview
        }
      }
    } catch (err) {
      logger.debug('AI service summary call skipped or failed, using structured template', err)
    }

    // Grounded Template Fallback
    if (language === 'hi') {
      return `${cropName} में ${diseaseName} के लक्षण पाए गए हैं। संक्रमण को रोकने के लिए ${immediateActionsCount} तत्काल निवारक कदम सुझाए गए हैं। रसायनों के उपयोग से पहले जैविक विकल्पों पर विचार करें।`
    }
    if (language === 'as') {
      return `${cropName} ত ${diseaseName} ৰ লক্ষণ চিনাক্ত কৰা হৈছে। সংক্ৰমণ ৰোধ কৰিবলৈ ${immediateActionsCount} টা প্ৰাথমিক ব্যৱস্থা গ্ৰহণ কৰক। ৰাসায়নিক স্প্ৰে' কৰাৰ আগতে জৈৱিক পদ্ধতি বিবেচনা কৰক।`
    }
    return `Identified ${diseaseName} on ${cropName}. ${immediateActionsCount} immediate cultural and preventive actions are recommended below to halt further spread. Prioritize non-chemical management before applying targeted sprays.`
  }
}

