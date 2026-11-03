import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/krishiai'),
  MONGODB_TEST_URI: z.string().default('mongodb://127.0.0.1:27017/krishiai_test'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // JWT Configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default('krishiai_access_jwt_secret_key_production_32_characters_minimum'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default('krishiai_refresh_jwt_secret_key_production_32_characters_minimum'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z
    .string()
    .min(32)
    .default('krishiai_cookie_signing_secret_key_32_characters_minimum'),

  // Microservice & Integrations
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),

  // Email Configuration (Optional - falls back to logging service)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('KrishiAI <no-reply@krishiai.farm>'),

  // Cloudinary Configuration (Optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
