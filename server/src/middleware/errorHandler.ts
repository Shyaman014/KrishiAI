import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import logger from '../utils/logger'

export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this)
  }
}

interface ErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  stack?: string
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.flatten()
    const firstErrorMessage = err.issues[0]?.message || 'Validation failed'

    res.status(400).json({
      success: false,
      message: firstErrorMessage,
      errors: formatted.fieldErrors,
    })
    return
  }

  // Handle Custom Operational Errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      message: err.message,
    }
    if (process.env.NODE_ENV !== 'production') {
      response.stack = err.stack
    }
    res.status(err.statusCode).json(response)
    return
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'A record with this identifier already exists.',
    })
    return
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}
