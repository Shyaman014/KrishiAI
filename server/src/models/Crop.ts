import mongoose, { Document, Schema, Model } from 'mongoose'

export type CropHealthStatus = 'healthy' | 'moderate' | 'critical'
export type CropGrowthStage = 'sowing' | 'vegetative' | 'flowering' | 'fruiting' | 'harvesting'

export interface ICrop extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  variety?: string
  area: number // In acres
  sowingDate?: Date
  stage: CropGrowthStage
  healthStatus: CropHealthStatus
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CropSchema = new Schema<ICrop>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: Number,
      required: [true, 'Crop area in acres is required'],
      min: [0, 'Area cannot be negative'],
      default: 0,
    },
    sowingDate: {
      type: Date,
    },
    stage: {
      type: String,
      enum: ['sowing', 'vegetative', 'flowering', 'fruiting', 'harvesting'],
      default: 'vegetative',
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'moderate', 'critical'],
      default: 'healthy',
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

CropSchema.index({ userId: 1, createdAt: -1 })

export const Crop: Model<ICrop> =
  mongoose.models.Crop || mongoose.model<ICrop>('Crop', CropSchema)

