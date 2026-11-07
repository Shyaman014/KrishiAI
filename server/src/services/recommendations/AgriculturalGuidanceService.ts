/**
 * Agricultural Guidance Service:
 * Personalizes agronomic advice based on growth stage, farmer observations,
 * location, and previous scan history without making speculative assumptions.
 */

export interface PersonalizationContext {
  cropName: string
  growthStage?: string
  fieldLocation?: string
  farmerObservations?: string
  isHealthy: boolean
}

export class AgriculturalGuidanceService {
  /**
   * Generates growth-stage specific agronomic advice.
   */
  public static getStageSpecificAdvice(context: PersonalizationContext): string {
    const stage = (context.growthStage || 'vegetative').toLowerCase()

    if (context.isHealthy) {
      switch (stage) {
        case 'sowing':
          return 'Seedling & Emergence Stage: Maintain uniform bed moisture and protect tender seedlings from damping-off and direct bird pecking.'
        case 'flowering':
          return 'Flowering & Pollination Stage: Maintain steady soil moisture to prevent blossom abortion. Do not apply any toxic sprays during daytime bee foraging hours.'
        case 'fruiting':
          return 'Fruit Development & Bulking Stage: Ensure adequate calcium and potassium fertigation to ensure strong fruit cuticle development and prevent blossom-end rot.'
        case 'harvesting':
          return 'Harvesting Stage: Pick mature fruits during dry morning hours. Sanitize picking crates and handle crop gently to avoid transit bruising.'
        case 'vegetative':
        default:
          return 'Active Vegetative Growth Stage: Prune non-productive lower suckers in dry sunny weather to stimulate apical dominance and open canopy airflow.'
      }
    }

    // Diseased crop stage-specific guidance
    switch (stage) {
      case 'sowing':
        return 'Critical Early Stage Alert: Pathogen infection at the seedling or transplant stage can cause severe stand loss. Rogue out infected seedlings immediately before transplanting to the main field.'
      case 'flowering':
        return 'Sensitive Pollination Stage Warning: Avoid applying harsh chemical sprays while flowers are open. If fungicide is essential, apply strictly during late dusk hours after pollinators have returned to hives.'
      case 'fruiting':
        return 'Pre-Harvest Interval (PHI) Notice: When applying any treatments on developing or maturing fruits, strictly follow the mandatory withholding period (waiting days before harvest) specified on the official label.'
      case 'harvesting':
        return 'Harvest Phase Safety: Do NOT apply synthetic chemical fungicides within the pre-harvest cutoff window. Prioritize physical removal and clean post-harvest grading.'
      case 'vegetative':
      default:
        return 'Vegetative Canopy Management: Prune infected lower foliage up to 30 cm above ground level to eliminate soil-to-leaf splash bridges and improve airflow.'
    }
  }

  /**
   * Synthesizes personalized guidance notes based on farmer observations and field plot location.
   */
  public static getContextualNotes(context: PersonalizationContext): string {
    const notes: string[] = []

    if (context.fieldLocation && context.fieldLocation.trim().length > 0) {
      notes.push(`Plot Context: Guidance customized for plot location "${context.fieldLocation.trim()}".`)
    }

    if (context.farmerObservations && context.farmerObservations.trim().length > 0) {
      notes.push(
        `Farmer Note Consideration: Evaluated reported observations: "${context.farmerObservations.trim()}". Ensure symptoms are not confused with abiotic nutritional stress.`,
      )
    }

    if (notes.length === 0) {
      notes.push('General Regional Advisory: Standard extension practices applied. Update field location and observations for deeper personalization.')
    }

    return notes.join(' ')
  }

  /**
   * Generates expert consultation recommendations tailored to severity.
   */
  public static getExpertGuidance(isHealthy: boolean, confidence: number): string {
    if (isHealthy) {
      return 'Routine Agronomic Care: No emergency intervention needed. Contact your local Krishi Vigyan Kendra (KVK) or block agricultural officer if unexpected foliar discoloration occurs.'
    }

    if (confidence < 60) {
      return 'Low Confidence Diagnostic Alert: Because AI diagnostic confidence is below 60%, do NOT purchase or spray commercial chemicals without taking a fresh leaf specimen to your local KVK or agricultural extension counter for confirmation.'
    }

    return 'Professional Extension Guidance: If foliar lesions or blight symptoms expand across more than 15-20% of your crop canopy within 5 to 7 days, consult your local district agricultural extension specialist or KVK plant pathologist immediately.'
  }
}

