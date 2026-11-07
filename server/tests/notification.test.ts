import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Notification } from '../src/models/Notification'
import { Scan } from '../src/models/Scan'
import { NotificationService } from '../src/services/notificationService'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

const app = createApp()

describe('KrishiAI Phase 13: Scan History & Notification System Suite', () => {
  let userAId: string
  let userBId: string
  let tokenUserA: string
  let tokenUserB: string

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_TEST_URI)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Notification.deleteMany({}),
      Scan.deleteMany({}),
    ])

    const userA = await User.create({
      fullName: 'Ramesh Patel',
      email: 'ramesh@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
      preferredLanguage: 'en',
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: 'farmer' })

    const userB = await User.create({
      fullName: 'Suresh Kumar',
      email: 'suresh@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
      preferredLanguage: 'hi',
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: 'farmer' })
  })

  describe('1. Notification Route Protection', () => {
    it('rejects unauthenticated request to GET /api/notifications with 401', async () => {
      const res = await request(app).get('/api/notifications')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to PATCH /api/notifications/read-all with 401', async () => {
      const res = await request(app).patch('/api/notifications/read-all')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to PATCH /api/notifications/:id/read with 401', async () => {
      const dummyId = new mongoose.Types.ObjectId().toString()
      const res = await request(app).patch(`/api/notifications/${dummyId}/read`)
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to DELETE /api/notifications/:id with 401', async () => {
      const dummyId = new mongoose.Types.ObjectId().toString()
      const res = await request(app).delete(`/api/notifications/${dummyId}`)
      expect(res.status).toBe(401)
    })
  })

  describe('2. Notification Service & Retrieval', () => {
    it('creates notifications and retrieves paginated list with unread count', async () => {
      await NotificationService.createNotification({
        userId: userAId,
        type: 'scan_completed',
        title: 'Scan Analysis Complete',
        message: 'Tomato Early Blight detected with 88% confidence.',
        relatedResourceId: 'scan-101',
        resourceType: 'scan',
      })

      await NotificationService.createNotification({
        userId: userAId,
        type: 'weather_alert',
        title: 'Heavy Rainfall Advisory',
        message: 'High precipitation expected in 24 hours.',
        relatedResourceId: 'weather-202',
        resourceType: 'weather',
      })

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.notifications).toHaveLength(2)
      expect(res.body.data.unreadCount).toBe(2)
      expect(res.body.data.notifications[0].title).toBe('Heavy Rainfall Advisory')
    })

    it('prevents duplicate notification creation for the same resource within 24h', async () => {
      const n1 = await NotificationService.createNotification({
        userId: userAId,
        type: 'price_target_reached',
        title: 'Wheat Price Reached Target',
        message: 'Ludhiana Mandi price reached ₹2,450/Qtl.',
        relatedResourceId: 'alert-301',
        resourceType: 'market',
      })

      const n2 = await NotificationService.createNotification({
        userId: userAId,
        type: 'price_target_reached',
        title: 'Wheat Price Reached Target (Duplicate Attempt)',
        message: 'Ludhiana Mandi price reached ₹2,450/Qtl.',
        relatedResourceId: 'alert-301',
        resourceType: 'market',
      })

      expect(n1).not.toBeNull()
      expect(n2).not.toBeNull()
      expect(n1!._id.toString()).toBe(n2!._id.toString())

      const count = await Notification.countDocuments({ userId: userAId })
      expect(count).toBe(1)
    })

    it('filters notifications by unreadOnly=true', async () => {
      await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'scan_completed',
        title: 'Read Notification',
        message: 'Already checked.',
        isRead: true,
      })

      await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'weather_alert',
        title: 'Unread Notification',
        message: 'Requires attention.',
        isRead: false,
      })

      const res = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.notifications).toHaveLength(1)
      expect(res.body.data.notifications[0].title).toBe('Unread Notification')
      expect(res.body.data.unreadCount).toBe(1)
    })
  })

  describe('3. Mark as Read & User Isolation', () => {
    it('marks a single notification as read', async () => {
      const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'farming_advisory',
        title: 'Farming Advisory',
        message: 'Apply bio-fertilizer.',
        isRead: false,
      })

      const res = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.notification.isRead).toBe(true)
      expect(res.body.data.unreadCount).toBe(0)

      const updated = await Notification.findById(notification._id)
      expect(updated?.isRead).toBe(true)
      expect(updated?.readAt).toBeDefined()
    })

    it('prevents User B from marking User A notification as read (404 isolation)', async () => {
      const notification = await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'farming_advisory',
        title: 'User A Advisory',
        message: 'Secret advisory.',
        isRead: false,
      })

      const res = await request(app)
        .patch(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)

      const unchanged = await Notification.findById(notification._id)
      expect(unchanged?.isRead).toBe(false)
    })

    it('marks all notifications as read for authenticated user only', async () => {
      await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'scan_completed',
        title: 'User A Notif 1',
        message: 'msg',
        isRead: false,
      })
      await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'weather_alert',
        title: 'User A Notif 2',
        message: 'msg',
        isRead: false,
      })
      await Notification.create({
        userId: new mongoose.Types.ObjectId(userBId),
        type: 'weather_alert',
        title: 'User B Notif',
        message: 'msg',
        isRead: false,
      })

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.modifiedCount).toBe(2)
      expect(res.body.data.unreadCount).toBe(0)

      // Verify User B's notification is still unread
      const userBNotifs = await Notification.find({ userId: userBId, isRead: false })
      expect(userBNotifs).toHaveLength(1)
    })
  })

  describe('4. Delete Notification & User Isolation', () => {
    it('deletes a notification belonging to user', async () => {
      const notif = await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'scan_failed',
        title: 'Scan Failed',
        message: 'Blurry photo.',
        isRead: false,
      })

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const exists = await Notification.findById(notif._id)
      expect(exists).toBeNull()
    })

    it('prevents User B from deleting User A notification (404 isolation)', async () => {
      const notif = await Notification.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'scan_failed',
        title: 'User A Alert',
        message: 'Do not delete me.',
        isRead: false,
      })

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)

      const stillExists = await Notification.findById(notif._id)
      expect(stillExists).not.toBeNull()
    })
  })

  describe('5. Scan History API (`/api/scans/history` & `/api/scans`)', () => {
    beforeEach(async () => {
      // Create test scans with varied statuses, crops, and dates
      const now = new Date()
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 3600 * 1000)
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 3600 * 1000)

      await Scan.create({
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Tomato',
        diseaseName: 'Early Blight',
        imageUrl: 'https://example.com/tomato.jpg',
        confidence: 0.92,
        status: 'completed',
        severity: 'high',
        createdAt: now,
      })

      await Scan.create({
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Wheat',
        diseaseName: 'Yellow Rust',
        imageUrl: 'https://example.com/wheat.jpg',
        confidence: 0.54,
        status: 'completed',
        severity: 'moderate',
        createdAt: fiveDaysAgo,
      })

      await Scan.create({
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Potato',
        diseaseName: 'Pending AI Analysis',
        imageUrl: 'https://example.com/potato.jpg',
        confidence: 0,
        status: 'pending',
        severity: 'healthy',
        createdAt: tenDaysAgo,
      })

      await Scan.create({
        userId: new mongoose.Types.ObjectId(userBId),
        cropName: 'Rice',
        diseaseName: 'Bacterial Blight',
        imageUrl: 'https://example.com/rice.jpg',
        confidence: 0.89,
        status: 'completed',
        severity: 'high',
        createdAt: now,
      })
    })

    it('retrieves scan history from GET /api/scans/history for authenticated user', async () => {
      const res = await request(app)
        .get('/api/scans/history')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scans).toHaveLength(3)
      expect(res.body.data.pagination.total).toBe(3)
    })

    it('filters scan history by search term (crop or disease)', async () => {
      const res = await request(app)
        .get('/api/scans/history?search=Tomato')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans).toHaveLength(1)
      expect(res.body.data.scans[0].cropName).toBe('Tomato')
    })

    it('filters scan history by status (pending vs completed)', async () => {
      const res = await request(app)
        .get('/api/scans/history?status=pending')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans).toHaveLength(1)
      expect(res.body.data.scans[0].cropName).toBe('Potato')
    })

    it('filters inconclusive scans with low confidence', async () => {
      const res = await request(app)
        .get('/api/scans/history?status=inconclusive')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans).toHaveLength(1)
      expect(res.body.data.scans[0].cropName).toBe('Wheat')
      expect(res.body.data.scans[0].confidence).toBe(0.54)
    })

    it('sorts scans by oldest and newest', async () => {
      const resOldest = await request(app)
        .get('/api/scans/history?sort=oldest')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(resOldest.status).toBe(200)
      expect(resOldest.body.data.scans[0].cropName).toBe('Potato')

      const resNewest = await request(app)
        .get('/api/scans/history?sort=newest')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(resNewest.status).toBe(200)
      expect(resNewest.body.data.scans[0].cropName).toBe('Tomato')
    })

    it('retrieves single scan by ID and enforces user isolation', async () => {
      const scanA = await Scan.findOne({ userId: userAId, cropName: 'Tomato' })

      const resA = await request(app)
        .get(`/api/scans/${scanA!._id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(resA.status).toBe(200)
      expect(resA.body.data.scan.cropName).toBe('Tomato')

      // User B receives 404 for User A scan
      const resB = await request(app)
        .get(`/api/scans/${scanA!._id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(resB.status).toBe(404)
    })
  })
})
