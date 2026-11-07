import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticate } from '../middleware/auth'
import {
  handleAssistantChat,
  getConversations,
  getConversationById,
  deleteConversation,
} from '../controllers/assistantController'
import { env } from '../config/env'

const router = Router()

// Rate limit: 60 messages per hour per user (bypassed in test)
const assistantLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 0 : 60,
  skip: () => env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many assistant messages. Please wait a moment before sending another query.',
  },
  keyGenerator: (req) => req.user?.userId ?? req.ip ?? 'unknown',
})

// All routes require authentication
router.use(authenticate)

// POST /api/assistant/chat
router.post('/chat', assistantLimiter, handleAssistantChat)

// GET /api/assistant/conversations
router.get('/conversations', getConversations)

// GET /api/assistant/conversations/:id
router.get('/conversations/:id', getConversationById)

// DELETE /api/assistant/conversations/:id
router.delete('/conversations/:id', deleteConversation)

export default router

