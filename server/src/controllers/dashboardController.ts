import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Scan } from '../models/Scan'
import { Crop } from '../models/Crop'
import { Activity } from '../models/Activity'
import logger from '../utils/logger'

/**
 * GET /api/dashboard/overview
 * Returns aggregate metrics for the authenticated farmer.
 */
export const getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)

    // Execute queries in parallel using MongoDB aggregations
    const [scanStats, cropStats, recentActivityCount] = await Promise.all([
      Scan.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalScans: { $sum: 1 },
            healthyScans: {
              $sum: { $cond: [{ $eq: ['$severity', 'healthy'] }, 1, 0] },
            },
            diseaseScans: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$severity', 'healthy'] },
                      { $eq: ['$status', 'completed'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            pendingScans: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
          },
        },
      ]),
      Crop.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalCrops: { $sum: 1 },
            monitoredAcres: { $sum: '$area' },
            healthyCrops: {
              $sum: { $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0] },
            },
            criticalCrops: {
              $sum: { $cond: [{ $eq: ['$healthStatus', 'critical'] }, 1, 0] },
            },
          },
        },
      ]),
      Activity.countDocuments({
        userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ])

    const totalScans = scanStats[0]?.totalScans ?? 0
    const healthyScans = scanStats[0]?.healthyScans ?? 0
    const diseaseScans = scanStats[0]?.diseaseScans ?? 0
    const pendingScans = scanStats[0]?.pendingScans ?? 0

    const totalCrops = cropStats[0]?.totalCrops ?? 0
    const monitoredAcres = Math.round((cropStats[0]?.monitoredAcres ?? 0) * 10) / 10
    const healthyCrops = cropStats[0]?.healthyCrops ?? 0

    // Calculate real health index if data exists
    let healthIndex: number | null = null
    const totalAssessedItems = totalScans + totalCrops
    if (totalAssessedItems > 0) {
      const healthyItems = healthyScans + healthyCrops
      healthIndex = Math.round((healthyItems / totalAssessedItems) * 100)
    }

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        healthyScans,
        diseaseScans,
        pendingScans,
        totalCrops,
        monitoredAcres,
        healthyCrops,
        healthIndex,
        recentActivityCount,
      },
    })
  } catch (error) {
    logger.error('Error fetching dashboard overview', error)
    next(error)
  }
}

/**
 * GET /api/dashboard/crop-health
 * Returns health distribution data for charts and breakdowns.
 */
export const getCropHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)

    const [cropDistribution, scanDistribution, cropsList] = await Promise.all([
      Crop.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$healthStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Scan.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 },
          },
        },
      ]),
      Crop.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
    ])

    const cropMap = new Map(cropDistribution.map((item) => [item._id, item.count]))
    const scanMap = new Map(scanDistribution.map((item) => [item._id, item.count]))

    const healthyCount = (cropMap.get('healthy') || 0) + (scanMap.get('healthy') || 0)
    const moderateCount = (cropMap.get('moderate') || 0) + (scanMap.get('moderate') || 0)
    const criticalCount = (cropMap.get('critical') || 0) + (scanMap.get('high') || 0)
    const pendingScansCount = await Scan.countDocuments({ userId, status: 'pending' })

    const totalAssessed = healthyCount + moderateCount + criticalCount

    // Distribution format ready for Recharts (PieChart / BarChart)
    const distribution = [
      { name: 'Healthy', value: healthyCount, color: '#10b981' },
      { name: 'Moderate / Warning', value: moderateCount, color: '#f59e0b' },
      { name: 'Critical / Disease', value: criticalCount, color: '#ef4444' },
    ]

    res.status(200).json({
      success: true,
      data: {
        summary: {
          healthy: healthyCount,
          moderate: moderateCount,
          critical: criticalCount,
          pending: pendingScansCount,
          total: totalAssessed,
        },
        distribution,
        crops: cropsList.map((crop) => ({
          id: crop._id.toString(),
          name: crop.name,
          variety: crop.variety,
          area: crop.area,
          stage: crop.stage,
          healthStatus: crop.healthStatus,
          location: crop.location,
        })),
      },
    })
  } catch (error) {
    logger.error('Error fetching crop health data', error)
    next(error)
  }
}

/**
 * GET /api/dashboard/recent-scans
 * Returns paginated recent scans for the authenticated user.
 */
export const getRecentScans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 5))
    const skip = (page - 1) * limit
    const severity = req.query.severity as string | undefined

    const filter: Record<string, unknown> = { userId }
    if (severity && ['healthy', 'moderate', 'high'].includes(severity)) {
      filter.severity = severity
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
        scans: scans.map((scan) => ({
          id: scan._id.toString(),
          cropName: scan.cropName,
          fieldLocation: scan.fieldLocation,
          imageUrl: scan.imageUrl,
          diseaseName: scan.diseaseName,
          severity: scan.severity,
          confidence: scan.confidence,
          status: scan.status,
          remediation: scan.remediation,
          createdAt: scan.createdAt,
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
    logger.error('Error fetching recent scans', error)
    next(error)
  }
}

/**
 * GET /api/dashboard/activity
 * Returns recent activity history for the authenticated user.
 */
export const getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10))

    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    res.status(200).json({
      success: true,
      data: {
        activities: activities.map((activity) => ({
          id: activity._id.toString(),
          type: activity.type,
          title: activity.title,
          description: activity.description,
          metadata: activity.metadata,
          createdAt: activity.createdAt,
        })),
        total: activities.length,
      },
    })
  } catch (error) {
    logger.error('Error fetching user activities', error)
    next(error)
  }
}

