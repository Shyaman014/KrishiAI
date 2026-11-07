import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import axios from 'axios'
import FormData from 'form-data'
import { Scan } from '../models/Scan'
import { Activity } from '../models/Activity'
import { NotificationService } from '../services/notificationService'
import { env } from '../config/env'
import logger from '../utils/logger'

/**
 * POST /api/scans/:id/analyze
 *
 * Triggers AI disease analysis for an existing scan record.
 * - Fetches image from Cloudinary URL
 * - Sends to FastAPI AI service
 * - Updates scan with results
 * - Protects against duplicate analysis
 */
export const analyzeScan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user!.userId
  const scanId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!scanId || !mongoose.Types.ObjectId.isValid(scanId)) {
    res.status(400).json({ success: false, message: 'Invalid scan ID format.' })
    return
  }

  try {
    // 1. Fetch scan with user isolation
    const scan = await Scan.findOne({ _id: scanId, userId })
    if (!scan) {
      res.status(404).json({ success: false, message: 'Scan record not found.' })
      return
    }

    // 2. Duplicate analysis guard
    if (scan.status === 'completed' || scan.status === 'processing') {
      res.status(409).json({
        success: false,
        message: `Scan analysis already ${scan.status}. Use the existing results.`,
        data: { status: scan.status },
      })
      return
    }

    // 3. Mark as processing to prevent concurrent duplicate requests
    scan.status = 'processing'
    await scan.save()

    // 4. Download image bytes from Cloudinary / storage URL
    let imageBuffer: Buffer
    try {
      const imageResponse = await axios.get<ArrayBuffer>(scan.imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15_000,
      })
      imageBuffer = Buffer.from(imageResponse.data)
    } catch (downloadErr) {
      logger.error('Failed to download scan image for analysis', downloadErr)
      scan.status = 'failed'
      scan.analysisError = 'Could not retrieve image for analysis. Please re-upload.'
      await scan.save()

      void NotificationService.createNotification({
        userId,
        type: 'scan_failed',
        title: `AI Analysis Failed: ${scan.cropName}`,
        message: 'Could not retrieve scan photograph for analysis. Please re-upload.',
        relatedResourceId: scan._id.toString(),
        resourceType: 'scan',
      })
      res.status(502).json({
        success: false,
        message: 'Failed to retrieve the scan image for AI analysis.',
      })
      return
    }

    // 5. Determine content type from image URL
    const imageUrl = scan.imageUrl.toLowerCase()
    let contentType = 'image/jpeg'
    if (imageUrl.includes('.png')) contentType = 'image/png'
    else if (imageUrl.includes('.webp')) contentType = 'image/webp'

    // 6. Send to FastAPI AI service
    const form = new FormData()
    form.append('image', imageBuffer, {
      filename: `scan_${scanId}.jpg`,
      contentType,
    })
    form.append('scan_id', scanId)

    const headers: Record<string, string> = { ...form.getHeaders() }
    if (env.AI_SERVICE_INTERNAL_KEY) {
      headers['X-Internal-Key'] = env.AI_SERVICE_INTERNAL_KEY
    }

    const aiResponse = await axios.post(
      `${env.AI_SERVICE_URL}/api/v1/predict`,
      form,
      {
        headers,
        timeout: 30_000,
      },
    )

    const aiResult = aiResponse.data

    // 7. Update scan with AI results
    const finalStatus = aiResult.status === 'inconclusive' ? 'completed' : 'completed'
    scan.status = finalStatus
    scan.diseaseName = aiResult.disease || 'Unknown'
    scan.severity = aiResult.severity || 'moderate'
    scan.confidence = aiResult.confidence || 0
    scan.predictedCrop = aiResult.crop
    scan.predictedDisease = aiResult.disease
    scan.isHealthy = aiResult.is_healthy
    scan.topPredictions = (aiResult.top_predictions || []).map(
      (p: { class_id: number; raw_class: string; crop: string; disease: string; is_healthy: boolean; severity: string; confidence: number }) => ({
        classId: p.class_id,
        rawClass: p.raw_class,
        crop: p.crop,
        disease: p.disease,
        isHealthy: p.is_healthy,
        severity: p.severity,
        confidence: p.confidence,
      }),
    )
    scan.modelVersion = aiResult.model_version
    scan.inferenceDurationMs = aiResult.processing_time_ms
    scan.analyzedAt = new Date()
    scan.analysisError = undefined
    await scan.save()

    // 8. Record activity & notification
    try {
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'scan_completed',
        title: 'AI Analysis Completed',
        description: `${scan.cropName}: ${aiResult.disease} (${aiResult.confidence.toFixed(1)}% confidence)`,
        metadata: {
          scanId: scan._id.toString(),
          cropName: scan.cropName,
          disease: aiResult.disease,
          confidence: aiResult.confidence,
          isHealthy: aiResult.is_healthy,
          status: finalStatus,
        },
      })

      void NotificationService.createNotification({
        userId,
        type: 'scan_completed',
        title: `AI Analysis Complete: ${scan.cropName}`,
        message: `${aiResult.disease} detected with ${aiResult.confidence.toFixed(1)}% confidence. Review diagnosis and agronomic care plan.`,
        relatedResourceId: scan._id.toString(),
        resourceType: 'scan',
        metadata: {
          scanId: scan._id.toString(),
          cropName: scan.cropName,
          disease: aiResult.disease,
          confidence: aiResult.confidence,
          isHealthy: aiResult.is_healthy,
        },
      })
    } catch (actErr) {
      logger.error('Failed to create scan_completed activity or notification', actErr)
    }

    logger.info(`Scan ${scanId} analyzed | ${aiResult.crop} | ${aiResult.disease} | ${aiResult.confidence}%`)

    res.status(200).json({
      success: true,
      message: aiResult.is_confident
        ? 'AI analysis completed successfully.'
        : 'AI analysis completed with low confidence. Results may be inconclusive.',
      data: {
        scan: {
          id: scan._id.toString(),
          cropName: scan.cropName,
          imageUrl: scan.imageUrl,
          diseaseName: scan.diseaseName,
          severity: scan.severity,
          confidence: scan.confidence,
          status: scan.status,
          predictedCrop: scan.predictedCrop,
          predictedDisease: scan.predictedDisease,
          isHealthy: scan.isHealthy,
          topPredictions: scan.topPredictions,
          modelVersion: scan.modelVersion,
          inferenceDurationMs: scan.inferenceDurationMs,
          analyzedAt: scan.analyzedAt,
          isConfident: aiResult.is_confident,
          message: aiResult.message,
        },
      },
    })
  } catch (error) {
    logger.error(`Analysis failed for scan ${scanId}`, error)

    // Mark scan as failed if it was processing
    try {
      await Scan.findOneAndUpdate(
        { _id: scanId, userId, status: 'processing' },
        {
          status: 'failed',
          analysisError: 'AI service error. Please retry.',
        },
      )

      void NotificationService.createNotification({
        userId,
        type: 'scan_failed',
        title: `AI Analysis Failed: Scan #${scanId.slice(-6)}`,
        message: 'AI diagnosis encountered a processing error. Please try scanning again.',
        relatedResourceId: scanId,
        resourceType: 'scan',
      })
    } catch (updateErr) {
      logger.error('Failed to update scan status to failed', updateErr)
    }

    next(error)
  }
}
