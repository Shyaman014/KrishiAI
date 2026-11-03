import mongoose from 'mongoose'
import { env } from './env'
import logger from '../utils/logger'

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) return

  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set — skipping database connection')
    return
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    isConnected = true
    logger.info('✅ MongoDB connected')
  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error })
    // Do not exit — allows server to start in degraded mode during dev
  }
}

export function getDBStatus(): 'connected' | 'disconnected' {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}

export default mongoose
