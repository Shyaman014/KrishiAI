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

const MOCK_EXPLANATION_RESPONSE = {
  success: true,
  scan_id: 'sample-scan-id',
  crop: 'Tomato',
  disease: 'Early Blight (Alternaria solani)',
  is_healthy: false,
  confidence: 91.5,
  status: 'completed',
  explanation: {
    scientific_name: 'Alternaria solani',
    overview: 'Early blight is a common foliar fungal disease causing target-like brown spots on leaves.',
    symptoms: [
      'Concentric dark brown rings on older lower leaves',
      'Yellow halos surrounding enlarging lesions',
      'Premature defoliation starting at base of vine',
    ],
    causes: ['Soil-borne Alternaria solani fungal spores splashing from crop debris'],
    environmental_conditions: ['Warm temperatures (24-29°C) and high humidity or frequent morning dew'],
    impact_on_growth: 'Reduces photosynthetic area, triggering premature leaf drop and exposing fruit to sunscald.',
    early_warning_signs: ['Small brown specks on lowest leaves nearest to the soil surface'],
    severity_explanation: 'High severity if left unmanaged during active fruit development.',
    prevention: [
      'Practice a 3-year crop rotation with non-solanaceous crops',
      'Stake vines and apply plastic or organic mulch',
    ],
    sanitation: ['Strip and dispose of bottom leaves touching the ground'],
    treatment: {
      general_approaches: ['Maintain open canopy airflow and drip irrigate'],
      chemical_guidance: ['Protectant fungicides such as Mancozeb 75% WP according to local extension labels'],
      organic_treatments: ['Trichoderma viride bio-fungicide foliar spray @ 5g/L'],
      when_to_seek_help: 'Seek KVK advice if blight spreads past lower third of canopy within a week.',
    },
    reference_sources: ['ICAR - Indian Institute of Vegetable Research', 'TNAU Agritech Portal'],
    disclaimer: 'Notice: For informational screening only. Consult certified agronomists.',
    language: 'en',
    model_identifier: 'gemini-2.5-flash',
    generated_at: new Date().toISOString(),
  },
}

describe('KrishiAI Phase 7: Disease Explanation & Advisory API Suite', () => {
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
    ])

    const userA = await User.create({
      fullName: 'Ramesh Patel',
      email: 'ramesh.p@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'hi',
      role: 'farmer',
      isVerified: true,
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Bina Das',
      email: 'bina.d@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'as',
      role: 'farmer',
      isVerified: true,
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  const createCompletedScan = async (ownerId: string) => {
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
    })
  }

  describe('1. Route Protection & User Isolation', () => {
    it('rejects unauthenticated request to GET /analysis with 401', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app).get(`/api/scans/${scan._id}/analysis`)
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to POST /generate-explanation with 401', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app).post(`/api/scans/${scan._id}/generate-explanation`)
      expect(res.status).toBe(401)
    })

    it('returns 404 when scan belongs to another user (User B cannot access User A scan)', async () => {
      const scan = await createCompletedScan(userAId)
      const res = await request(app)
        .get(`/api/scans/${scan._id}/analysis`)
        .set('Authorization', `Bearer ${tokenUserB}`)
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid scan ID format', async () => {
      const res = await request(app)
        .get('/api/scans/invalid-id/analysis')
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(res.status).toBe(400)
    })
  })

  describe('2. Scan Status Validation Safeguards', () => {
    it('rejects explanation generation for a PENDING scan with 400', async () => {
      const pendingScan = await Scan.create({
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Tomato',
        status: 'pending',
        imageUrl: 'https://example.com/test.jpg',
      })

      const res = await request(app)
        .post(`/api/scans/${pendingScan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/not completed AI classification/i)
    })

    it('rejects explanation generation for a FAILED scan with 400', async () => {
      const failedScan = await Scan.create({
        userId: new mongoose.Types.ObjectId(userAId),
        cropName: 'Tomato',
        status: 'failed',
        imageUrl: 'https://example.com/test.jpg',
      })

      const res = await request(app)
        .post(`/api/scans/${failedScan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/cannot generate explanation for a failed scan/i)
    })
  })

  describe('3. Explanation Generation & Persistence', () => {
    it('successfully generates explanation and updates MongoDB scan record', async () => {
      const scan = await createCompletedScan(userAId)

      mockedAxios.post = jest.fn().mockResolvedValueOnce({
        data: MOCK_EXPLANATION_RESPONSE,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.explanation.scientificName).toBe('Alternaria solani')
      expect(res.body.data.explanation.status).toBe('available')
      expect(res.body.data.cached).toBe(false)

      // Verify database persistence
      const updatedScan = await Scan.findById(scan._id)
      expect(updatedScan?.explanation?.scientificName).toBe('Alternaria solani')
      expect(updatedScan?.explanation?.status).toBe('available')
      expect(updatedScan?.explanation?.treatment.chemicalGuidance.length).toBeGreaterThan(0)

      // Verify activity log creation
      const activity = await Activity.findOne({ userId: userAId, type: 'explanation_generated' })
      expect(activity).not.toBeNull()
    })

    it('returns cached explanation on duplicate request without calling AI service', async () => {
      const scan = await createCompletedScan(userAId)
      scan.explanation = {
        scientificName: 'Alternaria solani',
        overview: 'Cached explanation overview',
        symptoms: ['Symptom 1'],
        causes: ['Cause 1'],
        environmentalConditions: ['Condition 1'],
        impactOnGrowth: 'Impact 1',
        earlyWarningSigns: ['Sign 1'],
        severityExplanation: 'Moderate',
        prevention: ['Prev 1'],
        sanitation: ['San 1'],
        treatment: {
          generalApproaches: ['Approach 1'],
          chemicalGuidance: ['Chemical 1'],
          organicTreatments: ['Organic 1'],
          whenToSeekHelp: 'Seek help immediately.',
        },
        disclaimer: 'Disclaimer text',
        language: 'en',
        referenceSources: ['ICAR'],
        modelIdentifier: 'gemini-2.5-flash',
        generatedAt: new Date(),
        status: 'available',
      }
      await scan.save()

      const res = await request(app)
        .post(`/api/scans/${scan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: false })

      expect(res.status).toBe(200)
      expect(res.body.data.cached).toBe(true)
      expect(res.body.data.explanation.overview).toBe('Cached explanation overview')
      // Ensure axios was NOT called
      expect(mockedAxios.post).not.toHaveBeenCalled()
    })

    it('forces regeneration when regenerate: true is passed', async () => {
      const scan = await createCompletedScan(userAId)
      scan.explanation = {
        overview: 'Old explanation',
        symptoms: [],
        causes: [],
        environmentalConditions: [],
        impactOnGrowth: '',
        earlyWarningSigns: [],
        severityExplanation: '',
        prevention: [],
        sanitation: [],
        treatment: {
          generalApproaches: [],
          chemicalGuidance: [],
          organicTreatments: [],
          whenToSeekHelp: '',
        },
        disclaimer: '',
        language: 'en',
        referenceSources: [],
        modelIdentifier: 'old-model',
        generatedAt: new Date(),
        status: 'available',
      }
      await scan.save()

      mockedAxios.post = jest.fn().mockResolvedValueOnce({
        data: MOCK_EXPLANATION_RESPONSE,
      })

      const res = await request(app)
        .post(`/api/scans/${scan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en', regenerate: true })

      expect(res.status).toBe(200)
      expect(res.body.data.cached).toBe(false)
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
    })

    it('handles AI service failure gracefully with 502 error response', async () => {
      const scan = await createCompletedScan(userAId)

      mockedAxios.post = jest.fn().mockRejectedValueOnce(new Error('AI Service Offline'))

      const res = await request(app)
        .post(`/api/scans/${scan._id}/generate-explanation`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ language: 'en' })

      expect(res.status).toBe(502)
      expect(res.body.success).toBe(false)

      const updatedScan = await Scan.findById(scan._id)
      expect(updatedScan?.explanation?.status).toBe('failed')
    })
  })

  describe('4. GET /api/scans/:id/analysis Retrieval', () => {
    it('retrieves scan analysis with hasExplanation indicator', async () => {
      const scan = await createCompletedScan(userAId)

      const res = await request(app)
        .get(`/api/scans/${scan._id}/analysis`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.scan.id).toBe(scan._id.toString())
      expect(res.body.data.scan.hasExplanation).toBe(false)
    })
  })
})

