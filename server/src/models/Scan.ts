import mongoose, { Document, Schema, Model } from 'mongoose'

export type ScanSeverity = 'healthy' | 'moderate' | 'high'
export type ScanStatus = 'pending' | 'completed' | 'failed'

export interface IScan extends Document {
  userId: mongoose.Types.ObjectId
  cropId?: mongoose.Types.ObjectId
  cropName: string
  fieldLocation?: string
  imageUrl: string
  diseaseName: string
  severity: ScanSeverity
  confidence: number // 0 to 100
  status: ScanStatus
  remediation?: string
  createdAt: Date
  updatedAt: Date
}

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
    fieldLocation: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    diseaseName: {
      type: String,
      default: 'Optimal / Healthy Foliage',
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
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    remediation: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  },
)

ScanSchema.index({ userId: 1, createdAt: -1 })
ScanSchema.index({ userId: 1, severity: 1 })

export const Scan: Model<IScan> =
  mongoose.models.Scan || mongoose.model<IScan>('Scan', ScanSchema)

