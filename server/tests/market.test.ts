import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { MarketPriceAlert } from '../src/models/MarketPriceAlert'
import { MarketFavorite } from '../src/models/MarketFavorite'
import { Activity } from '../src/models/Activity'
import { MarketCacheService } from '../src/services/market/MarketCacheService'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

describe('KrishiAI Phase 11: Market Price Tracking & Mandi Intelligence Suite', () => {
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
      MarketPriceAlert.deleteMany({}),
      MarketFavorite.deleteMany({}),
      Activity.deleteMany({}),
    ])
    MarketCacheService.clearMemoryCache()

    // Default mock: external network calls reject to test local Agmarknet bulletin fallback
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('External data.gov.in mock error'))

    const userA = await User.create({
      fullName: 'Gurpreet Singh',
      email: 'gurpreet@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
      locationPreference: {
        cityName: 'Ludhiana, Punjab',
        state: 'Punjab',
        latitude: 30.901,
        longitude: 75.8573,
      },
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Suresh Patil',
      email: 'suresh@krishiai.farm',
      password: 'Password@123',
      role: 'farmer',
      isVerified: true,
      locationPreference: {
        cityName: 'Nashik, Maharashtra',
        state: 'Maharashtra',
        latitude: 19.9975,
        longitude: 73.7898,
      },
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  // ── 1. GET /api/markets/prices ─────────────────────────────────────────────

  describe('1. GET /api/markets/prices', () => {
    it('returns 200 with list of mandi prices and pagination metadata', async () => {
      const res = await request(app).get('/api/markets/prices')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.items.length).toBeGreaterThan(0)
      expect(res.body.data.total).toBeGreaterThan(0)
      expect(res.body.data.source).toMatch(/Agmarknet/i)

      const first = res.body.data.items[0]
      expect(first).toHaveProperty('commodity')
      expect(first).toHaveProperty('modalPrice')
      expect(first).toHaveProperty('minPrice')
      expect(first).toHaveProperty('maxPrice')
      expect(first).toHaveProperty('market')
      expect(first).toHaveProperty('state')
    })

    it('filters prices by commodity (case-insensitive substring)', async () => {
      const res = await request(app).get('/api/markets/prices?commodity=Wheat')
      expect(res.status).toBe(200)
      for (const item of res.body.data.items) {
        expect(item.commodity.toLowerCase()).toContain('wheat')
      }
    })

    it('filters prices by state', async () => {
      const res = await request(app).get('/api/markets/prices?state=Punjab')
      expect(res.status).toBe(200)
      for (const item of res.body.data.items) {
        expect(item.state.toLowerCase()).toBe('punjab')
      }
    })

    it('filters prices by search keyword matching market or commodity', async () => {
      const res = await request(app).get('/api/markets/prices?search=Khanna')
      expect(res.status).toBe(200)
      expect(res.body.data.items.length).toBeGreaterThan(0)
      expect(res.body.data.items[0].market).toMatch(/Khanna/i)
    })

    it('sorts prices ascending with sort=price_asc', async () => {
      const res = await request(app).get('/api/markets/prices?sort=price_asc')
      expect(res.status).toBe(200)
      const prices = res.body.data.items.map((i: any) => i.modalPrice)
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i + 1])
      }
    })

    it('sorts prices descending with sort=price_desc', async () => {
      const res = await request(app).get('/api/markets/prices?sort=price_desc')
      expect(res.status).toBe(200)
      const prices = res.body.data.items.map((i: any) => i.modalPrice)
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1])
      }
    })

    it('handles pagination limit and page correctly', async () => {
      const res = await request(app).get('/api/markets/prices?page=1&limit=3')
      expect(res.status).toBe(200)
      expect(res.body.data.items.length).toBe(3)
      expect(res.body.data.page).toBe(1)
      expect(res.body.data.limit).toBe(3)
    })
  })

  // ── 2. GET /api/markets/commodities ───────────────────────────────────────

  describe('2. GET /api/markets/commodities', () => {
    it('returns unique commodities with average modal prices and market counts', async () => {
      const res = await request(app).get('/api/markets/commodities')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)

      const wheat = res.body.data.find((c: any) => c.commodity === 'Wheat')
      expect(wheat).toBeDefined()
      expect(wheat.msp).toBe(2275) // CACP Wheat MSP
      expect(wheat.avgModalPrice).toBeGreaterThan(2000)
      expect(wheat.marketCount).toBeGreaterThan(0)
    })
  })

  // ── 3. GET /api/markets/nearby ─────────────────────────────────────────────

  describe('3. GET /api/markets/nearby', () => {
    it('returns nearby mandis sorted by distance from given coordinates', async () => {
      // Ludhiana coordinates
      const res = await request(app).get('/api/markets/nearby?lat=30.901&lon=75.8573')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.mandis.length).toBeGreaterThan(0)

      // Khanna is ~35km from Ludhiana
      const khanna = res.body.data.mandis.find((m: any) => m.market === 'Khanna')
      expect(khanna).toBeDefined()
      expect(khanna.distanceKm).toBeLessThan(100)

      // Verify sorted by distance
      const distances = res.body.data.mandis.map((m: any) => m.distanceKm)
      for (let i = 0; i < distances.length - 1; i++) {
        expect(distances[i]).toBeLessThanOrEqual(distances[i + 1])
      }
    })

    it('falls back to user location preference if coordinates not supplied', async () => {
      const res = await request(app)
        .get('/api/markets/nearby')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.origin.latitude).toBeCloseTo(30.901, 2)
      expect(res.body.data.mandis.length).toBeGreaterThan(0)
    })
  })

  // ── 4. GET /api/markets/history ───────────────────────────────────────────

  describe('4. GET /api/markets/history', () => {
    it('returns 400 when commodity is missing', async () => {
      const res = await request(app).get('/api/markets/history')
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('returns historical price series for specified days', async () => {
      const res = await request(app).get('/api/markets/history?commodity=Wheat&days=7')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.commodity).toBe('Wheat')
      expect(res.body.data.days).toBe(7)
      expect(res.body.data.dataPoints).toHaveLength(7)
      expect(res.body.data.highestModalPrice).toBeGreaterThan(0)
      expect(res.body.data.lowestModalPrice).toBeGreaterThan(0)
      expect(res.body.data.disclaimer).toMatch(/Agmarknet/i)

      const firstPoint = res.body.data.dataPoints[0]
      expect(firstPoint).toHaveProperty('date')
      expect(firstPoint).toHaveProperty('modalPrice')
      expect(firstPoint).toHaveProperty('minPrice')
      expect(firstPoint).toHaveProperty('maxPrice')
    })
  })

  // ── 5. POST & GET /api/markets/alerts ─────────────────────────────────────

  describe('5. Market Price Alerts', () => {
    it('rejects unauthenticated request to POST /api/markets/alerts with 401', async () => {
      const res = await request(app)
        .post('/api/markets/alerts')
        .send({ commodity: 'Wheat', targetPrice: 2600, condition: 'above' })
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to GET /api/markets/alerts with 401', async () => {
      const res = await request(app).get('/api/markets/alerts')
      expect(res.status).toBe(401)
    })

    it('rejects invalid alert configuration (invalid condition or non-positive price)', async () => {
      const res = await request(app)
        .post('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Wheat', targetPrice: -50, condition: 'exact' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('creates a new price alert and triggers immediately if target met', async () => {
      // In sample data, Wheat modal price in Indore is ₹2690. Target of ₹2600 'above' should trigger
      const res = await request(app)
        .post('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          commodity: 'Wheat',
          targetPrice: 2600,
          condition: 'above',
          state: 'Madhya Pradesh',
        })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.commodity).toBe('Wheat')
      expect(res.body.data.triggered).toBe(true)
      expect(res.body.data.lastTriggeredPrice).toBeGreaterThanOrEqual(2600)

      // Verify activity was created
      const activity = await Activity.findOne({
        userId: userAId,
        type: 'price_alert_created',
      })
      expect(activity).not.toBeNull()
    })

    it('isolates alerts between users (User B cannot see User A alerts)', async () => {
      // Create alert for User A
      await request(app)
        .post('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Mustard', targetPrice: 6000, condition: 'above' })

      // User A sees 1 alert
      const resA = await request(app)
        .get('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(resA.body.data).toHaveLength(1)

      // User B sees 0 alerts
      const resB = await request(app)
        .get('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserB}`)
      expect(resB.body.data).toHaveLength(0)
    })

    it('deletes an alert (User A deletes their own alert)', async () => {
      const createRes = await request(app)
        .post('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Cotton', targetPrice: 7500, condition: 'above' })

      const alertId = createRes.body.data._id

      const deleteRes = await request(app)
        .delete(`/api/markets/alerts/${alertId}`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(deleteRes.status).toBe(200)
      expect(deleteRes.body.success).toBe(true)

      const check = await MarketPriceAlert.findById(alertId)
      expect(check).toBeNull()
    })

    it('prevents User B from deleting User A alert (404 isolation)', async () => {
      const createRes = await request(app)
        .post('/api/markets/alerts')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Soybean', targetPrice: 5000, condition: 'above' })

      const alertId = createRes.body.data._id

      const deleteRes = await request(app)
        .delete(`/api/markets/alerts/${alertId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(deleteRes.status).toBe(404)
      const check = await MarketPriceAlert.findById(alertId)
      expect(check).not.toBeNull()
    })
  })

  // ── 6. Favorites Toggle & Retrieval ───────────────────────────────────────

  describe('6. Market Favorites', () => {
    it('rejects unauthenticated request to favorites with 401', async () => {
      const res = await request(app).get('/api/markets/favorites')
      expect(res.status).toBe(401)
    })

    it('toggles favorite commodity on and off', async () => {
      // 1. Add favorite
      const addRes = await request(app)
        .post('/api/markets/favorites')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Wheat' })

      expect(addRes.status).toBe(201)
      expect(addRes.body.isFavorite).toBe(true)

      // 2. Query favorites
      const listRes = await request(app)
        .get('/api/markets/favorites')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(listRes.status).toBe(200)
      expect(listRes.body.data).toHaveLength(1)
      expect(listRes.body.data[0].commodity).toBe('Wheat')
      expect(listRes.body.data[0].currentPrice).toBeDefined()

      // 3. Toggle off
      const removeRes = await request(app)
        .post('/api/markets/favorites')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ commodity: 'Wheat' })

      expect(removeRes.status).toBe(200)
      expect(removeRes.body.isFavorite).toBe(false)

      // 4. Verify empty
      const listRes2 = await request(app)
        .get('/api/markets/favorites')
        .set('Authorization', `Bearer ${tokenUserA}`)
      expect(listRes2.body.data).toHaveLength(0)
    })
  })
})

