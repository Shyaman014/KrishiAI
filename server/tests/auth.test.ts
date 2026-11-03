import request from 'supertest'
import mongoose from 'mongoose'
import { createApp } from '../src/app'
import { User } from '../src/models/User'
import { env } from '../src/config/env'
import { REFRESH_TOKEN_COOKIE_NAME } from '../src/utils/token'

const app = createApp()

describe('KrishiAI Authentication & User Management Suite', () => {
  beforeAll(async () => {
    // Connect to separate isolated test database
    await mongoose.connect(env.MONGODB_TEST_URI)
    await User.deleteMany({})
  })

  afterAll(async () => {
    // Drop test database and close connection cleanly
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase()
    }
    await mongoose.disconnect()
  })

  const testUser = {
    fullName: 'Harpreet Singh',
    email: 'harpreet.test@krishiai.farm',
    phoneNumber: '+91 98765 11223',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    preferredLanguage: 'pa' as const,
  }

  let accessToken: string
  let refreshCookie: string

  describe('1. User Registration', () => {
    it('should register a new farmer account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.user.fullName).toBe(testUser.fullName)
      expect(res.body.data.user.role).toBe('farmer')
      expect(res.body.data.user.password).toBeUndefined() // Password hash MUST NEVER be exposed
      expect(res.body.data.accessToken).toBeDefined()

      // Should set HttpOnly refresh token cookie
      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const hasCookie = cookies.some((c: string) => c.includes(REFRESH_TOKEN_COOKIE_NAME))
      expect(hasCookie).toBe(true)
    })

    it('should reject registration with duplicate email (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)

      expect(res.status).toBe(409)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/already exists/i)
    })

    it('should reject registration with weak password (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Weak User',
          email: 'weak@krishiai.farm',
          password: 'weak',
          confirmPassword: 'weak',
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should reject registration when confirmPassword does not match (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'mismatch@krishiai.farm',
          confirmPassword: 'DifferentPassword@123',
        })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('2. User Login', () => {
    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.accessToken).toBeDefined()

      accessToken = res.body.data.accessToken

      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      refreshCookie = cookies.find((c: string) => c.includes(REFRESH_TOKEN_COOKIE_NAME)) || ''
      expect(refreshCookie).toBeTruthy()
    })

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword@999',
        })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/invalid email or password/i)
    })

    it('should reject login with non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@krishiai.farm',
          password: 'Password@123',
        })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('3. Protected Routes & Authentication Middleware', () => {
    it('should access /api/auth/me with valid Bearer token (200 OK)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe(testUser.email)
      expect(res.body.data.user.fullName).toBe(testUser.fullName)
    })

    it('should block /api/auth/me when token is omitted (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/auth/me')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('should block /api/auth/me when token is forged or invalid (401 Unauthorized)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('4. Token Refresh & Rotation Flow', () => {
    it('should issue a new access token and rotate the refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshCookie])

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.accessToken).toBeDefined()
      expect(res.body.data.user.email).toBe(testUser.email)

      // Should issue a new rotated cookie
      const newCookies = res.headers['set-cookie'] as unknown as string[]
      expect(newCookies).toBeDefined()
      const newCookie = newCookies.find((c: string) => c.includes(REFRESH_TOKEN_COOKIE_NAME))
      expect(newCookie).toBeTruthy()

      // Update test tokens
      accessToken = res.body.data.accessToken
      if (newCookie) refreshCookie = newCookie
    })

    it('should reject refresh without cookie (401 Unauthorized)', async () => {
      const res = await request(app).post('/api/auth/refresh')

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  describe('5. User Profile Update & Password Change', () => {
    it('should update user profile details', async () => {
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          fullName: 'Sardar Harpreet Singh',
          phoneNumber: '+91 99887 76655',
          preferredLanguage: 'hi',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.user.fullName).toBe('Sardar Harpreet Singh')
      expect(res.body.data.user.preferredLanguage).toBe('hi')
    })

    it('should change user password and revoke existing sessions', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'BrandNewPassword@456',
          confirmNewPassword: 'BrandNewPassword@456',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Old password should now fail
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
      expect(oldLogin.status).toBe(401)

      // New password should succeed
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'BrandNewPassword@456',
        })
      expect(newLogin.status).toBe(200)
      accessToken = newLogin.body.data.accessToken
    })
  })

  describe('6. Password Recovery Workflow', () => {
    let devResetToken: string

    it('should handle forgot password request without revealing account existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.devResetToken).toBeDefined()
      devResetToken = res.body.devResetToken
    })

    it('should reset password using valid single-use token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: devResetToken,
          password: 'RecoveredPassword@789',
          confirmPassword: 'RecoveredPassword@789',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Token should now be single-use and invalid if reused
      const reuseAttempt = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: devResetToken,
          password: 'AnotherPassword@999',
          confirmPassword: 'AnotherPassword@999',
        })
      expect(reuseAttempt.status).toBe(400)
    })
  })

  describe('7. Logout Flow', () => {
    it('should log out user and clear refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [refreshCookie])

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      // Cookie should be cleared with expires/maxAge=0
      const cookies = res.headers['set-cookie'] as unknown as string[]
      expect(cookies).toBeDefined()
      const cleared = cookies.some(
        (c: string) => c.includes(REFRESH_TOKEN_COOKIE_NAME) && (c.includes('Expires=') || c.includes('Max-Age=0')),
      )
      expect(cleared).toBe(true)
    })
  })
})

