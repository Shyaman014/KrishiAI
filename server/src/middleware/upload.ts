import multer, { FileFilterCallback } from 'multer'
import { Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'

// 1. Upload Rate Limiter (30 image uploads per 15 minutes per IP)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached. Please wait a few minutes before submitting more crop photos.',
  },
})

// 2. Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// 3. Multer memory storage (holds buffer for in-memory magic-byte inspection before cloud upload)
const storage = multer.memoryStorage()

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, JPG, PNG, and WebP crop images are supported.',
      ),
    )
  }
}

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB strict limit
    files: 1,
  },
  fileFilter,
}).single('image')

/**
 * Validates actual file bytes via magic numbers (file signature)
 * to prevent disguised executable or malicious file uploads.
 */
export function validateImageMagicBytes(buffer: Buffer): {
  isValid: boolean
  detectedMime?: string
  error?: string
} {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, error: 'File is empty or corrupted.' }
  }

  // Check JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg' }
  }

  // Check PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, detectedMime: 'image/png' }
  }

  // Check WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50

  if (isRiff && isWebp) {
    return { isValid: true, detectedMime: 'image/webp' }
  }

  return {
    isValid: false,
    error:
      'File signature does not match a valid image format (JPEG, PNG, or WebP).',
  }
}

/**
 * Express middleware wrapper to cleanly catch Multer size/type errors
 * and return standard JSON error responses.
 */
export const handleUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  uploadSingleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'Image size exceeds the 10 MB limit. Please select a smaller photo.',
        })
        return
      }
      res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      })
      return
    }

    if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.',
      })
      return
    }

    next()
  })
}

