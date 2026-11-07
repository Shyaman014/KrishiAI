/**
 * Structured Agricultural Knowledge Base for Disease Management & Recommendations.
 * Grounded in official institutional publications:
 * - ICAR (Indian Council of Agricultural Research)
 * - TNAU Agritech Portal (Tamil Nadu Agricultural University)
 * - CIBRC (Central Insecticides Board & Registration Committee, Government of India)
 * - State Agricultural Universities & KVK Extension Guidelines
 */

import {
  IImmediateAction,
  ICulturalPractice,
  IBiologicalControl,
  IChemicalTreatment,
} from '../../models/Recommendation'

export interface StructuredDiseaseTreatment {
  scientificName: string
  crop: string
  disease: string
  isHealthy: boolean
  immediateActions: IImmediateAction[]
  culturalPractices: ICulturalPractice[]
  biologicalControls: IBiologicalControl[]
  chemicalTreatments: IChemicalTreatment[]
  safetyPrecautions: string[]
  referenceSources: string[]
}

export const DISEASE_TREATMENT_KNOWLEDGE: Record<string, StructuredDiseaseTreatment> = {
  // ---------------- Tomato ----------------
  'Tomato___Early_blight': {
    scientificName: 'Alternaria solani',
    crop: 'Tomato',
    disease: 'Early Blight',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Strip Lower Symptomatic Leaves',
        urgency: 'high',
        instructions:
          'Carefully hand-prune and bag the bottom 25-30 cm of leaves displaying target-board brown rings. Do not compost; burn or bury deeply off-field.',
      },
      {
        action: 'Avoid Handling Foliage When Wet',
        urgency: 'critical',
        instructions:
          'Do not walk through or prune tomato rows while morning dew or rain droplets remain on leaves, as fungal conidia are readily spread by wet contact.',
      },
      {
        action: 'Inspect Adjacent Solanaceous Rows',
        urgency: 'medium',
        instructions:
          'Check adjacent potato, eggplant, and pepper plots for concentric brown spotting to catch early secondary spread.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Transition to Drip Irrigation',
        details:
          'Replace overhead sprinklers with drip or furrow irrigation to eliminate splash dispersal of soil-borne Alternaria spores.',
        stageApplicability: 'Vegetative to Fruiting',
      },
      {
        practice: 'Stake and Trellis Indeterminate Vines',
        details:
          'Tie vines to bamboo or wooden stakes to elevate foliage at least 30 cm above the bare soil line and maximize sunlight penetration.',
        stageApplicability: 'Vegetative',
      },
      {
        practice: 'Apply Plastic or Straw Mulch',
        details:
          'Lay clean paddy straw or black UV-stabilized plastic mulch across the raised beds to act as a physical barrier over soil inoculum.',
        stageApplicability: 'Sowing to Harvesting',
      },
      {
        practice: 'Execute 3-Year Crop Rotation',
        details:
          'Rotate out of solanaceous crops with cereals (maize, wheat) or legumes (chickpea, cowpea) for at least 3 consecutive seasons.',
        stageApplicability: 'Post-Harvest Planning',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Trichoderma viride / T. harzianum',
        targetPathogen: 'Alternaria solani fungal hyphae',
        applicationMethod:
          'Foliar spray of wettable bio-agent powder @ 5 g/L during late afternoon hours; also apply as root drench during transplanting.',
        limitations:
          'Efficacy is preventive; will not cure already necrotized leaf tissue. Do not tank-mix with chemical fungicides.',
      },
      {
        agentName: 'Pseudomonas fluorescens',
        targetPathogen: 'Alternaria spore germination',
        applicationMethod:
          'Spray 0.2% liquid bio-formulation (2 ml/L) at 10-day intervals beginning at first vegetative canopy closure.',
        limitations:
          'Requires moist, non-saline conditions to colonize the phyllosphere effectively.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Mancozeb 75% WP',
        registeredProductExample: 'Dithane M-45 (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Wear rubber gloves and face mask during spray preparation',
          'Do not apply within 7 days of harvest (Waiting Period: 7 days)',
          'Apply during calm early morning or late evening hours to avoid drift',
        ],
        ppeRequired: ['Chemical-resistant gloves', 'Protective eyewear', 'Dust/mist respirator mask'],
        withholdingPeriodDays: 7,
        expertConsultationNote:
          'Consult local KVK or extension officer for approved regional application rates and resistance-management tank partners.',
      },
      {
        activeIngredient: 'Chlorothalonil 75% WP',
        registeredProductExample: 'Kavach (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Avoid inhalation and eye contact; highly toxic to fish and aquatic invertebrates',
          'Do not apply on waterlogged or cracked soil near water bodies',
        ],
        ppeRequired: ['Rubber boots', 'Full-body apron', 'Safety goggles'],
        withholdingPeriodDays: 5,
        expertConsultationNote:
          'Do not exceed the maximum seasonal label spray allowance to prevent environmental accumulation.',
      },
    ],
    safetyPrecautions: [
      'Always follow CIBRC registered label recommendations and respect the Pre-Harvest Interval (PHI).',
      'Never wash spray equipment in canals, village ponds, or domestic water sources.',
      'Dispose of empty pesticide containers by triple-rinsing, puncturing, and burying per official guidelines.',
    ],
    referenceSources: [
      'ICAR - Indian Institute of Vegetable Research (IIVR) Tomato Advisory',
      'CIBRC - Major Uses of Fungicides Registered Under the Insecticides Act, 1968',
      'TNAU Agritech Portal - Crop Protection: Tomato Early Blight',
    ],
  },

  'Tomato___Late_blight': {
    scientificName: 'Phytophthora infestans',
    crop: 'Tomato',
    disease: 'Late Blight',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Bag and Remove Heavily Infected Vines',
        urgency: 'critical',
        instructions:
          'Carefully place infected plants into plastic bags in the morning before moving them out of the field to prevent releasing millions of airborne sporangia.',
      },
      {
        action: 'Alert Neighboring Tomato and Potato Growers',
        urgency: 'critical',
        instructions:
          'Late blight is a community-level emergency; airborne spores can spread several kilometers under cool, humid overcast winds.',
      },
      {
        action: 'Halt All Overhead Irrigation Immediately',
        urgency: 'high',
        instructions:
          'Free water on foliage accelerates zoospore swimming and penetration within 2 to 3 hours.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Widen Inter-Row Spacing',
        details:
          'Space plants at least 60-75 cm apart to ensure rapid wind drying and avoid prolonged leaf moisture.',
        stageApplicability: 'Transplanting',
      },
      {
        practice: 'Eradicate Solanaceous Weeds & Volunteer Potatoes',
        details:
          'Eliminate nightshade weeds and potato cull piles within 500 meters of the tomato field.',
        stageApplicability: 'Pre-Planting to Harvest',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Bacillus amyloliquefaciens',
        targetPathogen: 'Phytophthora zoospore motility',
        applicationMethod:
          'Apply as preventive bio-fungicide foliar spray before rainy cool fronts.',
        limitations:
          'Under active late blight epidemic conditions, bio-agents provide insufficient standalone control; use as part of an IPM program.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Cymoxanil 8% + Mancozeb 64% WP',
        registeredProductExample: 'Curzate M-8 (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Possesses translaminar activity; apply within 48 hours of infection event for best efficacy',
          'Observe 10-day pre-harvest waiting interval',
        ],
        ppeRequired: ['Rubber gloves', 'Protective clothing', 'Respirator'],
        withholdingPeriodDays: 10,
        expertConsultationNote:
          'Rotate with protectant fungicides of different mode of action (FRAC group) to avoid oomycete resistance.',
      },
    ],
    safetyPrecautions: [
      'Late blight requires immediate proactive community response. Coordinate with district agricultural authorities.',
    ],
    referenceSources: [
      'ICAR - IIVR Tomato Late Blight Management Bulletins',
      'TNAU Agritech Portal - Tomato Late Blight',
      'CIBRC Registered Fungicides List',
    ],
  },

  'Tomato___Bacterial_spot': {
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    crop: 'Tomato',
    disease: 'Bacterial Spot',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Sanitize Tools in 70% Alcohol or 10% Bleach',
        urgency: 'high',
        instructions:
          'Disinfect pruning knives, shears, and stakes between plants to halt sap-borne bacterial dissemination.',
      },
      {
        action: 'Avoid Working in Wet Canopies',
        urgency: 'high',
        instructions:
          'Bacterial cells are suspended in water droplets and easily spread by clothing or equipment.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Install Drip Irrigation Under Mulch',
        details:
          'Eliminate splashing rain or overhead water to stop bacteria from splashing upward from soil.',
        stageApplicability: 'All stages',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Bacillus subtilis',
        targetPathogen: 'Xanthomonas bacterial colonies',
        applicationMethod: 'Foliar spray @ 5 ml/L preventive at weekly intervals.',
        limitations: 'Cannot cure deep bacterial lesions on mature fruit.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Copper Hydroxide 77% WP',
        registeredProductExample: 'Kocide 2000 (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Do not apply during intense daytime heat to avoid chemical leaf phytotoxicity',
          'Observe pre-harvest interval of 3 days',
        ],
        ppeRequired: ['Eye goggles', 'Gloves', 'Long-sleeved shirt'],
        withholdingPeriodDays: 3,
        expertConsultationNote:
          'Combine with mancozeb for improved synergistic bacterial suppression in high-disease pressure areas.',
      },
    ],
    safetyPrecautions: [
      'Excessive copper applications can lead to soil copper buildup. Follow state extension maximum application rules.',
    ],
    referenceSources: [
      'ICAR - IIVR Vegetable Pathology',
      'TNAU Agritech Portal - Bacterial Diseases of Tomato',
    ],
  },

  'Tomato___healthy': {
    scientificName: 'Solanum lycopersicum',
    crop: 'Tomato',
    disease: 'Healthy Foliage',
    isHealthy: true,
    immediateActions: [
      {
        action: 'Maintain Routine Crop Scouting',
        urgency: 'low',
        instructions:
          'Continue inspecting lower leaves twice weekly for early signs of water-soaking, spots, or pest eggs.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Balanced NPK Nutrition & Calcium Drenching',
        details:
          'Ensure adequate calcium in soil and avoid extreme drought fluctuations to prevent blossom-end rot.',
        stageApplicability: 'Flowering to Fruiting',
      },
      {
        practice: 'Regular Pruning of Non-Productive Suckers',
        details:
          'Prune axillary suckers on indeterminate vines in dry sunny mornings to channel nutrients to developing fruit clusters.',
        stageApplicability: 'Vegetative to Fruiting',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Beneficial Soil Microbes (VAM / Rhizobacteria)',
        targetPathogen: 'Root zone health promotion',
        applicationMethod: 'Soil application at transplanting.',
        limitations: 'General growth promoter; not a pesticide.',
      },
    ],
    chemicalTreatments: [],
    safetyPrecautions: [
      'No synthetic chemical sprays are required on healthy foliage. Conserve beneficial predatory insects.',
    ],
    referenceSources: [
      'ICAR - Good Agricultural Practices (GAP) for Tomato',
      'TNAU Agritech Portal - Tomato Agronomy',
    ],
  },

  // ---------------- Potato ----------------
  'Potato___Early_blight': {
    scientificName: 'Alternaria solani',
    crop: 'Potato',
    disease: 'Early Blight',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Inspect Lower Foliage and Stem Base',
        urgency: 'high',
        instructions:
          'Check the lowest 20 cm of potato canopy for dark brown concentric spots before the disease progresses to upper leaves.',
      },
      {
        action: 'Avoid Overhead Sprinklers in Late Afternoon',
        urgency: 'high',
        instructions:
          'Irrigate in the early morning so foliage dries quickly under morning sun.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Earthing Up (Hilling) to Protect Tubers',
        details:
          'Maintain a tall, broad soil mound over developing tubers so spores washed down by rain do not reach tuber skin.',
        stageApplicability: 'Vegetative to Tuber Bulking',
      },
      {
        practice: 'Haulm Destruction Before Harvest',
        details:
          'Cut or defoliate potato vines 10 to 14 days before harvest to allow tuber skins to harden and prevent harvesting infection.',
        stageApplicability: 'Pre-Harvest',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Trichoderma viride',
        targetPathogen: 'Alternaria solani mycelium',
        applicationMethod: 'Foliar spray @ 4 g/L during vegetative growth.',
        limitations: 'Preventive only; must be applied before broad-scale necrosis.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Mancozeb 75% WP',
        registeredProductExample: 'Indofil M-45 (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Maintain 7-day pre-harvest waiting interval',
          'Use protective mask and rubber gloves during handling',
        ],
        ppeRequired: ['Respirator', 'Gloves', 'Eye protection'],
        withholdingPeriodDays: 7,
        expertConsultationNote:
          'Apply at first sighting of lower leaf spotting in accordance with state agricultural university schedules.',
      },
    ],
    safetyPrecautions: [
      'Do not feed infected crop residues to livestock. Bury or compost properly.',
    ],
    referenceSources: [
      'ICAR - Central Potato Research Institute (CPRI) Disease Bulletins',
      'TNAU Agritech Portal - Potato Crop Protection',
    ],
  },

  'Potato___Late_blight': {
    scientificName: 'Phytophthora infestans',
    crop: 'Potato',
    disease: 'Late Blight',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Implement Immediate Haulm Cutting if Tubers are Matured',
        urgency: 'critical',
        instructions:
          'If potato tubers have reached market size, slash and kill all vines immediately to prevent oospores from washing down into the soil.',
      },
      {
        action: 'Do Not Harvest in Wet Soils',
        urgency: 'critical',
        instructions:
          'Harvesting during muddy conditions smears blight spores across tuber skins, causing catastrophic storage rot.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Build Wide Protective Soil Ridges',
        details:
          'Ensure at least 10 cm of clean soil cover over all tuber shoulders to create a physical filter.',
        stageApplicability: 'Hilling / Tuberization',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Bacillus subtilis Bio-Fungicide',
        targetPathogen: 'Phytophthora sporangia germination',
        applicationMethod: 'Preventive spray during low-disease pressure windows.',
        limitations: 'Ineffective during rapid epidemic outbreaks under prolonged cool fog.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Metalaxyl 8% + Mancozeb 64% WP',
        registeredProductExample: 'Ridomil MZ (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Systemic + protectant combination. Observe 14-day pre-harvest waiting period',
          'Do not apply more than twice per season to prevent systemic resistance',
        ],
        ppeRequired: ['Rubber gloves', 'Respirator mask', 'Eye protection', 'Coveralls'],
        withholdingPeriodDays: 14,
        expertConsultationNote:
          'Follow CPRI / regional forecast advisories for spray timing.',
      },
    ],
    safetyPrecautions: [
      'Late blight is extremely destructive; consult local KVK potato agronomist immediately upon field confirmation.',
    ],
    referenceSources: [
      'ICAR - Central Potato Research Institute (CPRI) Shimla',
      'CIBRC Major Uses of Registered Pesticides',
    ],
  },

  'Potato___healthy': {
    scientificName: 'Solanum tuberosum',
    crop: 'Potato',
    disease: 'Healthy Foliage',
    isHealthy: true,
    immediateActions: [
      {
        action: 'Routine Scouting and Tuber Check',
        urgency: 'low',
        instructions:
          'Check representative plants across the plot every 4-5 days to ensure no green tubers are exposed to sunlight.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Balanced Potassium and Moisture Management',
        details:
          'Maintain steady soil moisture during tuber bulking. Adequate potassium improves starch content and skin resistance.',
        stageApplicability: 'Tuber Bulking',
      },
    ],
    biologicalControls: [],
    chemicalTreatments: [],
    safetyPrecautions: ['No chemical treatments required. Protect natural parasitoids and lady beetles.'],
    referenceSources: [
      'ICAR - CPRI Good Agricultural Practices',
      'TNAU Agritech Portal - Potato Agronomy',
    ],
  },

  // ---------------- Pepper (Bell Pepper) ----------------
  'Pepper__bell___Bacterial_spot': {
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    crop: 'Bell Pepper',
    disease: 'Bacterial Spot',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Disinfect Harvest Bins and Pruning Shears',
        urgency: 'high',
        instructions:
          'Wash all equipment with clean disinfectant solution before moving between crop blocks.',
      },
      {
        action: 'Avoid Touching Plants While Wet',
        urgency: 'high',
        instructions:
          'Bacteria multiply in leaf surface moisture films and enter through stomata and handling abrasions.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Raised Beds and Drip Fertigation',
        details:
          'Cultivate on raised beds to promote soil aeration and prevent standing water in root zones.',
        stageApplicability: 'All stages',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Bacillus amyloliquefaciens',
        targetPathogen: 'Xanthomonas bacterial colonies',
        applicationMethod: 'Foliar spray @ 5 ml/L during early vegetative stages.',
        limitations: 'Must be applied prior to widespread fruit scab development.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Copper Oxychloride 50% WP',
        registeredProductExample: 'Blitox 50 (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Do not spray during noon hours to prevent leaf scorching',
          'Pre-harvest interval: 5 days',
        ],
        ppeRequired: ['Rubber gloves', 'Eye goggles', 'Mask'],
        withholdingPeriodDays: 5,
        expertConsultationNote: 'Combine with Mancozeb per university extension recommendation for synergy.',
      },
    ],
    safetyPrecautions: ['Respect pre-harvest intervals to ensure zero chemical residue on fresh bell peppers.'],
    referenceSources: [
      'ICAR - IIHR Bell Pepper Pathology',
      'TNAU Agritech Portal - Chilli & Bell Pepper Protection',
    ],
  },

  'Pepper__bell___healthy': {
    scientificName: 'Capsicum annuum',
    crop: 'Bell Pepper',
    disease: 'Healthy Foliage',
    isHealthy: true,
    immediateActions: [
      {
        action: 'Maintain Weed-Free Borders',
        urgency: 'low',
        instructions: 'Clear border weeds that may harbor thrips, aphids, or whiteflies.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Drip Fertigation with Calcium and Boron',
        details: 'Balanced micronutrients promote firm fruit walls and prevent blossom-end rot.',
        stageApplicability: 'Flowering to Fruiting',
      },
    ],
    biologicalControls: [],
    chemicalTreatments: [],
    safetyPrecautions: ['No chemical treatments required.'],
    referenceSources: ['TNAU Agritech Portal - Bell Pepper Production Guide'],
  },

  // ---------------- Corn / Maize ----------------
  'Corn_(maize)___Common_rust_': {
    scientificName: 'Puccinia sorghi',
    crop: 'Corn (Maize)',
    disease: 'Common Rust',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Assess Disease Severity on Ear Leaves',
        urgency: 'high',
        instructions:
          'Count rust pustules on the critical ear leaf and leaves above it; pustules below the ear leaf rarely cause economic damage.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Plant Rust-Resistant Hybrid Seed',
        details: 'Select maize hybrids with documented Rp resistance genes for next season planting.',
        stageApplicability: 'Pre-Season Planning',
      },
      {
        practice: 'Early Planting in Season',
        details: 'Plant early to avoid late-summer airborne spore showers during sensitive pollination.',
        stageApplicability: 'Sowing',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Ampelomyces quisqualis',
        targetPathogen: 'Puccinia rust urediniospores',
        applicationMethod: 'Experimental bio-parasite; applied under humid canopy conditions.',
        limitations: 'Limited commercial availability for large-scale field corn.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Propiconazole 25% EC',
        registeredProductExample: 'Tilt 25 EC (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Pre-harvest interval of 30 days on grain corn',
          'Only spray if rust pustules cover more than 5% of ear leaf area before silking',
        ],
        ppeRequired: ['Protective goggles', 'Rubber gloves', 'Protective coverall'],
        withholdingPeriodDays: 30,
        expertConsultationNote:
          'Consult local district maize specialist; chemical treatment is rarely economical on commercial field corn unless hybrid is highly susceptible.',
      },
    ],
    safetyPrecautions: ['Observe 30-day pre-harvest waiting interval before harvesting green fodder or grain.'],
    referenceSources: [
      'ICAR - Indian Institute of Maize Research (IIMR)',
      'TNAU Agritech Portal - Maize Common Rust',
      'CIBRC Registered Pesticides Database',
    ],
  },

  'Corn_(maize)___Northern_Leaf_Blight': {
    scientificName: 'Exserohilum turcicum',
    crop: 'Corn (Maize)',
    disease: 'Northern Leaf Blight',
    isHealthy: false,
    immediateActions: [
      {
        action: 'Scout Middle and Upper Canopy at Tasseling',
        urgency: 'high',
        instructions:
          'Inspect leaves around the developing ear for long, cigar-shaped grayish-green lesions.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Deep Incorporation of Crop Stubble',
        details:
          'Shred and plow under corn residues post-harvest to speed up fungal decomposition and reduce overwintering survival.',
        stageApplicability: 'Post-Harvest',
      },
      {
        practice: 'Rotate with Non-Host Legumes or Cereals',
        details:
          'Rotate out of maize for 1 to 2 seasons with soybean, groundnut, or chickpea.',
        stageApplicability: 'Crop Planning',
      },
    ],
    biologicalControls: [
      {
        agentName: 'Trichoderma viride Bio-Agent',
        targetPathogen: 'Exserohilum turcicum fungal mycelium',
        applicationMethod: 'Foliar spray @ 5 g/L during late whorl stage.',
        limitations: 'Efficacy is moderate; best utilized in an IPM combination.',
      },
    ],
    chemicalTreatments: [
      {
        activeIngredient: 'Azoxystrobin 18.2% + Difenoconazole 11.4% SC',
        registeredProductExample: 'Amistar Top (CIBRC Registered)',
        cibrcApproved: true,
        labelPrecautions: [
          'Pre-harvest interval: 26 days',
          'Do not apply more than 2 sequential sprays to prevent strobilurin resistance',
        ],
        ppeRequired: ['Rubber gloves', 'Eye goggles', 'Respirator mask'],
        withholdingPeriodDays: 26,
        expertConsultationNote:
          'Only spray if economic threshold is reached (lesions visible on leaves below ear prior to tasseling).',
      },
    ],
    safetyPrecautions: ['Follow registered label rates strictly. Avoid chemical contamination of groundwater.'],
    referenceSources: [
      'ICAR - IIMR Northern Corn Leaf Blight Bulletins',
      'TNAU Agritech Portal - Maize Protection',
    ],
  },

  'Corn_(maize)___healthy': {
    scientificName: 'Zea mays',
    crop: 'Corn (Maize)',
    disease: 'Healthy Foliage',
    isHealthy: true,
    immediateActions: [
      {
        action: 'Monitor Canopy for Armyworm & Stem Borer Infestation',
        urgency: 'low',
        instructions: 'Check central whorls for insect frass or shot-hole feeding signs.',
      },
    ],
    culturalPractices: [
      {
        practice: 'Split Nitrogen Application Aligned with Growth',
        details: 'Apply nitrogen in 3 split doses: at sowing, knee-high stage (V6), and tasseling (VT).',
        stageApplicability: 'Vegetative to Tasseling',
      },
    ],
    biologicalControls: [],
    chemicalTreatments: [],
    safetyPrecautions: ['No chemical intervention required for healthy corn.'],
    referenceSources: ['ICAR - IIMR Good Agronomic Practices for Maize'],
  },
}

export class DiseaseKnowledgeService {
  /**
   * Retrieves verified structured treatment knowledge for a disease and crop combination.
   */
  public static getTreatmentKnowledge(
    cropName: string,
    diseaseName: string,
  ): StructuredDiseaseTreatment | null {
    // 1. Direct class key match
    const compositeKey = `${cropName}___${diseaseName.replace(/[\s()]/g, '_')}`
    if (DISEASE_TREATMENT_KNOWLEDGE[compositeKey]) {
      return DISEASE_TREATMENT_KNOWLEDGE[compositeKey]
    }

    // 2. Fuzzy match across known disease keys
    const targetCrop = cropName.toLowerCase()
    const targetDisease = diseaseName.toLowerCase()

    for (const [key, data] of Object.entries(DISEASE_TREATMENT_KNOWLEDGE)) {
      const entryCrop = data.crop.toLowerCase()
      const entryDisease = data.disease.toLowerCase()
      const keyLower = key.toLowerCase()

      if (
        (targetCrop === entryCrop && targetDisease.includes(entryDisease)) ||
        (targetCrop === entryCrop && entryDisease.includes(targetDisease)) ||
        keyLower.includes(targetDisease.replace(/[\s()]/g, '_'))
      ) {
        return data
      }
    }

    // 3. Fallback to healthy profile if isHealthy is indicated
    if (targetDisease.includes('healthy')) {
      for (const data of Object.values(DISEASE_TREATMENT_KNOWLEDGE)) {
        if (data.crop.toLowerCase() === targetCrop && data.isHealthy) {
          return data
        }
      }
    }

    return null
  }
}

