import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Scan } from '../src/models/Scan'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

const app = createApp()

// Helper: 1x1 valid minimal JPEG buffer with standard FF D8 FF signature
const validJpegBuffer = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
  0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
  0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
  0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xd9,
])

// Helper: 1x1 valid minimal PNG buffer with standard 89 50 4E 47 signature
const validPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
])

describe('KrishiAI Crop Image Upload & Scans Suite', () => {
  let userAId: string
  let userBId: string
  let tokenUserA: string
  let tokenUserB: string

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_TEST_URI)
    await Promise.all([
      User.deleteMany({}),
      Scan.deleteMany({}),
      Activity.deleteMany({}),
    ])

    // Farmer A
    const userA = await User.create({
      fullName: 'Vikram Choudhary',
      email: 'vikram.c@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'hi',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, role: 'farmer', email: userA.email })

    // Farmer B
    const userB = await User.create({
      fullName: 'Anita Devi',
      email: 'anita.d@krishiai.farm',
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

  describe('1. Upload Route Protection & Validation', () => {
    it('should reject unauthenticated upload with 401', async () => {
      const res = await request(app)
        .post('/api/scans/upload')
        .attach('image', validJpegBuffer, 'leaf.jpg')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should reject request when no image file is attached with 400', async () => {
      const res = await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .field('cropName', 'Wheat')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/provide a crop leaf photograph/i)
    })

    it('should reject fake image disguised with .jpg extension (Magic Byte check)', async () => {
      const fakeTextBuffer = Buffer.from('<!DOCTYPE html><html><body>malicious payload</body></html>')

      const res = await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('image', fakeTextBuffer, 'not_an_image.jpg')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/signature does not match|Invalid/i)
    })

    it('should reject unsupported file MIME types like text/plain', async () => {
      const res = await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('image', Buffer.from('sample plain text'), 'notes.txt')

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('2. Successful Image Upload & Database Record Creation', () => {
    let createdScanId: string

    it('should successfully upload a valid JPEG leaf photo and set status to PENDING', async () => {
      const res = await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('image', validJpegBuffer, 'wheat_leaf.jpg')
        .field('cropName', 'Wheat (PBW 343)')
        .field('cropCategory', 'Cereals')
        .field('growthStage', 'vegetative')
        .field('fieldLocation', 'Plot #4 North')
        .field('additionalObservations', 'Early rust spots on lower foliage')

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scan).toBeDefined()
      expect(res.body.data.scan.cropName).toBe('Wheat (PBW 343)')
      expect(res.body.data.scan.cropCategory).toBe('Cereals')
      expect(res.body.data.scan.growthStage).toBe('vegetative')
      expect(res.body.data.scan.fieldLocation).toBe('Plot #4 North')
      expect(res.body.data.scan.status).toBe('pending') // MUST BE PENDING
      expect(res.body.data.scan.diseaseName).toBe('Pending AI Analysis')
      expect(res.body.data.scan.confidence).toBe(0) // NEVER FAKE PREDICTIONS
      expect(res.body.data.scan.imageUrl).toBeDefined()

      createdScanId = res.body.data.scan.id

      // Verify Scan exists in MongoDB
      const scanInDb = await Scan.findById(createdScanId)
      expect(scanInDb).not.toBeNull()
      expect(scanInDb?.status).toBe('pending')
      expect(scanInDb?.userId.toString()).toBe(userAId)

      // Verify Activity log was generated
      const activity = await Activity.findOne({
        userId: userAId,
        type: 'scan_submitted',
      })
      expect(activity).not.toBeNull()
      expect(activity?.title).toBe('Crop Scan Submitted')
    })

    it('should successfully upload a valid PNG leaf photo with default optional fields', async () => {
      const res = await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('image', validPngBuffer, 'mustard_leaf.png')

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scan.cropName).toBe('Unspecified Crop')
      expect(res.body.data.scan.cropCategory).toBe('Other')
      expect(res.body.data.scan.status).toBe('pending')
    })
  })

  describe('3. Scan History Retrieval & User Data Isolation', () => {
    beforeAll(async () => {
      // Create a scan for User B
      await request(app)
        .post('/api/scans/upload')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .attach('image', validJpegBuffer, 'cotton.jpg')
        .field('cropName', 'Cotton (Bt-2)')
    })

    it('should retrieve paginated scans belonging only to User A', async () => {
      const res = await request(app)
        .get('/api/scans?page=1&limit=10')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.scans.length).toBe(2)
      const cropNames = res.body.data.scans.map((s: { cropName: string }) => s.cropName)
      expect(cropNames).toContain('Wheat (PBW 343)')
      expect(cropNames).toContain('Unspecified Crop')
      expect(cropNames).not.toContain('Cotton (Bt-2)') // User B's scan must NEVER leak
    })

    it('should filter scans by search term', async () => {
      const res = await request(app)
        .get('/api/scans?search=Wheat')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans.length).toBe(1)
      expect(res.body.data.scans[0].cropName).toBe('Wheat (PBW 343)')
    })

    it('should filter scans by status=pending', async () => {
      const res = await request(app)
        .get('/api/scans?status=pending')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scans.every((s: { status: string }) => s.status === 'pending')).toBe(true)
    })

    it('should prevent User A from fetching User B scan by ID (404 Not Found)', async () => {
      // Find User B's scan ID
      const userBScan = await Scan.findOne({ userId: userBId })
      expect(userBScan).not.toBeNull()

      const res = await request(app)
        .get(`/api/scans/${userBScan!._id.toString()}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('should prevent User A from deleting User B scan (404 Not Found)', async () => {
      const userBScan = await Scan.findOne({ userId: userBId })

      const res = await request(app)
        .delete(`/api/scans/${userBScan!._id.toString()}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)

      // Ensure User B's scan was not deleted
      const stillExists = await Scan.findById(userBScan!._id)
      expect(stillExists).not.toBeNull()
    })

    it('should allow User A to delete their own scan', async () => {
      const userAScan = await Scan.findOne({ userId: userAId })
      expect(userAScan).not.toBeNull()

      const res = await request(app)
        .delete(`/api/scans/${userAScan!._id.toString()}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const check = await Scan.findById(userAScan!._id)
      expect(check).toBeNull()
    })
  })
})

