import { getRedisClient } from '../../config/redis'
import { env } from '../../config/env'
import logger from '../../utils/logger'

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class WeatherCacheService {
  private static inMemoryStore = new Map<string, CacheEntry<unknown>>()
  private static cleanupInterval: NodeJS.Timeout | null = null

  private static ensureCleanupStarted() {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of this.inMemoryStore.entries()) {
          if (entry.expiresAt <= now) {
            this.inMemoryStore.delete(key)
          }
        }
      }, 60_000)
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref()
      }
    }
  }

  public static async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient()

    if (redis && redis.status === 'ready') {
      try {
        const data = await redis.get(key)
        if (data) {
          return JSON.parse(data) as T
        }
      } catch (err) {
        logger.debug(`Redis get failed for key ${key}, falling back to memory store`, err)
      }
    }

    // In-memory fallback
    const entry = this.inMemoryStore.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.inMemoryStore.delete(key)
      return null
    }

    return entry.value as T
  }

  public static async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = env.WEATHER_CACHE_TTL_SECONDS,
  ): Promise<void> {
    const redis = getRedisClient()

    if (redis && redis.status === 'ready') {
      try {
        await redis.setex(key, ttlSeconds, JSON.stringify(value))
        return
      } catch (err) {
        logger.debug(`Redis setex failed for key ${key}, storing in memory`, err)
      }
    }

    // In-memory store
    this.ensureCleanupStarted()
    this.inMemoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  public static async invalidate(keyPrefix: string): Promise<void> {
    const redis = getRedisClient()
    if (redis && redis.status === 'ready') {
      try {
        const keys = await redis.keys(`${keyPrefix}*`)
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } catch (err) {
        logger.debug('Redis delete keys error', err)
      }
    }

    for (const key of this.inMemoryStore.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.inMemoryStore.delete(key)
      }
    }
  }

  public static clearMemoryCache(): void {
    this.inMemoryStore.clear()
  }
}

