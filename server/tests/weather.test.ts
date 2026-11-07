import request from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { WeatherAlertHistory } from '../src/models/WeatherAlertHistory'
import { WeatherCacheService } from '../src/services/weather/WeatherCacheService'
import { env } from '../src/config/env'
import { generateAccessToken } from '../src/utils/token'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const app = createApp()

describe('KrishiAI Phase 9: Weather Integration & Smart Weather Advisory Suite', () => {
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
      WeatherAlertHistory.deleteMany({}),
    ])
    WeatherCacheService.clearMemoryCache()

    // Mock axios get/post to avoid external calls in tests
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('External OpenWeather mock'))
    mockedAxios.post = jest.fn().mockRejectedValue(new Error('AI service offline'))

    const userA = await User.create({
      fullName: 'Balwinder Singh',
      email: 'balwinder@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'hi',
      role: 'farmer',
      isVerified: true,
      locationPreference: {
        cityName: 'Ludhiana, Punjab',
        state: 'Punjab',
        country: 'IN',
        latitude: 30.901,
        longitude: 75.8573,
        source: 'manual',
      },
    })
    userAId = userA._id.toString()
    tokenUserA = generateAccessToken({ userId: userAId, email: userA.email, role: userA.role })

    const userB = await User.create({
      fullName: 'Rupjyoti Gogoi',
      email: 'rupjyoti@krishiai.farm',
      password: 'Password@123',
      preferredLanguage: 'as',
      role: 'farmer',
      isVerified: true,
      locationPreference: {
        cityName: 'Jorhat, Assam',
        state: 'Assam',
        country: 'IN',
        latitude: 26.7509,
        longitude: 94.2037,
        source: 'gps',
      },
    })
    userBId = userB._id.toString()
    tokenUserB = generateAccessToken({ userId: userBId, email: userB.email, role: userB.role })
  })

  // ── 1. Route Protection & Authorization ────────────────────────────────────
  describe('1. Route Protection & Authorization', () => {
    it('rejects unauthenticated request to GET /current with 401', async () => {
      const res = await request(app).get('/api/weather/current')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to GET /forecast with 401', async () => {
      const res = await request(app).get('/api/weather/forecast')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to GET /advisory with 401', async () => {
      const res = await request(app).get('/api/weather/advisory')
      expect(res.status).toBe(401)
    })

    it('rejects unauthenticated request to POST /location with 401', async () => {
      const res = await request(app).post('/api/weather/location').send({ latitude: 20, longitude: 80 })
      expect(res.status).toBe(401)
    })
  })

  // ── 2. Parameter Validation ────────────────────────────────────────────────
  describe('2. Query Parameter Validation', () => {
    it('returns 400 for out-of-range latitude (>90)', async () => {
      const res = await request(app)
        .get('/api/weather/current?lat=95&lon=75')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.errors.lat).toBeDefined()
    })

    it('returns 400 for out-of-range longitude (>180)', async () => {
      const res = await request(app)
        .get('/api/weather/current?lat=25&lon=195')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.errors.lon).toBeDefined()
    })

    it('returns 400 for invalid language code', async () => {
      const res = await request(app)
        .get('/api/weather/current?lang=fr')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  // ── 3. Current Weather Retrieval ───────────────────────────────────────────
  describe('3. GET /api/weather/current', () => {
    it('retrieves current weather using user saved location preference by default', async () => {
      const res = await request(app)
        .get('/api/weather/current')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.location.name).toMatch(/Ludhiana/i)
      expect(res.body.data.current.temp).toBeDefined()
      expect(res.body.data.current.humidity).toBeGreaterThan(0)
      expect(res.body.data.current.windSpeed).toBeDefined()
      expect(res.body.data.current.condition).toBeDefined()
    })

    it('accepts custom coordinates and returns accurate location payload', async () => {
      const res = await request(app)
        .get('/api/weather/current?lat=26.1445&lon=91.7362&city=Guwahati')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.location.lat).toBe(26.14)
      expect(res.body.data.location.lon).toBe(91.74)
      expect(res.body.data.location.name).toMatch(/Guwahati/i)
    })

    it('returns cached data on subsequent call with identical coordinates', async () => {
      const first = await request(app)
        .get('/api/weather/current?lat=28.70&lon=77.10')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(first.status).toBe(200)

      const second = await request(app)
        .get('/api/weather/current?lat=28.70&lon=77.10')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(second.status).toBe(200)
      expect(second.body.data.cached).toBe(true)
    })
  })

  // ── 4. Forecast Retrieval ──────────────────────────────────────────────────
  describe('4. GET /api/weather/forecast', () => {
    it('retrieves 5-day forecast with hourly and daily aggregates', async () => {
      const res = await request(app)
        .get('/api/weather/forecast?lat=30.90&lon=75.86')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data.hourly)).toBe(true)
      expect(res.body.data.hourly.length).toBeGreaterThan(0)
      expect(Array.isArray(res.body.data.daily)).toBe(true)
      expect(res.body.data.daily.length).toBeGreaterThanOrEqual(5)

      // Validate daily forecast structure
      const firstDay = res.body.data.daily[0]
      expect(firstDay.dayName).toBe('Today')
      expect(firstDay.tempMin).toBeDefined()
      expect(firstDay.tempMax).toBeGreaterThanOrEqual(firstDay.tempMin)
      expect(typeof firstDay.sprayOk).toBe('boolean')
    })
  })

  // ── 5. Agricultural Weather Advisory ──────────────────────────────────────
  describe('5. GET /api/weather/advisory', () => {
    it('generates grounded agricultural weather advisory and saves alert history', async () => {
      const res = await request(app)
        .get('/api/weather/advisory?lat=30.90&lon=75.86')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.current).toBeDefined()
      expect(res.body.data.forecast).toBeDefined()
      expect(res.body.data.advisory).toBeDefined()

      const advisory = res.body.data.advisory
      expect(Array.isArray(advisory.alerts)).toBe(true)
      expect(advisory.sprayWindow).toBeDefined()
      expect(['optimal', 'acceptable', 'unfavorable', 'hazardous']).toContain(advisory.sprayWindow.status)
      expect(advisory.irrigation).toBeDefined()
      expect(['delay', 'normal', 'increase', 'halt']).toContain(advisory.irrigation.action)
      expect(advisory.fieldActivities).toBeDefined()
      expect(advisory.explanationSummary).toBeDefined()

      // If alerts were produced, verify database persistence
      if (advisory.alerts.length > 0) {
        const savedAlerts = await WeatherAlertHistory.find({ userId: userAId })
        expect(savedAlerts.length).toBeGreaterThan(0)
      }
    })

    it('supports multilingual summary in Hindi', async () => {
      const res = await request(app)
        .get('/api/weather/advisory?lat=30.90&lon=75.86&lang=hi')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.advisory.language).toBe('hi')
      expect(res.body.data.advisory.explanationSummary).toBeDefined()
    })

    it('supports multilingual summary in Assamese', async () => {
      const res = await request(app)
        .get('/api/weather/advisory?lat=26.75&lon=94.20&lang=as')
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(200)
      expect(res.body.data.advisory.language).toBe('as')
      expect(res.body.data.advisory.explanationSummary).toBeDefined()
    })
  })

  // ── 6. Location Preference Management ─────────────────────────────────────
  describe('6. Location Preference Management', () => {
    it('updates user farm location preference via POST /api/weather/location', async () => {
      const res = await request(app)
        .post('/api/weather/location')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          cityName: 'Bathinda, Punjab',
          state: 'Punjab',
          country: 'IN',
          latitude: 30.211,
          longitude: 74.9455,
          source: 'manual',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.locationPreference.cityName).toBe('Bathinda, Punjab')
      expect(res.body.data.locationPreference.latitude).toBe(30.211)

      // Verify MongoDB update
      const updatedUser = await User.findById(userAId)
      expect(updatedUser?.locationPreference?.cityName).toBe('Bathinda, Punjab')
    })

    it('rejects location update with missing coordinates (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/weather/location')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          cityName: 'Invalid Location',
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  // ── 7. Weather Alert History & Dismissal ───────────────────────────────────
  describe('7. Weather Alert History & Dismissal', () => {
    it('returns empty alert history when no alerts have fired', async () => {
      const res = await request(app)
        .get('/api/weather/alerts/history')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.alerts).toEqual([])
    })

    it('fetches active alert and allows farmer to dismiss it', async () => {
      const alert = await WeatherAlertHistory.create({
        userId: new mongoose.Types.ObjectId(userAId),
        alertType: 'heavy_rain',
        severity: 'warning',
        title: 'Impending Torrential Rain',
        message: 'Precipitation exceeding 25mm expected.',
        location: { cityName: 'Ludhiana, Punjab', latitude: 30.90, longitude: 75.86 },
        dismissed: false,
        validUntil: new Date(Date.now() + 24 * 3600 * 1000),
      })

      // Fetch
      const getRes = await request(app)
        .get('/api/weather/alerts/history')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(getRes.status).toBe(200)
      expect(getRes.body.data.alerts.length).toBe(1)
      expect(getRes.body.data.alerts[0].title).toBe('Impending Torrential Rain')

      // Dismiss
      const dismissRes = await request(app)
        .patch(`/api/weather/alerts/${alert._id}/dismiss`)
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(dismissRes.status).toBe(200)
      expect(dismissRes.body.success).toBe(true)

      // Verify dismissed
      const updatedAlert = await WeatherAlertHistory.findById(alert._id)
      expect(updatedAlert?.dismissed).toBe(true)
    })

    it('prevents User B from dismissing User A alert (404 Isolation)', async () => {
      const alertA = await WeatherAlertHistory.create({
        userId: new mongoose.Types.ObjectId(userAId),
        alertType: 'frost',
        severity: 'critical',
        title: 'Cold Wave Warning',
        message: 'Frost hazard.',
        dismissed: false,
        validUntil: new Date(Date.now() + 24 * 3600 * 1000),
      })

      const res = await request(app)
        .patch(`/api/weather/alerts/${alertA._id}/dismiss`)
        .set('Authorization', `Bearer ${tokenUserB}`)

      expect(res.status).toBe(404)
    })
  })

  // ── 8. City Search Endpoint ───────────────────────────────────────────────
  describe('8. GET /api/weather/cities', () => {
    it('returns matched Indian agricultural cities for search query', async () => {
      const res = await request(app)
        .get('/api/weather/cities?q=Ludhiana')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.cities.length).toBeGreaterThan(0)
      expect(res.body.data.cities[0].name).toMatch(/Ludhiana/i)
      expect(res.body.data.cities[0].lat).toBeDefined()
    })

    it('returns empty array for search query with length < 2', async () => {
      const res = await request(app)
        .get('/api/weather/cities?q=a')
        .set('Authorization', `Bearer ${tokenUserA}`)

      expect(res.status).toBe(200)
      expect(res.body.data.cities).toEqual([])
    })
  })
})
