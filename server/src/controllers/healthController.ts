import { Request, Response } from 'express'
import { getDBStatus } from '../config/db'
import { getRedisStatus } from '../config/redis'
import { env } from '../config/env'

interface HealthPayload {
  success: true
  status: 'ok' | 'degraded'
  service: string
  version: string
  timestamp: string
  checks: {
    database: 'connected' | 'disconnected'
    cache: 'connected' | 'disconnected'
  }
}

export const getHealth = (_req: Request, res: Response): void => {
  const dbStatus = getDBStatus()
  const cacheStatus = getRedisStatus()
  const overallStatus = dbStatus === 'connected' ? 'ok' : 'degraded'

  const payload: HealthPayload = {
    success: true,
    status: overallStatus,
    service: 'krishi-ai-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
      cache: cacheStatus,
    },
  }

  const httpStatus = overallStatus === 'ok' ? 200 : 206
  res.status(httpStatus).json(payload)
}

export const getDocs = (_req: Request, res: Response): void => {
  res.json({
    service: 'krishi-ai-server',
    version: '1.0.0',
    environment: env.NODE_ENV,
    endpoints: {
      health: 'GET /api/health',
    },
  })
}
