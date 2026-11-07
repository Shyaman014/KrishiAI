import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Scan } from '../src/models/Scan'
import { Activity } from '../src/models/Activity'
import { Recommendation } from '../src/models/Recommendation'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

describe('KrishiAI Phase 8: Treatment Recommendation API Suite', () => {
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
      Scan.deleteMany({}),
      Activity.deleteMany({}),
      Recommendation.deleteMany({}),
    ])

    // Suppress AI service calls in GeminiExplanationService
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('AI offline'))

    const userA = await User.create({
      fullName: 'Ramesh Patel',
      email: 'ramesh.reco@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'hi',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Bina Das',
      email: 'bina.reco@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'as',
      role: 'farmer',
      isVerified: true,
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  const createCompletedScan = async (ownerId: string, overrides: Record<string, unknown> = {}) => {
    return Scan.create({
      userId: new mongoose.Types.ObjectId(ownerId),
      cropName: 'Tomato',
      predictedCrop: 'Tomato',
      diseaseName: 'Early Blight (Alternaria solani)',
      predictedDisease: 'Early Blight (Alternaria solani)',
      isHealthy: false,
      severity: 'high',
      confidence: 91.5,
      status: 'completed',
      imageUrl: 'https://res.cloudinary.com/test/image/upload/sample.jpg',
      ...overrides,
    })
  }

  // ─── 1. Route Protection & User Isolation ──────────────────────────────────
  describe('1. Route Protection & User Isolation', () => {
    it('rejects unauthenticated request to GET /recommendations with 401', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app).get(`/api/scans/${scan._id}/recommendations`)
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to POST /recommendations/generate with 401', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app).post(`/api/scans/${scan._id}/recommendations/generate`)
      expect(res.status).toBe(401)
    })

    it('returns 404 when scan belongs to another user (User B cannot access User A scan)', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserB}`)
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid scan ID format', async () => {
      const res = await request(app)
        .get('/api/scans/invalid-id/recommendations')
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(res.status).toBe(400)
    })
  })

  // ─── 2. GET Recommendations ────────────────────────────────────────────────
  describe('2. GET /api/scans/:id/recommendations', () => {
    it('returns 200 with hasRecommendation: false when no recommendation exists', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.hasRecommendation).toBe(false)
      expect(res.body.data.recommendation).toBeNull()
    })

    it('returns 200 with recommendation when one exists', async () => {
      const scan = await createCompletedScan(userAId)
      await Recommendation.create({
        scanId: scan._id,
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Tomato',
        diseaseName: 'Early Blight',
        isHealthy: false,
        confidence: 91.5,
        immediateActions: [{ action: 'Remove infected leaves', urgency: 'high', instructions: 'Cut and dispose.' }],
        culturalPractices: [],
        biologicalControls: [],
        chemicalTreatments: [],
        safetyPrecautions: [],
        referenceSources: ['ICAR'],
        language: 'en',
        status: 'active',
      })

      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.hasRecommendation).toBe(true)
      expect(res.body.data.recommendation.cropName).toBe('Tomato')
    })
  })

  // ─── 3. Scan Status Validation ─────────────────────────────────────────────
  describe('3. Scan Eligibility Validation', () => {
    it('returns 400 for a PENDING scan', async () => {
      const scan = await createCompletedScan(userAId, { status: 'pending', diseaseName: 'Pending' })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/processing|pending|eligible/i)
    })

    it('returns 400 for a FAILED scan', async () => {
      const scan = await createCompletedScan(userAId, { status: 'failed', diseaseName: 'Failed Scan' })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/failed|eligible/i)
    })
  })

  // ─── 4. Recommendation Generation ──────────────────────────────────────────
  describe('4. Recommendation Generation & Persistence', () => {
    it('generates recommendation for a completed scan with knowledge base data', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.recommendation).toBeDefined()
      expect(res.body.data.recommendation.cropName).toBe('Tomato')
      expect(res.body.data.recommendation.status).toBe('active')
      expect(res.body.data.recommendation.immediateActions.length).toBeGreaterThan(0)

      // Verify database persistence
      const dbRec = await Recommendation.findOne({ scanId: scan._id, userId: userAId })
      expect(dbRec).not.toBeNull()
      expect(dbRec!.status).toBe('active')

      // Verify activity log
      const activity = await Activity.findOne({ userId: userAId, type: 'recommendation_generated' })
      expect(activity).not.toBeNull()
    })

    it('returns cached recommendation on duplicate request without regenerate flag', async () => {
      const scan = await createCompletedScan(userAId)

      // First generate
      await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      // Second request — should return cached
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: false })

      expect(res.status).toBe(200)
      expect(res.body.data.cached).toBe(true)

      // Should still be only 1 active recommendation
      const count = await Recommendation.countDocuments({ scanId: scan._id, status: 'active' })
      expect(count).toBe(1)
    })

    it('forces regeneration with regenerate: true and supersedes old recommendation', async () => {
      const scan = await createCompletedScan(userAId)

      // First generate
      const first = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const firstId = first.body.data.recommendation._id

      // Regenerate
      const second = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: true })

      expect(second.status).toBe(200)
      expect(second.body.data.recommendation._id).not.toBe(firstId)

      // Old recommendation should be superseded
      const old = await Recommendation.findById(firstId)
      expect(old!.status).toBe('superseded')
    })

    it('generates recommendation with low confidence — no chemical treatments', async () => {
      const scan = await createCompletedScan(userAId, { confidence: 35 })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      expect(res.body.data.recommendation.chemicalTreatments).toEqual([])
    })
  })

  // ─── 5. Feedback ───────────────────────────────────────────────────────────
  describe('5. Farmer Feedback on Recommendations', () => {
    it('records valid feedback with 201', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const recId = genRes.body.data.recommendation._id

      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          wasHelpful: true,
          followedPractices: true,
          rating: 4,
          comments: 'Very useful recommendations.',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.recommendation.feedback.rating).toBe(4)
      expect(res.body.data.recommendation.feedback.wasHelpful).toBe(true)
    })

    it('returns 400 for invalid rating > 5', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const recId = genRes.body.data.recommendation._id

      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          wasHelpful: true,
          followedPractices: false,
          rating: 10,
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('returns 404 for feedback on recommendation owned by another user', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const recId = genRes.body.data.recommendation._id

      // User B tries to submit feedback on User A's recommendation
      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          wasHelpful: true,
          followedPractices: true,
          rating: 3,
        })

      expect(res.status).toBe(404)
    })
  })

  // ─── 6. Multilingual Support ───────────────────────────────────────────────
  describe('6. Multilingual Recommendation Generation', () => {
    it('generates recommendation with language: hi successfully', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'hi' })

      expect(res.status).toBe(200)
      expect(res.body.data.recommendation.language).toBe('hi')
    })
  })
})

