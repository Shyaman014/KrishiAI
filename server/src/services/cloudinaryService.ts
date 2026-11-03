import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { env } from '../config/env'
import logger from '../utils/logger'

// Check if Cloudinary credentials are fully provided
const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET,
)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  logger.info('Cloudinary storage service initialized successfully.')
} else {
  logger.info(
    'Cloudinary credentials not configured; local disk storage fallback activated for scans.',
  )
}

// Local upload directory fallback
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads/scans')

if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true })
}

export interface UploadResult {
  imageUrl: string
  publicId: string
  format?: string
  bytes: number
}

/**
 * Uploads an image buffer either to Cloudinary (when configured)
 * or to local disk storage as a reliable fallback.
 */
export async function uploadScanImage(
  buffer: Buffer,
  userId: string,
  originalMimeType: string,
): Promise<UploadResult> {
  const timestamp = Date.now()
  const randomHex = crypto.randomBytes(6).toString('hex')
  const extension = originalMimeType.includes('png')
    ? 'png'
    : originalMimeType.includes('webp')
    ? 'webp'
    : 'jpg'

  // 1. If Cloudinary is configured, stream buffer to Cloudinary
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `krishiai/scans/${userId}`,
          public_id: `scan_${timestamp}_${randomHex}`,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error('Cloudinary upload stream error', error)
            return reject(new Error('Cloud storage upload failed'))
          }

          resolve({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          })
        },
      )

      uploadStream.end(buffer)
    })
  }

  // 2. Fallback: Save to local uploads directory
  try {
    const filename = `scan_${userId}_${timestamp}_${randomHex}.${extension}`
    const filepath = path.join(LOCAL_UPLOADS_DIR, filename)

    await fs.promises.writeFile(filepath, buffer)

    // Generate local URL accessible through Express static handler
    const baseUrl = process.env.VITE_API_URL || `http://localhost:${env.PORT}`
    const imageUrl = `${baseUrl}/uploads/scans/${filename}`
    const publicId = `local_scans_${filename}`

    logger.debug(`Scan image saved to local storage: ${filename}`)

    return {
      imageUrl,
      publicId,
      format: extension,
      bytes: buffer.length,
    }
  } catch (err) {
    logger.error('Local disk write error', err)
    throw new Error('Local file storage failed')
  }
}

/**
 * Deletes an image from Cloudinary or local disk by its public ID.
 */
export async function deleteScanImage(publicId: string): Promise<boolean> {
  if (!publicId) return false

  try {
    if (publicId.startsWith('local_scans_')) {
      const filename = publicId.replace('local_scans_', '')
      const filepath = path.join(LOCAL_UPLOADS_DIR, filename)
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath)
      }
      return true
    }

    if (isCloudinaryConfigured) {
      const res = await cloudinary.uploader.destroy(publicId)
      return res.result === 'ok'
    }

    return true
  } catch (err) {
    logger.error(`Failed to delete scan image: ${publicId}`, err)
    return false
  }
}

