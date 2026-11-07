import { Router } from 'express'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../controllers/notificationController'
import { authenticate } from '../middleware/auth'

const router = Router()

// All notification routes require authenticated farmer
router.use(authenticate)

router.get('/', getNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)
router.delete('/:id', deleteNotification)

export default router

