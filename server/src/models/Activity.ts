import mongoose, { Document, Schema, Model } from 'mongoose'

export type ActivityType =
  | 'account_created'
  | 'profile_updated'
  | 'password_changed'
  | 'crop_registered'
  | 'crop_updated'
  | 'scan_submitted'
  | 'scan_completed'
  | 'explanation_generated'
  | 'recommendation_generated'
  | 'weather_viewed'
  | 'advisory_viewed'
  | 'crop_recommendation_generated'
  | 'price_alert_created'
  | 'price_alert_triggered'
  | 'price_alert_deleted'
  | 'market_viewed'

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId
  type: ActivityType
  title: string
  description: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

ActivitySchema.index({ userId: 1, createdAt: -1 })

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema)

