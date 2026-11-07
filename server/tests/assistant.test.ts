import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { Conversation } from '../src/models/Conversation'
import { Activity } from '../src/models/Activity'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

describe('KrishiAI Phase 12: Multilingual AI Agricultural Assistant Suite', () => {
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
      Conversation.deleteMany({}),
      Activity.deleteMany({}),
    ])

    // Mock AI service chat endpoint by default
    mockedAxios.post = jest.fn().mockResolvedValue({
      data: {
        success: true,
        reply: 'Apply Propiconazole 25% EC @ 1 ml/L for wheat stripe rust during calm wind hours.',
        language: 'en',
        model: 'gemini-2.5-flash',
        is_fallback: false,
      },
    })

    const userA = await User.create({
      fullName: 'Jagjit Singh',
      email: 'jagjit@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      preferredLanguage: 'hi',
      isVerified: true,
      locationPreference: {
        cityName: 'Ludhiana, Punjab',
        state: 'Punjab',
      },
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Pranab Das',
      email: 'pranab@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      preferredLanguage: 'as',
      isVerified: true,
      locationPreference: {
        cityName: 'Guwahati, Assam',
        state: 'Assam',
      },
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  // ── 1. Route Protection ───────────────────────────────────────────────────

  describe('1. Route Protection', () => {
    it('rejects POST /api/assistant/chat with 401 without auth token', async () => {
      const res = await request(app).post('/api/assistant/chat').send({ message: 'Hello' })
      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('rejects GET /api/assistant/conversations with 401 without auth token', async () => {
      const res = await request(app).get('/api/assistant/conversations')
      expect(res.status).toBe(401)
    })

    it('rejects GET /api/assistant/conversations/:id with 401 without auth token', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app).get(`/api/assistant/conversations/${fakeId}`)
      expect(res.status).toBe(401)
    })

    it('rejects DELETE /api/assistant/conversations/:id with 401 without auth token', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app).delete(`/api/assistant/conversations/${fakeId}`)
      expect(res.status).toBe(401)
    })
  })

  // ── 2. POST /api/assistant/chat (Multi-turn & Multilingual) ────────────────

  describe('2. POST /api/assistant/chat', () => {
    it('creates a new conversation and returns assistant reply', async () => {
      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'My wheat field is showing yellow stripes on leaves. What spray is recommended?',
          language: 'en',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.conversationId).toBeDefined()
      expect(res.body.data.reply).toContain('Propiconazole')
      expect(res.body.data.messages).toHaveLength(2) // User + Assistant

      // Check database persistence
      const saved = await Conversation.findById(res.body.data.conversationId)
      expect(saved).not.toBeNull()
      expect(saved?.messages).toHaveLength(2)
      expect(saved?.userId.toString()).toBe(userAId)

      // Check activity log
      const act = await Activity.findOne({ userId: userAId, type: 'assistant_query' })
      expect(act).not.toBeNull()
    })

    it('appends messages to existing conversation when conversationId is provided', async () => {
      // 1. Initial message
      const firstRes = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'What is the soil requirement for mustard?', language: 'en' })

      const convId = firstRes.body.data.conversationId

      // 2. Follow-up message
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          success: true,
          reply: 'Loamy to sandy loam soil with pH 6.0 to 7.5 is ideal for mustard cultivation.',
          language: 'en',
          model: 'gemini-2.5-flash',
          is_fallback: false,
        },
      })

      const secondRes = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          conversationId: convId,
          message: 'And what is the optimal soil pH?',
          language: 'en',
        })

      expect(secondRes.status).toBe(200)
      expect(secondRes.body.data.conversationId).toBe(convId)
      expect(secondRes.body.data.messages).toHaveLength(4) // 2 turns = 4 messages

      const saved = await Conversation.findById(convId)
      expect(saved?.messages).toHaveLength(4)
    })

    it('supports Hindi language consultation', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          success: true,
          reply: 'गेहूं में पीला रतुआ के लिए प्रोपिकोनाजोल 25% ईसी का छिड़काव करें।',
          language: 'hi',
          model: 'gemini-2.5-flash',
          is_fallback: false,
        },
      })

      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          message: 'गेहूं में पीला रतुआ का इलाज क्या है?',
          language: 'hi',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.language).toBe('hi')
      expect(res.body.data.reply).toContain('प्रोपिकोनाजोल')
    })

    it('supports Assamese language consultation', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          success: true,
          reply: 'সৰিয়হত পোক নিয়ন্ত্ৰণৰ বাবে নিম তেল বা অনুমোদিত কীটনাশক ব্যৱহাৰ কৰক।',
          language: 'as',
          model: 'gemini-2.5-flash',
          is_fallback: false,
        },
      })

      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          message: 'সৰিয়হত পোক কেনেকৈ নিয়ন্ত্ৰণ কৰিব?',
          language: 'as',
        })

      expect(res.status).toBe(200)
      expect(res.body.data.language).toBe('as')
    })

    it('handles AI service failure gracefully with grounded fallback template', async () => {
      mockedAxios.post = jest.fn().mockRejectedValue(new Error('AI Service Network Timeout'))

      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'How to manage soil nutrients?', language: 'en' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.reply).toBeTruthy()
    })

    it('rejects empty or whitespace-only messages with 400', async () => {
      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  // ── 3. User Isolation & Permissions ───────────────────────────────────────

  describe('3. User Isolation & Permission Checks', () => {
    let convAId: string

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ message: 'User A confidential consultation', language: 'en' })
      convAId = res.body.data.conversationId
    })

    it('allows User A to fetch their conversation by ID', async () => {
      const res = await request(app)
        .get(`/api/assistant/conversations/${convAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(convAId)
    })

    it('prevents User B from fetching User A conversation (404 isolation)', async () => {
      const res = await request(app)
        .get(`/api/assistant/conversations/${convAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)
    })

    it('prevents User B from appending messages to User A conversation (404 isolation)', async () => {
      const res = await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          conversationId: convAId,
          message: 'Intruding message',
          language: 'en',
        })

      expect(res.status).toBe(404)
    })

    it('prevents User B from deleting User A conversation (404 isolation)', async () => {
      const res = await request(app)
        .delete(`/api/assistant/conversations/${convAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)

      // Verify conversation still exists
      const check = await Conversation.findById(convAId)
      expect(check).not.toBeNull()
    })

    it('allows User A to delete their own conversation', async () => {
      const res = await request(app)
        .delete(`/api/assistant/conversations/${convAId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      const check = await Conversation.findById(convAId)
      expect(check).toBeNull()
    })

    it('lists only the conversations belonging to the authenticated user', async () => {
      // Create conversation for User B
      await request(app)
        .post('/api/assistant/chat')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ message: 'User B conversation', language: 'as' })

      const resA = await request(app)
        .get('/api/assistant/conversations')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(resA.status).toBe(200)
      expect(resA.body.data.items).toHaveLength(1)
      expect(resA.body.data.items[0].id).toBe(convAId)

      const resB = await request(app)
        .get('/api/assistant/conversations')
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(resB.status).toBe(200)
      expect(resB.body.data.items).toHaveLength(1)
      expect(resB.body.data.items[0].id).not.toBe(convAId)
    })
  })
})

