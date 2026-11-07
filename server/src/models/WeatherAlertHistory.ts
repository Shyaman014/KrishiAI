import mongoose, { Document, Schema, Model } from 'mongoose'

export type WeatherAlertType =
  | 'heavy_rain'
  | 'high_temp'
  | 'high_humidity'
  | 'frost'
  | 'strong_wind'
  | 'spray_hazard'
  | 'irrigation'

export type WeatherAlertSeverity = 'info' | 'warning' | 'critical'

export interface IWeatherAlertHistory extends Document {
  userId: mongoose.Types.ObjectId
  alertType: WeatherAlertType
  severity: WeatherAlertSeverity
  title: string
  message: string
  location: {
    cityName?: string
    latitude?: number
    longitude?: number
  }
  weatherSnapshot?: {
    temperature: number
    humidity: number
    windSpeed: number
    rainfallProbability?: number
    condition?: string
  }
  dismissed: boolean
  validUntil: Date
  createdAt: Date
}

const WeatherAlertHistorySchema = new Schema<IWeatherAlertHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertType: {
      type: String,
      required: true,
      enum: [
        'heavy_rain',
        'high_temp',
        'high_humidity',
        'frost',
        'strong_wind',
        'spray_hazard',
        'irrigation',
      ],
      index: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      cityName: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    weatherSnapshot: {
      temperature: { type: Number },
      humidity: { type: Number },
      windSpeed: { type: Number },
      rainfallProbability: { type: Number },
      condition: { type: String },
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    validUntil: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

WeatherAlertHistorySchema.index({ userId: 1, createdAt: -1 })
WeatherAlertHistorySchema.index({ userId: 1, dismissed: 1 })

export const WeatherAlertHistory: Model<IWeatherAlertHistory> =
  mongoose.models.WeatherAlertHistory ||
  mongoose.model<IWeatherAlertHistory>('WeatherAlertHistory', WeatherAlertHistorySchema)

