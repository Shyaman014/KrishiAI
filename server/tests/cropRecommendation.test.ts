/**
 * Phase 10: Crop Recommendation API – Server Tests
 *
 * Tests:
 *  1. Route protection (401 without auth)
 *  2. Valid soil input → 200 with recommendations
 *  3. Missing required fields → 400
 *  4. Invalid ranges → 400
 *  5. History isolation (User A cannot see User B history)
 *  6. GET by ID isolation
 *  7. Activity log created on successful recommendation
 *  8. Weather service failure handled gracefully
 *  9. AI service failure returns 503
 * 10. Missing temperature resolved from weather context
 * 11. Language parameter accepted (hi, as)
 * 12. Invalid recommendation ID format
 */

import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { CropRecommendation } from '../src/models/CropRecommendation'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_BODY = {
  N: 90,
  P: 42,
  K: 43,
  temperature: 20.5,
  humidity: 82.0,
  ph: 6.5,
  rainfall: 202.9,
  language: 'en',
}

const AI_RESPONSE = {
  success: true,
  model_version: '1.0.0',
  recommendations: [
    {
      rank: 1,
      crop: 'rice',
      confidence: 0.42,
      confidence_pct: 42.0,
      supporting_factors: [
        {
          factor: 'Nitrogen',
          value: '90.0 kg/ha',
          importance_pct: '17.9%',
          explanation: 'High nitrogen supports heavy feeders like rice.',
        },
      ],
      growing_duration: '90–150 days',
      water_requirement: 'High',
      suitable_season: 'Kharif',
      soil_requirement: 'Clay/loamy, pH 5.0–7.0',
      description: 'Staple cereal crop.',
      source: 'ICAR',
      disclaimer: 'Verify with local expert.',
    },
    {
      rank: 2,
      crop: 'maize',
      confidence: 0.28,
      confidence_pct: 28.0,
      supporting_factors: [],
      growing_duration: '90–120 days',
      water_requirement: 'Medium',
      suitable_season: 'Kharif / Rabi',
      soil_requirement: 'Loamy, pH 5.5–7.5',
      description: 'Versatile cereal.',
      source: 'ICAR-IIMR',
      disclaimer: 'Verify with local expert.',
    },
    {
      rank: 3,
      crop: 'jute',
      confidence: 0.12,
      confidence_pct: 12.0,
      supporting_factors: [],
      growing_duration: '100–120 days',
      water_requirement: 'High',
      suitable_season: 'Kharif',
      soil_requirement: 'Alluvial loam',
      description: 'Natural bast fibre crop.',
      source: 'ICAR-NIRJAFT',
      disclaimer: 'Verify with local expert.',
    },
  ],
  disclaimer: 'Model predictions are not guaranteed agricultural suitability.',
  data_source_note: 'Synthetic agronomic data from ICAR/FAO ranges.',
}

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('KrishiAI Phase 10: Crop Recommendation System', () => {
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
      CropRecommendation.deleteMany({}),
      Activity.deleteMany({}),
    ])

    mockedAxios.get = jest.fn().mockRejectedValue(new Error('External API offline'))
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('AI service offline'))

    const userA = await User.create({
      fullName: 'Ramesh Kumar',
      email: 'ramesh@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Sunita Devi',
      email: 'sunita@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  // ── 1. Route Protection ───────────────────────────────────────────────────

  describe('1. Route Protection', () => {
    it('POST /api/crops/recommend returns 401 without auth token', async () => {
      const res = await request(app).post('/api/crops/recommend').send(VALID_BODY)
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('GET /api/crops/recommendations/history returns 401 without auth token', async () => {
      const res = await request(app).get('/api/crops/recommendations/history')
      expect(res.status).toBe(401)
    })

    it('GET /api/crops/recommendations/:id returns 401 without auth token', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app).get(`/api/crops/recommendations/${fakeId}`)
      expect(res.status).toBe(401)
    })
  })

  // ── 2. Valid Input → Successful Recommendation ───────────────────────────

  describe('2. POST /api/crops/recommend – Valid Input', () => {
    beforeEach(() => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: AI_RESPONSE })
    })

    it('returns 200 with recommendations', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('returns exactly 3 recommendations', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.body.data.recommendations).toHaveLength(3)
    })

    it('recommendations have correct crop names', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      const crops = res.body.data.recommendations.map((r: { cropName: string }) => r.cropName)
      expect(crops).toContain('rice')
    })

    it('response includes disclaimer', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.body.data.disclaimer).toBeTruthy()
      expect(res.body.data.disclaimer.length).toBeGreaterThan(10)
    })

    it('response includes modelVersion', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.body.data.modelVersion).toBe('1.0.0')
    })

    it('response echoes back inputs', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.body.data.inputs.N).toBe(VALID_BODY.N)
      expect(res.body.data.inputs.ph).toBe(VALID_BODY.ph)
    })

    it('response includes createdAt timestamp', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.body.data.createdAt).toBeTruthy()
    })

    it('accepts language=hi', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, language: 'hi' })

      expect(res.status).toBe(200)
    })

    it('accepts language=as', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, language: 'as' })

      expect(res.status).toBe(200)
    })

    it('persists recommendation to database', async () => {
      await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      const count = await CropRecommendation.countDocuments({ userId: userAId })
      expect(count).toBe(1)
    })
  })

  // ── 3. Missing Required Fields ───────────────────────────────────────────

  describe('3. POST /api/crops/recommend – Missing Required Fields', () => {
    const requiredFields = ['N', 'P', 'K', 'ph', 'rainfall']

    test.each(requiredFields)('missing %s returns 400', async (field) => {
      const payload = Object.fromEntries(
        Object.entries(VALID_BODY).filter(([k]) => k !== field),
      )
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(payload)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  // ── 4. Invalid Ranges ────────────────────────────────────────────────────

  describe('4. POST /api/crops/recommend – Invalid Ranges', () => {
    it('N < 0 returns 400', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, N: -1 })

      expect(res.status).toBe(400)
    })

    it('ph > 14 returns 400', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, ph: 15 })

      expect(res.status).toBe(400)
    })

    it('humidity > 100 returns 400', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, humidity: 101 })

      expect(res.status).toBe(400)
    })

    it('invalid language returns 400', async () => {
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ ...VALID_BODY, language: 'fr' })

      expect(res.status).toBe(400)
    })
  })

  // ── 5. History Isolation ─────────────────────────────────────────────────

  describe('5. GET /api/crops/recommendations/history – Isolation', () => {
    beforeEach(async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: AI_RESPONSE })
      // Create a recommendation for User A only
      await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)
    })

    it('User A sees their own history', async () => {
      const res = await request(app)
        .get('/api/crops/recommendations/history')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.pagination.total).toBe(1)
    })

    it('User B sees empty history (isolation)', async () => {
      const res = await request(app)
        .get('/api/crops/recommendations/history')
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(200)
      expect(res.body.data.pagination.total).toBe(0)
      expect(res.body.data.items).toHaveLength(0)
    })

    it('history response has correct pagination shape', async () => {
      const res = await request(app)
        .get('/api/crops/recommendations/history')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.body.data.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })
  })

  // ── 6. GET by ID Isolation ───────────────────────────────────────────────

  describe('6. GET /api/crops/recommendations/:id – Isolation', () => {
    let recId: string

    beforeEach(async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: AI_RESPONSE })
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)
      recId = res.body.data.id
    })

    it('User A can retrieve their recommendation by ID', async () => {
      const res = await request(app)
        .get(`/api/crops/recommendations/${recId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(recId)
    })

    it('User B cannot access User A recommendation (404 isolation)', async () => {
      const res = await request(app)
        .get(`/api/crops/recommendations/${recId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)
    })

    it('invalid ObjectId returns 400', async () => {
      const res = await request(app)
        .get('/api/crops/recommendations/not-a-valid-id')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
    })

    it('non-existent ID returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app)
        .get(`/api/crops/recommendations/${fakeId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(404)
    })
  })

  // ── 7. Activity Log ──────────────────────────────────────────────────────

  describe('7. Activity Log', () => {
    it('creates activity record on successful recommendation', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: AI_RESPONSE })

      await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      const activity = await Activity.findOne({
        userId: userAId,
        type: 'crop_recommendation_generated',
      })
      expect(activity).not.toBeNull()
      expect(activity?.title).toMatch(/Crop Recommendation/i)
    })
  })

  // ── 8. Weather Service Failure ───────────────────────────────────────────

  describe('8. Weather Service Failure Handled Gracefully', () => {
    it('still returns recommendation when weather context fails', async () => {
      // axios.post will succeed for AI service but we set up weather to fail
      mockedAxios.get = jest.fn().mockRejectedValue(new Error('Weather API down'))
      mockedAxios.post = jest.fn().mockResolvedValue({ data: AI_RESPONSE })

      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY) // includes temperature & humidity so weather not required

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  // ── 9. AI Service Failure ────────────────────────────────────────────────

  describe('9. AI Service Failure Returns 503', () => {
    it('returns 503 when AI service is unavailable', async () => {
      mockedAxios.post = jest.fn().mockRejectedValue(new Error('Connection refused'))

      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(VALID_BODY)

      expect(res.status).toBe(503)
      expect(res.body.success).toBe(false)
    })
  })

  // ── 10. Missing Temperature – Requires weather or body ───────────────────

  describe('10. Missing temperature without weather fallback', () => {
    it('returns 400 when temperature not provided and no location for weather', async () => {
      const { temperature: _t, ...bodyNoTemp } = VALID_BODY
      const res = await request(app)
        .post('/api/crops/recommend')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send(bodyNoTemp)

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/temperature/i)
    })
  })
})

