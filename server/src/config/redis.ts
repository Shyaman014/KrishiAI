import Redis from 'ioredis'
import { env } from './env'
import logger from '../utils/logger'

let redisClient: Redis | null = null

export function getRedisClient(): Redis | null {
  return redisClient
}

export async function connectRedis(): Promise<void> {
  if (!env.REDIS_URL) {
    logger.warn('REDIS_URL not set — caching disabled')
    return
  }

  try {
    const client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: () => null,
    })

    client.on('error', (error) => {
      logger.debug('Redis client error', { error: error.message })
    })

    await client.connect()
    redisClient = client
    logger.info('✅ Redis connected')
  } catch (error) {
    logger.warn('⚠️  Redis connection failed — caching disabled', {
      error: error instanceof Error ? error.message : String(error),
    })
    redisClient = null
  }
}

export function getRedisStatus(): 'connected' | 'disconnected' {
  return redisClient?.status === 'ready' ? 'connected' : 'disconnected'
}
