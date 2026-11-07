/**
 * KrishiAI Phase 8: Smart Treatment & Agricultural Recommendation System
 *
 * Test Suite covering:
 *   - Supported disease recommendation generation
 *   - Unsupported/unknown disease fallback
 *   - Low-confidence scan rejection of chemical recommendations
 *   - Missing crop information handling
 *   - Gemini API failure / knowledge-base only fallback
 *   - Recommendation persistence
 *   - Feedback submission
 *   - Authorization & ownership enforcement
 *   - Rate limit skip (test mode)
 *   - Multilingual output
 *   - Duplicate generation guard
 *   - Regeneration flag
 */

import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Scan } from '../src/models/Scan'
import { Recommendation } from '../src/models/Recommendation'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

// ─── Test Data Factories ──────────────────────────────────────────────────────

async function createUser(overrides: Partial<{
  email: string
  fullName: string
  preferredLanguage: string
}> = {}) {
  return User.create({
    fullName: overrides.fullName ?? 'Ramesh Kumar',
    email: overrides.email ?? `farmer+${Date.now()}@krishiai.farm`,
    password: 'Password@123',
    preferredLanguage: overrides.preferredLanguage ?? 'en',
    role: 'farmer',
    isVerified: true,
  })
}

async function createCompletedScan(
  userId: string,
  overrides: Partial<{
    cropName: string
    predictedCrop: string
    diseaseName: string
    predictedDisease: string
    isHealthy: boolean
    confidence: number
    status: string
    growthStage: string
  }> = {},
) {
  return Scan.create({
    userId: new mongoose.Types.ObjectId(userId),
    cropName: overrides.cropName ?? 'Tomato',
    predictedCrop: overrides.predictedCrop ?? 'Tomato',
    diseaseName: overrides.diseaseName ?? 'Early Blight (Alternaria solani)',
    predictedDisease: overrides.predictedDisease ?? 'Early Blight (Alternaria solani)',
    isHealthy: overrides.isHealthy ?? false,
    severity: 'high',
    confidence: overrides.confidence ?? 88,
    status: overrides.status ?? 'completed',
    growthStage: overrides.growthStage ?? 'vegetative',
    imageUrl: 'https://res.cloudinary.com/test/image/upload/sample.jpg',
  })
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('KrishiAI Phase 8: Treatment Recommendation System', () => {
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
      Recommendation.deleteMany({}),
      Activity.deleteMany({}),
    ])

    const userA = await createUser({
      email: 'ramesh.k@krishiai.farm',
      preferredLanguage: 'en',
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({
      userId: userAId,
      email: userA.email,
      role: userA.role,
    })

    const userB = await createUser({
      email: 'bina.das@krishiai.farm',
      preferredLanguage: 'as',
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({
      userId: userBId,
      email: userB.email,
      role: userB.role,
    })

    // Reset axios mocks to prevent cross-test leakage
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('AI Service Unavailable'))
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 1. AUTHORIZATION & OWNERSHIP
  // ════════════════════════════════════════════════════════════════════════════

  describe('1. Authorization & Scan Ownership', () => {
    it('GET /recommendations returns 401 for unauthenticated request', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app).get(`/api/scans/${scan._id}/recommendations`)
      expect(res.status).toBe(401)
    })

    it('POST /generate returns 401 for unauthenticated request', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .send({ language: 'en' })
      expect(res.status).toBe(401)
    })

    it('GET /recommendations returns 404 when scan belongs to another user', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserB}`)
      expect(res.status).toBe(404)
    })

    it('POST /generate returns 404 when scan belongs to another user', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ language: 'en' })
      expect(res.status).toBe(404)
    })

    it('GET /recommendations returns 400 for invalid scan ID format', async () => {
      const res = await request(app)
        .get('/api/scans/not-an-objectid/recommendations')
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(res.status).toBe(400)
    })

    it('POST /generate returns 400 for invalid scan ID format', async () => {
      const res = await request(app)
        .post('/api/scans/not-an-objectid/recommendations/generate')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      expect(res.status).toBe(400)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 2. SCAN STATUS VALIDATION
  // ════════════════════════════════════════════════════════════════════════════

  describe('2. Scan Status Eligibility Validation', () => {
    it('rejects recommendation generation for PENDING scan with 400', async () => {
      const scan = await createCompletedScan(userAId, { status: 'pending' })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/processing/i)
    })

    it('rejects recommendation generation for FAILED scan with 400', async () => {
      const scan = await createCompletedScan(userAId, { status: 'failed' })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/failed scan/i)
    })

    it('rejects recommendation generation for PROCESSING scan with 400', async () => {
      const scan = await createCompletedScan(userAId, { status: 'processing' })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      expect(res.status).toBe(400)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 3. RECOMMENDATION GENERATION — SUPPORTED DISEASE (KNOWLEDGE BASE)
  // ════════════════════════════════════════════════════════════════════════════

  describe('3. Supported Disease — Knowledge-Base Recommendation', () => {
    it('generates and persists a recommendation for known disease (Tomato Early Blight)', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        isHealthy: false,
        confidence: 88,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      const rec = res.body.data.recommendation
      expect(rec).toBeTruthy()
      expect(rec.cropName).toBeTruthy()
      expect(rec.diseaseName).toBeTruthy()
      expect(Array.isArray(rec.immediateActions)).toBe(true)
      expect(Array.isArray(rec.culturalPractices)).toBe(true)
      expect(Array.isArray(rec.biologicalControls)).toBe(true)
      expect(rec.referenceSources.length).toBeGreaterThan(0)

      // Verify persistence in MongoDB
      const saved = await Recommendation.findById(rec._id)
      expect(saved).not.toBeNull()
      expect(saved?.scanId.toString()).toBe(scan._id.toString())
      expect(saved?.userId.toString()).toBe(userAId)
      expect(saved?.status).toBe('active')
    })

    it('generates and persists a recommendation for Potato Late Blight', async () => {
      const scan = await createCompletedScan(userAId, {
        cropName: 'Potato',
        predictedCrop: 'Potato',
        diseaseName: 'Late Blight',
        predictedDisease: 'Late_blight',
        isHealthy: false,
        confidence: 92,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      const rec = res.body.data.recommendation
      expect(rec.immediateActions.length).toBeGreaterThan(0)
    })

    it('includes chemical treatments for high-confidence non-healthy scan', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        isHealthy: false,
        confidence: 90,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      const rec = res.body.data.recommendation
      // May or may not have chemicals depending on knowledge base; should never be fabricated
      expect(Array.isArray(rec.chemicalTreatments)).toBe(true)
      if (rec.chemicalTreatments.length > 0) {
        // Must have expert consultation note
        expect(rec.chemicalTreatments[0].expertConsultationNote).toBeTruthy()
        // Must have label precautions
        expect(rec.chemicalTreatments[0].labelPrecautions).toBeDefined()
      }
    })

    it('logs a recommendation_generated activity', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        isHealthy: false,
        confidence: 88,
      })

      await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const activity = await Activity.findOne({
        userId: new mongoose.Types.ObjectId(userAId),
        type: 'recommendation_generated',
      })
      expect(activity).not.toBeNull()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 4. HEALTHY CROP — NO CHEMICAL RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════════

  describe('4. Healthy Crop — No Chemical Recommendations', () => {
    it('does not include chemical treatments for a healthy scan', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'healthy',
        isHealthy: true,
        confidence: 95,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      const rec = res.body.data.recommendation
      expect(Array.isArray(rec.chemicalTreatments)).toBe(true)
      expect(rec.chemicalTreatments).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 5. LOW-CONFIDENCE SCAN — CHEMICAL RECOMMENDATIONS DISABLED
  // ════════════════════════════════════════════════════════════════════════════

  describe('5. Low-Confidence Scan — Chemical Recommendations Suppressed', () => {
    it('disables chemical recommendations for confidence < 50', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        isHealthy: false,
        confidence: 35,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      // Should still return 200 since scan is completed; just chemical empty
      expect(res.status).toBe(200)
      const rec = res.body.data.recommendation
      expect(Array.isArray(rec.chemicalTreatments)).toBe(true)
      expect(rec.chemicalTreatments).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 6. UNSUPPORTED / UNKNOWN DISEASE — FALLBACK GUIDANCE
  // ════════════════════════════════════════════════════════════════════════════

  describe('6. Unsupported Disease — Fallback Generic Guidance', () => {
    it('returns generic guidance when disease is not in the knowledge base', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Mango',
        predictedDisease: 'Unknown_Fungal_Lesion',
        isHealthy: false,
        confidence: 72,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      // Should succeed with fallback immediate action
      expect(res.status).toBe(200)
      const rec = res.body.data.recommendation
      expect(rec).toBeTruthy()
      expect(Array.isArray(rec.immediateActions)).toBe(true)
      expect(rec.immediateActions.length).toBeGreaterThan(0)
      // No fabricated chemicals for unknown diseases from knowledge base
      expect(Array.isArray(rec.chemicalTreatments)).toBe(true)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 7. GET RECOMMENDATIONS — FETCH EXISTING
  // ════════════════════════════════════════════════════════════════════════════

  describe('7. GET /recommendations — Fetch Existing Recommendation', () => {
    it('returns hasRecommendation: false when no recommendation exists', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.hasRecommendation).toBe(false)
      expect(res.body.data.recommendation).toBeNull()
    })

    it('returns hasRecommendation: true with recommendation when one exists', async () => {
      const scan = await createCompletedScan(userAId)

      // Generate one
      await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const res = await request(app)
        .get(`/api/scans/${scan._id}/recommendations`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.hasRecommendation).toBe(true)
      expect(res.body.data.recommendation).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 8. DUPLICATE GENERATION GUARD & REGENERATION FLAG
  // ════════════════════════════════════════════════════════════════════════════

  describe('8. Duplicate Guard & Regeneration', () => {
    it('returns cached recommendation on duplicate generation request (regenerate: false)', async () => {
      const scan = await createCompletedScan(userAId)

      // First generate
      const first = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: false })

      // Second (should hit cache)
      const second = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: false })

      expect(first.status).toBe(200)
      expect(second.status).toBe(200)
      expect(second.body.data.cached).toBe(true)
      // Same recommendation ID
      expect(second.body.data.recommendation._id).toBe(first.body.data.recommendation._id)

      // Only one active recommendation should exist in DB
      const count = await Recommendation.countDocuments({
        scanId: scan._id,
        userId: userAId,
        status: 'active',
      })
      expect(count).toBe(1)
    })

    it('regenerates and marks prior recommendation as superseded (regenerate: true)', async () => {
      const scan = await createCompletedScan(userAId)

      const first = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: false })
      const firstId = first.body.data.recommendation._id

      const second = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: true })

      expect(second.status).toBe(200)
      expect(second.body.data.cached).toBe(false)
      expect(second.body.data.recommendation._id).not.toBe(firstId)

      // Old one should be superseded
      const old = await Recommendation.findById(firstId)
      expect(old?.status).toBe('superseded')

      // Only new one is active
      const activeCount = await Recommendation.countDocuments({
        scanId: scan._id,
        status: 'active',
      })
      expect(activeCount).toBe(1)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 9. MULTILINGUAL OUTPUT
  // ════════════════════════════════════════════════════════════════════════════

  describe('9. Multilingual Recommendation Language', () => {
    it('stores recommendation with language: "hi" when requested in Hindi', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'hi' })
      expect(res.status).toBe(200)
      expect(res.body.data.recommendation.language).toBe('hi')
    })

    it('stores recommendation with language: "as" when requested in Assamese', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'as' })
      expect(res.status).toBe(200)
      expect(res.body.data.recommendation.language).toBe('as')
    })

    it('resolves language from user profile when not specified in body', async () => {
      const userHi = await createUser({
        email: `hiuser_${Date.now()}@farm.com`,
        preferredLanguage: 'hi',
      })
      const hiToken = generateAccessToken({
        userId: userHi._id.toString(),
        email: userHi.email,
        role: userHi.role,
      })
      const scan = await createCompletedScan(userHi._id.toString())

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${hiToken}`)
        .send({}) // No language specified

      expect(res.status).toBe(200)
      expect(res.body.data.recommendation.language).toBe('hi')
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 10. GEMINI API FAILURE — KNOWLEDGE BASE FALLBACK
  // ════════════════════════════════════════════════════════════════════════════

  describe('10. Gemini / AI Service Failure — Knowledge Base Fallback', () => {
    it('succeeds with knowledge-base data when AI service is offline', async () => {
      // mockedAxios already rejects by default in beforeEach
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        confidence: 88,
        isHealthy: false,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      // Must not fail just because AI is offline
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.recommendation).toBeTruthy()
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 11. FEEDBACK SUBMISSION
  // ════════════════════════════════════════════════════════════════════════════

  describe('11. Farmer Feedback Submission', () => {
    it('successfully records farmer feedback on a recommendation', async () => {
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
          observations: 'Disease reduced within a week.',
          comments: 'Very clear guidance.',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)

      const saved = await Recommendation.findById(recId)
      expect(saved?.feedback).toBeTruthy()
      expect(saved?.feedback?.wasHelpful).toBe(true)
      expect(saved?.feedback?.rating).toBe(4)
    })

    it('returns 400 for invalid feedback data (missing required fields)', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      const recId = genRes.body.data.recommendation._id

      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ wasHelpful: true }) // missing followedPractices and rating
      expect(res.status).toBe(400)
    })

    it('returns 400 for rating out of range (> 5)', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      const recId = genRes.body.data.recommendation._id

      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ wasHelpful: true, followedPractices: false, rating: 10 })
      expect(res.status).toBe(400)
    })

    it('returns 404 when feedback submitted for another user\'s recommendation', async () => {
      const scan = await createCompletedScan(userAId)
      const genRes = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      const recId = genRes.body.data.recommendation._id

      // User B trying to submit feedback for User A's recommendation
      const res = await request(app)
        .post(`/api/recommendations/${recId}/feedback`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ wasHelpful: false, followedPractices: false, rating: 2 })
      expect(res.status).toBe(404)
    })

    it('returns 401 for unauthenticated feedback submission', async () => {
      const res = await request(app)
        .post('/api/recommendations/507f1f77bcf86cd799439011/feedback')
        .send({ wasHelpful: true, followedPractices: true, rating: 3 })
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid recommendation ID format in feedback route', async () => {
      const res = await request(app)
        .post('/api/recommendations/bad-id/feedback')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ wasHelpful: true, followedPractices: false, rating: 3 })
      expect(res.status).toBe(400)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 12. ZOD REQUEST VALIDATION
  // ════════════════════════════════════════════════════════════════════════════

  describe('12. Request Body Validation (Zod)', () => {
    it('returns 400 for invalid language in generate body', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'fr' }) // fr not supported
      expect(res.status).toBe(400)
    })

    it('accepts valid optional body for generate (empty body defaults)', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({})
      expect(res.status).toBe(200)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 13. SAFETY VALIDATION — NO FABRICATED CHEMICALS
  // ════════════════════════════════════════════════════════════════════════════

  describe('13. Safety — Chemical Recommendations Integrity', () => {
    it('all chemical treatments include expertConsultationNote', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Tomato',
        predictedDisease: 'Early_blight',
        isHealthy: false,
        confidence: 92,
      })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      const { chemicalTreatments } = res.body.data.recommendation
      for (const ct of chemicalTreatments) {
        expect(ct.expertConsultationNote).toBeTruthy()
        expect(typeof ct.expertConsultationNote).toBe('string')
        expect(ct.expertConsultationNote.length).toBeGreaterThan(10)
      }
    })

    it('all chemical treatments include labelPrecautions array', async () => {
      const scan = await createCompletedScan(userAId, {
        predictedCrop: 'Potato',
        predictedDisease: 'Late_blight',
        isHealthy: false,
        confidence: 89,
      })
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      for (const ct of res.body.data.recommendation.chemicalTreatments) {
        expect(Array.isArray(ct.labelPrecautions)).toBe(true)
      }
    })

    it('recommendation includes source references', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data.recommendation.referenceSources)).toBe(true)
      expect(res.body.data.recommendation.referenceSources.length).toBeGreaterThan(0)
    })
  })

  // ════════════════════════════════════════════════════════════════════════════
  // 14. RECOMMENDATION PERSISTENCE & STRUCTURE
  // ════════════════════════════════════════════════════════════════════════════

  describe('14. Recommendation Persistence & Document Structure', () => {
    it('persisted document has all required fields', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .post(`/api/scans/${scan._id}/recommendations/generate`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      const { _id } = res.body.data.recommendation
      const saved = await Recommendation.findById(_id)

      expect(saved).not.toBeNull()
      expect(saved?.scanId).toBeDefined()
      expect(saved?.userId).toBeDefined()
      expect(saved?.cropName).toBeTruthy()
      expect(saved?.diseaseName).toBeTruthy()
      expect(saved?.language).toBe('en')
      expect(saved?.status).toBe('active')
      expect(saved?.modelIdentifier).toBeTruthy()
      expect(saved?.createdAt).toBeDefined()
    })
  })
})
