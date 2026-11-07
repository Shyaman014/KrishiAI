import mongoose, { Document, Schema, Model } from 'mongoose'

export type NotificationType =
  | 'scan_completed'
  | 'scan_failed'
  | 'weather_alert'
  | 'price_target_reached'
  | 'farming_advisory'

export type NotificationResourceType =
  | 'scan'
  | 'market'
  | 'weather'
  | 'crop_recommendation'
  | 'advisory'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  relatedResourceId?: string
  resourceType?: NotificationResourceType
  isRead: boolean
  readAt?: Date
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
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
      enum: [
        'scan_completed',
        'scan_failed',
        'weather_alert',
        'price_target_reached',
        'farming_advisory',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    relatedResourceId: {
      type: String,
      trim: true,
      default: null,
    },
    resourceType: {
      type: String,
      enum: ['scan', 'market', 'weather', 'crop_recommendation', 'advisory'],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Optimized indexes for farmer notification queries and deduplication
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, type: 1, relatedResourceId: 1 })

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)

