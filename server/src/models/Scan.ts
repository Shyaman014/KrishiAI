import mongoose, { Document, Schema, Model } from 'mongoose'

export type ScanSeverity = 'healthy' | 'moderate' | 'high'
export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type CropCategory =
  | 'Cereals'
  | 'Vegetables'
  | 'Fruits'
  | 'Oilseeds'
  | 'Pulses'
  | 'Cash Crops'
  | 'Other'
export type GrowthStage = 'sowing' | 'vegetative' | 'flowering' | 'fruiting' | 'harvesting'

export interface IScan extends Document {
  userId: mongoose.Types.ObjectId
  cropId?: mongoose.Types.ObjectId
  cropName: string
  cropCategory?: CropCategory
  growthStage?: GrowthStage
  fieldLocation?: string
  imageUrl: string
  cloudinaryPublicId?: string
  diseaseName: string
  severity: ScanSeverity
  confidence: number // 0 to 100
  status: ScanStatus
  remediation?: string
  additionalObservations?: string
  // AI Analysis Results (populated by POST /api/scans/:id/analyze)
  predictedCrop?: string
  predictedDisease?: string
  isHealthy?: boolean
  topPredictions?: Array<{
    classId: number
    rawClass: string
    crop: string
    disease: string
    isHealthy: boolean
    severity: string
    confidence: number
  }>
  modelVersion?: string
  inferenceDurationMs?: number
  analyzedAt?: Date
  analysisError?: string
  // AI Agronomic Explanation (populated by POST /api/scans/:id/generate-explanation)
  explanation?: {
    scientificName?: string
    overview: string
    symptoms: string[]
    causes: string[]
    environmentalConditions: string[]
    impactOnGrowth: string
    earlyWarningSigns: string[]
    severityExplanation: string
    prevention: string[]
    sanitation: string[]
    treatment: {
      generalApproaches: string[]
      chemicalGuidance: string[]
      organicTreatments: string[]
      whenToSeekHelp: string
    }
    disclaimer: string
    language: 'en' | 'hi' | 'as'
    referenceSources: string[]
    modelIdentifier: string
    generatedAt: Date
    status: 'available' | 'generating' | 'failed'
    error?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ExplanationSchema = new Schema(
  {
    scientificName: { type: String, trim: true },
    overview: { type: String, trim: true },
    symptoms: [{ type: String, trim: true }],
    causes: [{ type: String, trim: true }],
    environmentalConditions: [{ type: String, trim: true }],
    impactOnGrowth: { type: String, trim: true },
    earlyWarningSigns: [{ type: String, trim: true }],
    severityExplanation: { type: String, trim: true },
    prevention: [{ type: String, trim: true }],
    sanitation: [{ type: String, trim: true }],
    treatment: {
      generalApproaches: [{ type: String, trim: true }],
      chemicalGuidance: [{ type: String, trim: true }],
      organicTreatments: [{ type: String, trim: true }],
      whenToSeekHelp: { type: String, trim: true },
    },
    disclaimer: { type: String, trim: true },
    language: { type: String, enum: ['en', 'hi', 'as'], default: 'en' },
    referenceSources: [{ type: String, trim: true }],
    modelIdentifier: { type: String, trim: true },
    generatedAt: { type: Date },
    status: { type: String, enum: ['available', 'generating', 'failed'] },
    error: { type: String, trim: true },
  },
  { _id: false },
)

const ScanSchema = new Schema<IScan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cropId: {
      type: Schema.Types.ObjectId,
      ref: 'Crop',
      index: true,
    },
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    cropCategory: {
      type: String,
      enum: ['Cereals', 'Vegetables', 'Fruits', 'Oilseeds', 'Pulses', 'Cash Crops', 'Other'],
      default: 'Other',
    },
    growthStage: {
      type: String,
      enum: ['sowing', 'vegetative', 'flowering', 'fruiting', 'harvesting'],
      default: 'vegetative',
    },
    fieldLocation: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
      default: '',
    },
    diseaseName: {
      type: String,
      default: 'Pending AI Analysis',
      trim: true,
    },
    severity: {
      type: String,
      enum: ['healthy', 'moderate', 'high'],
      default: 'healthy',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    remediation: {
      type: String,
      default: '',
      trim: true,
    },
    additionalObservations: {
      type: String,
      default: '',
      trim: true,
    },
    predictedCrop: { type: String, trim: true },
    predictedDisease: { type: String, trim: true },
    isHealthy: { type: Boolean },
    topPredictions: [{
      classId: { type: Number },
      rawClass: { type: String },
      crop: { type: String },
      disease: { type: String },
      isHealthy: { type: Boolean },
      severity: { type: String },
      confidence: { type: Number },
    }],
    modelVersion: { type: String, trim: true },
    inferenceDurationMs: { type: Number },
    analyzedAt: { type: Date },
    analysisError: { type: String, trim: true },
    explanation: { type: ExplanationSchema, default: undefined },
  },
  {
    timestamps: true,
  },
)

ScanSchema.index({ userId: 1, createdAt: -1 })
ScanSchema.index({ userId: 1, severity: 1 })
ScanSchema.index({ userId: 1, status: 1 })

export const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>('Scan', ScanSchema)
