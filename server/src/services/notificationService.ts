import mongoose from 'mongoose'
import {
  Notification,
  INotification,
  NotificationType,
  NotificationResourceType,
} from '../models/Notification'
import { emitToUser } from './socketService'
import logger from '../utils/logger'

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  relatedResourceId?: string
  resourceType?: NotificationResourceType
  metadata?: Record<string, unknown>
}

export class NotificationService {
  /**
   * Creates a notification for a user, avoiding duplicate creation for identical
   * type and resource within the last 24 hours.
   */
  public static async createNotification(
    params: CreateNotificationParams,
  ): Promise<INotification | null> {
    try {
      const userObjectId =
        typeof params.userId === 'string'
          ? new mongoose.Types.ObjectId(params.userId)
          : params.userId

      // Deduplication check: Do not re-notify identical event for same resource in last 24 hours
      if (params.relatedResourceId) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const existing = await Notification.findOne({
          userId: userObjectId,
          type: params.type,
          relatedResourceId: params.relatedResourceId,
          createdAt: { $gte: twentyFourHoursAgo },
        })

        if (existing) {
          logger.debug(
            `Duplicate notification prevented for user ${params.userId}, type ${params.type}, resource ${params.relatedResourceId}`,
          )
          return existing
        }
      }

      const notification = await Notification.create({
        userId: userObjectId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedResourceId: params.relatedResourceId,
        resourceType: params.resourceType,
        metadata: params.metadata || {},
        isRead: false,
      })

      // Real-time socket emission to user
      try {
        emitToUser(userObjectId.toString(), 'notification:new', {
          id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedResourceId: notification.relatedResourceId,
          resourceType: notification.resourceType,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          metadata: notification.metadata,
        })
      } catch (socketErr) {
        logger.error('Socket emission failed for notification', socketErr)
      }

      logger.info(
        `Notification created for user ${params.userId}: [${params.type}] ${params.title}`,
      )
      return notification
    } catch (err) {
      logger.error('Failed to create notification', err)
      return null
    }
  }

  /**
   * Count unread notifications for a user.
   */
  public static async getUnreadCount(
    userId: string | mongoose.Types.ObjectId,
  ): Promise<number> {
    const userObjectId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId
    return Notification.countDocuments({ userId: userObjectId, isRead: false })
  }
}

