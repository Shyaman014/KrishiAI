import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Scan } from '../models/Scan'
import { Activity } from '../models/Activity'
import { uploadScanSchema } from '../validators/scanValidators'
import { validateImageMagicBytes } from '../middleware/upload'
import { uploadScanImage, deleteScanImage } from '../services/cloudinaryService'
import logger from '../utils/logger'

/**
 * POST /api/scans/upload
 * Handles multipart/form-data upload of a crop leaf photograph and stores
 * initial metadata with PENDING analysis status.
 */
export const uploadScan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId

    // 1. Verify file presence
    if (!req.file || !req.file.buffer) {
      res.status(400).json({
        success: false,
        message: 'Please provide a crop leaf photograph to upload.',
      })
      return
    }

    // 2. Validate real file signature (magic bytes)
    const magicByteCheck = validateImageMagicBytes(req.file.buffer)
    if (!magicByteCheck.isValid) {
      res.status(400).json({
        success: false,
        message: magicByteCheck.error || 'Invalid or corrupted image file.',
      })
      return
    }

    // 3. Validate form metadata (crop name, category, stage, etc.)
    const parsedData = uploadScanSchema.parse(req.body)

    // 4. Stream to Cloudinary (or local storage fallback)
    const uploadResult = await uploadScanImage(
      req.file.buffer,
      userId,
      magicByteCheck.detectedMime || req.file.mimetype,
    )

    // 5. Create database record in MongoDB with PENDING status
    const scan = new Scan({
      userId: new mongoose.Types.ObjectId(userId),
      imageUrl: uploadResult.imageUrl,
      cloudinaryPublicId: uploadResult.publicId,
      cropName: parsedData.cropName || 'Unspecified Crop',
      cropCategory: parsedData.cropCategory,
      growthStage: parsedData.growthStage,
      fieldLocation: parsedData.fieldLocation,
      additionalObservations: parsedData.additionalObservations,
      status: 'pending',
      diseaseName: 'Pending AI Analysis',
      severity: 'healthy',
      confidence: 0,
      remediation: '',
    })

    await scan.save()

    // 6. Record user activity log
    try {
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'scan_submitted',
        title: 'Crop Scan Submitted',
        description: `Leaf photo uploaded for ${scan.cropName}. Status: Pending AI Analysis.`,
        metadata: {
          scanId: scan._id.toString(),
          cropName: scan.cropName,
          status: 'pending',
        },
      })
    } catch (activityErr) {
      logger.error('Failed to log scan_submitted activity', activityErr)
    }

    logger.info(`New crop scan uploaded: ${scan._id} by user ${userId}`)

    res.status(201).json({
      success: true,
      message: 'Crop photograph uploaded successfully. Analysis status: Pending.',
      data: {
        scan: {
          id: scan._id.toString(),
          cropName: scan.cropName,
          cropCategory: scan.cropCategory,
          growthStage: scan.growthStage,
          fieldLocation: scan.fieldLocation,
          imageUrl: scan.imageUrl,
          diseaseName: scan.diseaseName,
          severity: scan.severity,
          confidence: scan.confidence,
          status: scan.status,
          remediation: scan.remediation,
          additionalObservations: scan.additionalObservations,
          predictedCrop: scan.predictedCrop,
          predictedDisease: scan.predictedDisease,
          isHealthy: scan.isHealthy,
          topPredictions: scan.topPredictions,
          modelVersion: scan.modelVersion,
          inferenceDurationMs: scan.inferenceDurationMs,
          analyzedAt: scan.analyzedAt,
          createdAt: scan.createdAt,
        },
      },
    })
  } catch (error) {
    logger.error('Error during crop scan upload', error)
    next(error)
  }
}

/**
 * GET /api/scans
 * Returns paginated list of scans for the authenticated user with search and filtering.
 */
export const getScans = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10))
    const skip = (page - 1) * limit

    const search = req.query.search as string | undefined
    const status = req.query.status as string | undefined
    const severity = req.query.severity as string | undefined

    const filter: Record<string, unknown> = { userId }

    if (status && ['pending', 'completed', 'failed'].includes(status)) {
      filter.status = status
    }

    if (severity && ['healthy', 'moderate', 'high'].includes(severity)) {
      filter.severity = severity
    }

    if (search && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i')
      filter.$or = [
        { cropName: searchRegex },
        { diseaseName: searchRegex },
        { fieldLocation: searchRegex },
      ]
    }

    const [scans, total] = await Promise.all([
      Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Scan.countDocuments(filter),
    ])

    res.status(200).json({
      success: true,
      data: {
        scans: scans.map((s) => ({
          id: s._id.toString(),
          cropName: s.cropName,
          cropCategory: s.cropCategory,
          growthStage: s.growthStage,
          fieldLocation: s.fieldLocation,
          imageUrl: s.imageUrl,
          diseaseName: s.diseaseName,
          severity: s.severity,
          confidence: s.confidence,
          status: s.status,
          remediation: s.remediation,
          additionalObservations: s.additionalObservations,
          predictedCrop: s.predictedCrop,
          predictedDisease: s.predictedDisease,
          isHealthy: s.isHealthy,
          topPredictions: s.topPredictions,
          modelVersion: s.modelVersion,
          inferenceDurationMs: s.inferenceDurationMs,
          analyzedAt: s.analyzedAt,
          createdAt: s.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching scans', error)
    next(error)
  }
}

/**
 * GET /api/scans/:id
 * Fetches single scan details for the authenticated user.
 */
export const getScanById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid scan ID format.',
      })
      return
    }

    const scan = await Scan.findOne({ _id: id, userId })

    if (!scan) {
      res.status(404).json({
        success: false,
        message: 'Scan record not found.',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        scan: {
          id: scan._id.toString(),
          cropName: scan.cropName,
          cropCategory: scan.cropCategory,
          growthStage: scan.growthStage,
          fieldLocation: scan.fieldLocation,
          imageUrl: scan.imageUrl,
          diseaseName: scan.diseaseName,
          severity: scan.severity,
          confidence: scan.confidence,
          status: scan.status,
          remediation: scan.remediation,
          additionalObservations: scan.additionalObservations,
          predictedCrop: scan.predictedCrop,
          predictedDisease: scan.predictedDisease,
          isHealthy: scan.isHealthy,
          topPredictions: scan.topPredictions,
          modelVersion: scan.modelVersion,
          inferenceDurationMs: scan.inferenceDurationMs,
          analyzedAt: scan.analyzedAt,
          createdAt: scan.createdAt,
        },
      },
    })
  } catch (error) {
    logger.error(`Error fetching scan ${req.params.id}`, error)
    next(error)
  }
}

/**
 * DELETE /api/scans/:id
 * Deletes a scan record belonging to the authenticated user.
 */
export const deleteScan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid scan ID format.',
      })
      return
    }

    const scan = await Scan.findOne({ _id: id, userId })

    if (!scan) {
      res.status(404).json({
        success: false,
        message: 'Scan record not found.',
      })
      return
    }

    // Attempt to delete image from Cloudinary or local disk
    if (scan.cloudinaryPublicId) {
      await deleteScanImage(scan.cloudinaryPublicId)
    }

    await Scan.deleteOne({ _id: id, userId })

    logger.info(`Scan ${id} deleted by user ${userId}`)

    res.status(200).json({
      success: true,
      message: 'Scan record deleted successfully.',
    })
  } catch (error) {
    logger.error(`Error deleting scan ${req.params.id}`, error)
    next(error)
  }
}
