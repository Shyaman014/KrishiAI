import { Router } from 'express'
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updateProfile,
  changePassword,
} from '../controllers/authController'
import { authenticate } from '../middleware/auth'
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter'

const router = Router()

// Public authentication routes
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.post('/forgot-password', passwordResetLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.post('/verify-email', verifyEmail)

// Authenticated user profile routes
router.get('/me', authenticate, getMe)
router.patch('/profile', authenticate, updateProfile)
router.post('/change-password', authenticate, changePassword)

export default router

