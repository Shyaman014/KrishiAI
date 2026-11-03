import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../utils/token'
import { UserRole } from '../models/User'
import logger from '../utils/logger'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

/**
 * Enforces valid Bearer JWT access token in Authorization header.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (error) {
    logger.debug('Token verification failed', { error })
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please refresh your session.',
    })
  }
}

/**
 * Restricts route access to specified user roles (e.g. 'admin', 'farmer').
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      })
      return
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.',
      })
      return
    }

    next()
  }
}

/**
 * Optional authentication middleware: attaches user if token is valid, but does not block if missing.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      req.user = verifyAccessToken(token)
    } catch {
      // Ignored for optional auth
    }
  }
  next()
}

