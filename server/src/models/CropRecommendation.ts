import mongoose, { Document, Model, Schema } from 'mongoose'

export interface ICropRecommendationItem {
  rank: number
  cropName: string
  confidence: number
  confidencePct: number
  supportingFactors: Array<{
    factor: string
    value: string
    importancePct: string
    explanation: string
  }>
  growingDuration: string
  waterRequirement: string
  suitableSeason: string
  soilRequirement: string
  description: string
  source: string
}

export interface ICropRecommendation extends Document {
  userId: mongoose.Types.ObjectId
  inputs: {
    N: number
    P: number
    K: number
    temperature: number
    humidity: number
    ph: number
    rainfall: number
    soilType?: string
    season?: string
  }
  location?: {
    cityName?: string
    latitude?: number
    longitude?: number
  }
  weatherContext?: {
    temperature?: number
    humidity?: number
    condition?: string
    source?: string
  }
  recommendations: ICropRecommendationItem[]
  language: 'en' | 'hi' | 'as'
  modelVersion: string
  disclaimer: string
  dataSourceNote?: string
  createdAt: Date
}

const SupportingFactorSchema = new Schema(
  {
    factor: { type: String, required: true },
    value: { type: String, required: true },
    importancePct: { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false },
)

const RecommendationItemSchema = new Schema(
  {
    rank: { type: Number, required: true },
    cropName: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true },
    confidencePct: { type: Number, default: 0 },
    supportingFactors: { type: [SupportingFactorSchema], default: [] },
    growingDuration: { type: String, default: '' },
    waterRequirement: { type: String, default: '' },
    suitableSeason: { type: String, default: '' },
    soilRequirement: { type: String, default: '' },
    description: { type: String, default: '' },
    source: { type: String, default: '' },
  },
  { _id: false },
)

const CropRecommendationSchema = new Schema<ICropRecommendation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inputs: {
      N: { type: Number, required: true },
      P: { type: Number, required: true },
      K: { type: Number, required: true },
      temperature: { type: Number, required: true },
      humidity: { type: Number, required: true },
      ph: { type: Number, required: true },
      rainfall: { type: Number, required: true },
      soilType: { type: String },
      season: { type: String },
    },
    location: {
      cityName: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    weatherContext: {
      temperature: { type: Number },
      humidity: { type: Number },
      condition: { type: String },
      source: { type: String },
    },
    recommendations: { type: [RecommendationItemSchema], required: true },
    language: {
      type: String,
      enum: ['en', 'hi', 'as'],
      default: 'en',
    },
    modelVersion: { type: String, required: true },
    disclaimer: { type: String, required: true },
    dataSourceNote: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

CropRecommendationSchema.index({ userId: 1, createdAt: -1 })

export const CropRecommendation: Model<ICropRecommendation> =
  mongoose.models.CropRecommendation ||
  mongoose.model<ICropRecommendation>('CropRecommendation', CropRecommendationSchema)

