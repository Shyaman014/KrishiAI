import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Scan } from '../src/models/Scan'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

const MOCK_AI_RESPONSE = {
  success: true,
  scan_id: null,
  crop: 'Tomato',
  disease: 'Early Blight (Alternaria solani)',
  is_healthy: false,
  severity: 'high',
  confidence: 87.3,
  status: 'completed',
  is_confident: true,
  top_predictions: [
    {
      class_id: 1,
      raw_class: 'Tomato___Early_blight',
      crop: 'Tomato',
      disease: 'Early Blight (Alternaria solani)',
      is_healthy: false,
      severity: 'high',
      confidence: 87.3,
    },
  ],
  model_version: 'EfficientNet-B0-PlantVillage-v1.0',
  processing_time_ms: 245.7,
  message: 'AI diagnostic screening completed successfully.',
}

describe('POST /api/scans/:id/analyze', () => {
  let tokenUserA: string
  let tokenUserB: string
  let userAId: string
  let userBId: string

  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_TEST_URI)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Scan.deleteMany({}),
      Activity.deleteMany({}),
    ])

    const userA = await User.create({
      fullName: 'Vikram Choudhary',
      email: 'vikram.analyze@krishiai.farm',
      password: 'Password@123',
      phone: '+919876543210',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({
      userId: userAId,
      email: userA.email,
      role: userA.role,
    })

    const userB = await User.create({
      fullName: 'Sunita Patel',
      email: 'sunita.analyze@krishiai.farm',
      password: 'Password@123',
      phone: '+919876543211',
      role: 'farmer',
      isVerified: true,
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({
      userId: userBId,
      email: userB.email,
      role: userB.role,
    })
  })

  const createPendingScan = async (ownerId: string) => {
    return Scan.create({
      userId: new mongoose.Types.ObjectId(ownerId),
      cropName: 'Tomato',
      imageUrl: 'https://res.cloudinary.com/test/image/upload/sample.jpg',
      diseaseName: 'Pending AI Analysis',
      severity: 'healthy',
      confidence: 0,
      status: 'pending',
    })
  }

  it('returns 401 when not authenticated', async () => {
    const scan = await createPendingScan(userAId)
    const res = await request(app).post(`/api/scans/${scan._id}/analyze`)
    expect(res.status).toBe(401)
  })

  it('returns 400 for an invalid scan ID format', async () => {
    const res = await request(app)
      .post('/api/scans/invalid-id-format/analyze')
      .set('Authorization', `Bearer ${tokenUserA}`)
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 when scan does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app)
      .post(`/api/scans/${fakeId}/analyze`)
      .set('Authorization', `Bearer ${tokenUserA}`)
    expect(res.status).toBe(404)
  })

  it('returns 404 when scan belongs to another user (user isolation)', async () => {
    const scan = await createPendingScan(userAId)
    const res = await request(app)
      .post(`/api/scans/${scan._id}/analyze`)
      .set('Authorization', `Bearer ${tokenUserB}`)
    expect(res.status).toBe(404)
  })

  it('returns 409 when scan is already completed', async () => {
    const scan = await Scan.create({
      userId: new mongoose.Types.ObjectId(userAId),
      cropName: 'Tomato',
      imageUrl: 'https://example.com/image.jpg',
      diseaseName: 'Some Disease',
      severity: 'moderate',
      confidence: 85,
      status: 'completed',
    })

    const res = await request(app)
      .post(`/api/scans/${scan._id}/analyze`)
      .set('Authorization', `Bearer ${tokenUserA}`)
    expect(res.status).toBe(409)
  })

  it('returns 200 and updates scan on successful AI response', async () => {
    const scan = await createPendingScan(userAId)

    // Mock image download
    mockedAxios.get = jest.fn().mockResolvedValueOnce({
      data: Buffer.from('fake-image-bytes'),
    })

    // Mock AI service response
    mockedAxios.post = jest.fn().mockResolvedValueOnce({
      data: MOCK_AI_RESPONSE,
    })

    const res = await request(app)
      .post(`/api/scans/${scan._id}/analyze`)
      .set('Authorization', `Bearer ${tokenUserA}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.scan.status).toBe('completed')
    expect(res.body.data.scan.diseaseName).toBe('Early Blight (Alternaria solani)')
    expect(res.body.data.scan.confidence).toBe(87.3)
    expect(res.body.data.scan.predictedCrop).toBe('Tomato')

    // Verify database was updated
    const updated = await Scan.findById(scan._id)
    expect(updated?.status).toBe('completed')
    expect(updated?.diseaseName).toBe('Early Blight (Alternaria solani)')
    expect(updated?.predictedCrop).toBe('Tomato')
  })

  it('marks scan as failed when AI service is unavailable', async () => {
    const scan = await createPendingScan(userAId)

    mockedAxios.get = jest.fn().mockResolvedValueOnce({
      data: Buffer.from('fake-image-bytes'),
    })

    mockedAxios.post = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const res = await request(app)
      .post(`/api/scans/${scan._id}/analyze`)
      .set('Authorization', `Bearer ${tokenUserA}`)

    // Expect server error
    expect([500, 502, 503]).toContain(res.status)
    const updated = await Scan.findById(scan._id)
    expect(updated?.status).toBe('failed')
  })
})
