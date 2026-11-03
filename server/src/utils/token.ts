import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import { CookieOptions } from 'express'
import { env } from '../config/env'
import { UserRole } from '../models/User'

export interface TokenPayload {
  userId: string
  role: UserRole
  email: string
}

export interface RefreshTokenPayload extends TokenPayload {
  family: string
}

export const REFRESH_TOKEN_COOKIE_NAME = 'krishi_refresh_token'

/**
 * Sign an ephemeral JWT Access Token (15 minutes).
 */
export function generateAccessToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as number,
  }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options)
}

/**
 * Sign a persistent JWT Refresh Token (7 days).
 */
export function generateRefreshToken(payload: TokenPayload, family?: string): { token: string; family: string } {
  const tokenFamily = family || crypto.randomUUID()
  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    family: tokenFamily,
  }
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as number,
  }
  const token = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, options)
  return { token, family: tokenFamily }
}

/**
 * Verify Access Token from Authorization: Bearer <token>
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload
}

/**
 * Verify Refresh Token from HttpOnly Cookie
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

/**
 * Generate a cryptographically strong random token (for password reset / email verify).
 */
export function generateRandomToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Compute SHA-256 hash of a token for safe database persistence.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Secure HttpOnly cookie configuration for Refresh Tokens.
 */
export function getRefreshTokenCookieOptions(rememberMe = true): CookieOptions {
  const isProduction = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined,
  }
}

/**
 * Clear cookie options (omits maxAge to satisfy Express 5 standard).
 */
export function getClearCookieOptions(): CookieOptions {
  const isProduction = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth',
  }
}
