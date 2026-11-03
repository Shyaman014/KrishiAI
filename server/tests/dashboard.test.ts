import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Crop } from '../src/models/Crop'
import { Scan } from '../src/models/Scan'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

const app = createApp()

describe('KrishiAI Dashboard & Analytics API Suite', () => {
  let userAId: string
  let userBId: string
  let tokenUserA: string
  let tokenUserB: string

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_TEST_URI)
    await Promise.all([
      User.deleteMany({}),
      Crop.deleteMany({}),
      Scan.deleteMany({}),
      Activity.deleteMany({}),
    ])

    // Create User A
    const userA = await User.create({
      fullName: 'Ramesh Patel',
      email: 'ramesh.patel@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'hi',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, role: 'farmer', email: userA.email })

    // Create User B
    const userB = await User.create({
      fullName: 'Suresh Kumar',
      email: 'suresh.kumar@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'en',
      role: 'farmer',
      isVerified: true,
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, role: 'farmer', email: userB.email })
  })

  afterAll(async () => {
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase()
    }
    await mongoose.disconnect()
  })

  describe('1. Authentication & Route Protection', () => {
    it('should reject unauthenticated request to /api/dashboard/overview with 401', async () => {
      const res = await request(app).get('/api/dashboard/overview')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated request to /api/dashboard/crop-health with 401', async () => {
      const res = await request(app).get('/api/dashboard/crop-health')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated request to /api/dashboard/recent-scans with 401', async () => {
      const res = await request(app).get('/api/dashboard/recent-scans')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject unauthenticated request to /api/dashboard/activity with 401', async () => {
      const res = await request(app).get('/api/dashboard/activity')
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('2. Empty State Handling (Zero Fake Data Guarantee)', () => {
    it('should return zeroes and empty arrays for a new farmer with no records', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.totalScans).toBe(0)
      expect(res.body.data.healthyScans).toBe(0)
      expect(res.body.data.diseaseScans).toBe(0)
      expect(res.body.data.pendingScans).toBe(0)
      expect(res.body.data.totalCrops).toBe(0)
      expect(res.body.data.monitoredAcres).toBe(0)
      expect(res.body.data.healthIndex).toBeNull() // Never invent a fake health score
    })

    it('should return empty crop health distribution when no crops or scans exist', async () => {
      const res = await request(app)
        .get('/api/dashboard/crop-health')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.summary.total).toBe(0)
      expect(res.body.data.crops).toEqual([])
    })

    it('should return empty list of scans when user has not scanned yet', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-scans')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scans).toEqual([])
      expect(res.body.data.pagination.total).toBe(0)
    })
  })

  describe('3. User Isolation & Real Data Aggregation', () => {
    beforeAll(async () => {
      // Create crops for User A
      await Crop.create([
        {
          userId: new mongoose.Types.ObjectId(userAId),
          name: 'Wheat',
          variety: 'PBW 343',
          area: 12.5,
          stage: 'vegetative',
          healthStatus: 'healthy',
          location: 'North Plot #4',
        },
        {
          userId: new mongoose.Types.ObjectId(userAId),
          name: 'Mustard',
          variety: 'Pusa Bold',
          area: 8.0,
          stage: 'flowering',
          healthStatus: 'moderate',
          location: 'East Plot #2',
        },
      ])

      // Create scans for User A
      await Scan.create([
        {
          userId: new mongoose.Types.ObjectId(userAId),
          cropName: 'Wheat',
          fieldLocation: 'North Plot #4',
          imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
          diseaseName: 'Yellow Rust',
          severity: 'moderate',
          confidence: 94.5,
          status: 'completed',
          remediation: 'Apply Propiconazole 25% EC @ 1ml/L',
        },
        {
          userId: new mongoose.Types.ObjectId(userAId),
          cropName: 'Mustard',
          fieldLocation: 'East Plot #2',
          imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
          diseaseName: 'Optimal / Healthy Foliage',
          severity: 'healthy',
          confidence: 98.2,
          status: 'completed',
          remediation: 'No intervention required.',
        },
      ])

      // Create an activity for User A
      await Activity.create({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'crop_registered',
        title: 'Crop Registered',
        description: 'Wheat (PBW 343) added to North Plot #4.',
      })

      // Create crops and scans for User B
      await Crop.create({
        userId: new mongoose.Types.ObjectId(userBId),
        name: 'Cotton',
        variety: 'Bt Cotton',
        area: 25.0,
        stage: 'fruiting',
        healthStatus: 'critical',
        location: 'South Sector #1',
      })

      await Scan.create({
        userId: new mongoose.Types.ObjectId(userBId),
        cropName: 'Cotton',
        fieldLocation: 'South Sector #1',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f',
        diseaseName: 'Boll Rot',
        severity: 'high',
        confidence: 89.0,
        status: 'completed',
        remediation: 'Copper Oxychloride spray.',
      })
    })

    it('should aggregate only User A data on /overview', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.totalScans).toBe(2)
      expect(res.body.data.healthyScans).toBe(1)
      expect(res.body.data.diseaseScans).toBe(1)
      expect(res.body.data.totalCrops).toBe(2)
      expect(res.body.data.monitoredAcres).toBe(20.5) // 12.5 + 8.0 (excluding User B's 25.0)
      expect(res.body.data.healthyCrops).toBe(1)
      expect(res.body.data.healthIndex).toBe(50) // (1 healthy scan + 1 healthy crop) / 4 = 50%
    })

    it('should aggregate only User B data on /overview without data leakage', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(200)
      expect(res.body.data.totalScans).toBe(1)
      expect(res.body.data.healthyScans).toBe(0)
      expect(res.body.data.diseaseScans).toBe(1)
      expect(res.body.data.totalCrops).toBe(1)
      expect(res.body.data.monitoredAcres).toBe(25.0)
      expect(res.body.data.healthIndex).toBe(0) // 0 healthy / 2 items = 0%
    })

    it('should return recent scans isolated to User A', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-scans')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans.length).toBe(2)
      const crops = res.body.data.scans.map((s: { cropName: string }) => s.cropName)
      expect(crops).toContain('Wheat')
      expect(crops).toContain('Mustard')
      expect(crops).not.toContain('Cotton') // User B's crop must not be leaked
    })

    it('should filter recent scans by severity', async () => {
      const res = await request(app)
        .get('/api/dashboard/recent-scans?severity=healthy')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans.length).toBe(1)
      expect(res.body.data.scans[0].cropName).toBe('Mustard')
      expect(res.body.data.scans[0].severity).toBe('healthy')
    })

    it('should return user activity logs for User A only', async () => {
      const res = await request(app)
        .get('/api/dashboard/activity')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.activities.length).toBeGreaterThanOrEqual(1)
      expect(res.body.data.activities[0].title).toBe('Crop Registered')
    })
  })
})

