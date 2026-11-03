import { createApp } from './app'
import { connectDB } from './config/db'
import { connectRedis } from './config/redis'
import { env } from './config/env'
import logger from './utils/logger'

async function bootstrap(): Promise<void> {
  await Promise.allSettled([connectDB(), connectRedis()])

  const app = createApp()

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 KrishiAI server running on http://localhost:${env.PORT}`)
    logger.info(`   Environment: ${env.NODE_ENV}`)
    logger.info(`   Health: http://localhost:${env.PORT}/api/health`)
  })

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10_000)
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason })
  })

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack })
    process.exit(1)
  })
}

void bootstrap()
