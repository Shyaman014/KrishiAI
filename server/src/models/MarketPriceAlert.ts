import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMarketPriceAlert extends Document {
  userId: mongoose.Types.ObjectId
  commodity: string
  targetPrice: number // in ₹/Quintal
  condition: 'above' | 'below'
  mandiName?: string
  state?: string
  isActive: boolean
  triggered: boolean
  triggeredAt?: Date
  lastTriggeredPrice?: number
  createdAt: Date
  updatedAt: Date
}

const MarketPriceAlertSchema = new Schema<IMarketPriceAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    commodity: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    condition: {
      type: String,
      enum: ['above', 'below'],
      required: true,
    },
    mandiName: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggered: {
      type: Boolean,
      default: false,
    },
    triggeredAt: {
      type: Date,
    },
    lastTriggeredPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
)

MarketPriceAlertSchema.index({ userId: 1, commodity: 1 })
MarketPriceAlertSchema.index({ isActive: 1, triggered: 1 })

export const MarketPriceAlert: Model<IMarketPriceAlert> =
  mongoose.models.MarketPriceAlert ||
  mongoose.model<IMarketPriceAlert>('MarketPriceAlert', MarketPriceAlertSchema)

