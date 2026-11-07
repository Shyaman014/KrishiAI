import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { Notification } from '../models/Notification'
import { emitToUser } from '../services/socketService'
import logger from '../utils/logger'

/**
 * GET /api/notifications
 * Retrieves paginated notifications for the authenticated farmer with unread count.
 */
export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId)
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 15))
    const skip = (page - 1) * limit
    const unreadOnly = req.query.unreadOnly === 'true'

    const filter: Record<string, unknown> = { userId }
    if (unreadOnly) {
      filter.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false }),
    ])

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          id: n._id.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          relatedResourceId: n.relatedResourceId,
          resourceType: n.resourceType,
          isRead: n.isRead,
          readAt: n.readAt,
          metadata: n.metadata,
          createdAt: n.createdAt,
        })),
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching notifications', error)
    next(error)
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read for the authenticated farmer.
 */
export const markNotificationRead = async (
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
        message: 'Invalid notification ID format.',
      })
      return
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true, readAt: new Date() },
      { new: true },
    )

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found.',
      })
      return
    }

    const unreadCount = await Notification.countDocuments({ userId, isRead: false })

    emitToUser(userId, 'notification:updated', {
      id: notification._id.toString(),
      isRead: true,
      readAt: notification.readAt,
      unreadCount,
    })

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: {
        notification: {
          id: notification._id.toString(),
          isRead: notification.isRead,
          readAt: notification.readAt,
        },
        unreadCount,
      },
    })
  } catch (error) {
    logger.error('Error marking notification as read', error)
    next(error)
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for the authenticated farmer as read.
 */
export const markAllNotificationsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    )

    emitToUser(userId, 'notification:read_all', {
      unreadCount: 0,
      modifiedCount: result.modifiedCount,
    })

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      data: {
        modifiedCount: result.modifiedCount,
        unreadCount: 0,
      },
    })
  } catch (error) {
    logger.error('Error marking all notifications as read', error)
    next(error)
  }
}

/**
 * DELETE /api/notifications/:id
 * Deletes a notification with user isolation.
 */
export const deleteNotification = async (
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
        message: 'Invalid notification ID format.',
      })
      return
    }

    const notification = await Notification.findOneAndDelete({ _id: id, userId })

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'Notification not found.',
      })
      return
    }

    const unreadCount = await Notification.countDocuments({ userId, isRead: false })

    emitToUser(userId, 'notification:deleted', {
      id,
      unreadCount,
    })

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
      data: {
        id,
        unreadCount,
      },
    })
  } catch (error) {
    logger.error('Error deleting notification', error)
    next(error)
  }
}

