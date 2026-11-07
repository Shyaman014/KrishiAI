import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMarketFavorite extends Document {
  userId: mongoose.Types.ObjectId
  commodity: string
  state?: string
  createdAt: Date
}

const MarketFavoriteSchema = new Schema<IMarketFavorite>(
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
    },
    state: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

MarketFavoriteSchema.index({ userId: 1, commodity: 1 }, { unique: true })

export const MarketFavorite: Model<IMarketFavorite> =
  mongoose.models.MarketFavorite ||
  mongoose.model<IMarketFavorite>('MarketFavorite', MarketFavoriteSchema)

