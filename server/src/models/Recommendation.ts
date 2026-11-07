import mongoose, { Document, Schema, Model } from 'mongoose'

export type RecommendationLanguage = 'en' | 'hi' | 'as'
export type RecommendationStatus = 'active' | 'generating' | 'superseded' | 'failed'

export interface IImmediateAction {
  action: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  instructions: string
}

export interface ICulturalPractice {
  practice: string
  details: string
  stageApplicability?: string
}

export interface IBiologicalControl {
  agentName: string
  targetPathogen: string
  applicationMethod: string
  limitations: string
}

export interface IChemicalTreatment {
  activeIngredient: string
  registeredProductExample?: string
  cibrcApproved: boolean
  labelPrecautions: string[]
  ppeRequired: string[]
  withholdingPeriodDays?: number
  expertConsultationNote: string
}

export interface IRecommendationFeedback {
  wasHelpful: boolean
  followedPractices: boolean
  rating: number // 1 to 5
  observations?: string
  comments?: string
  submittedAt: Date
}

export interface IRecommendation extends Document {
  scanId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  cropName: string
  diseaseName: string
  isHealthy: boolean
  confidence: number
  growthStage?: string
  fieldLocation?: string
  farmerObservations?: string
  immediateActions: IImmediateAction[]
  culturalPractices: ICulturalPractice[]
  biologicalControls: IBiologicalControl[]
  chemicalTreatments: IChemicalTreatment[]
  safetyPrecautions: string[]
  stageSpecificAdvice: string
  expertConsultationGuidance: string
  referenceSources: string[]
  language: RecommendationLanguage
  modelIdentifier: string
  status: RecommendationStatus
  feedback?: IRecommendationFeedback
  createdAt: Date
  updatedAt: Date
}

const ImmediateActionSchema = new Schema<IImmediateAction>(
  {
    action: { type: String, required: true, trim: true },
    urgency: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
    },
    instructions: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const CulturalPracticeSchema = new Schema<ICulturalPractice>(
  {
    practice: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    stageApplicability: { type: String, trim: true },
  },
  { _id: false },
)

const BiologicalControlSchema = new Schema<IBiologicalControl>(
  {
    agentName: { type: String, required: true, trim: true },
    targetPathogen: { type: String, required: true, trim: true },
    applicationMethod: { type: String, required: true, trim: true },
    limitations: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const ChemicalTreatmentSchema = new Schema<IChemicalTreatment>(
  {
    activeIngredient: { type: String, required: true, trim: true },
    registeredProductExample: { type: String, trim: true },
    cibrcApproved: { type: Boolean, default: true },
    labelPrecautions: [{ type: String, trim: true }],
    ppeRequired: [{ type: String, trim: true }],
    withholdingPeriodDays: { type: Number },
    expertConsultationNote: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const RecommendationFeedbackSchema = new Schema<IRecommendationFeedback>(
  {
    wasHelpful: { type: Boolean, required: true },
    followedPractices: { type: Boolean, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    observations: { type: String, trim: true },
    comments: { type: String, trim: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const RecommendationSchema = new Schema<IRecommendation>(
  {
    scanId: {
      type: Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropName: { type: String, required: true, trim: true },
    diseaseName: { type: String, required: true, trim: true },
    isHealthy: { type: Boolean, default: false },
    confidence: { type: Number, required: true },
    growthStage: { type: String, trim: true },
    fieldLocation: { type: String, trim: true },
    farmerObservations: { type: String, trim: true },
    immediateActions: [ImmediateActionSchema],
    culturalPractices: [CulturalPracticeSchema],
    biologicalControls: [BiologicalControlSchema],
    chemicalTreatments: [ChemicalTreatmentSchema],
    safetyPrecautions: [{ type: String, trim: true }],
    stageSpecificAdvice: { type: String, trim: true },
    expertConsultationGuidance: { type: String, trim: true },
    referenceSources: [{ type: String, trim: true }],
    language: {
      type: String,
      enum: ['en', 'hi', 'as'],
      default: 'en',
    },
    modelIdentifier: { type: String, default: 'krishi-treatment-engine-v1', trim: true },
    status: {
      type: String,
      enum: ['active', 'generating', 'superseded', 'failed'],
      default: 'active',
      index: true,
    },
    feedback: { type: RecommendationFeedbackSchema, default: undefined },
  },
  {
    timestamps: true,
  },
)

RecommendationSchema.index({ scanId: 1, createdAt: -1 })
RecommendationSchema.index({ userId: 1, createdAt: -1 })

export const Recommendation: Model<IRecommendation> =
  mongoose.models.Recommendation ||
  mongoose.model<IRecommendation>('Recommendation', RecommendationSchema)

