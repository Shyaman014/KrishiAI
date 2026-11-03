import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import path from 'path'
import { env } from './config/env'
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import apiRoutes from './routes/index'

export function createApp(): Application {
  const app = express()

  // ---- Security Middleware ----
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )

  // ---- Cookie Parser ----
  app.use(cookieParser(env.COOKIE_SECRET))

  // ---- Rate Limiting ----
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  })
  app.use('/api', limiter)

  // ---- Body Parsing & Compression ----
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(compression())

  // ---- Static Files (Local uploads fallback) ----
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

  // ---- Request Logging ----
  app.use(requestLogger)

  // ---- API Routes ----
  app.use('/api', apiRoutes)

  // ---- Root Route ----
  app.get('/', (_req, res) => {
    res.json({
      message: 'KrishiAI API is running 🌱',
      docs: '/api/health',
    })
  })

  // ---- 404 & Error Handling ----
  app.use(notFound)
  app.use(errorHandler)

  return app
}
