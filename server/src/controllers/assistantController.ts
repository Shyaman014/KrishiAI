import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import axios from 'axios'
import { Conversation } from '../models/Conversation'
import { User } from '../models/User'
import { Activity } from '../models/Activity'
import { env } from '../config/env'
import logger from '../utils/logger'

// ── Validation Schemas ───────────────────────────────────────────────────────

export const chatBodySchema = z.object({
  message: z.string({ required_error: 'message is required' }).trim().min(1).max(4000),
  conversationId: z.string().trim().optional(),
  language: z.enum(['en', 'hi', 'as']).optional(),
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(15),
})

// ── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/assistant/chat
 * Multi-turn multilingual agricultural consultation endpoint.
 */
export async function handleAssistantChat(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = chatBodySchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid chat message parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const { message, conversationId, language: reqLanguage } = parsed.data

    // Fetch user profile for language & location context
    const user = await User.findById(userId).select('preferredLanguage locationPreference')
    const effectiveLanguage: 'en' | 'hi' | 'as' =
      reqLanguage ||
      (['en', 'hi', 'as'].includes(user?.preferredLanguage || '')
        ? (user!.preferredLanguage as 'en' | 'hi' | 'as')
        : 'en')

    // Find existing or initialize new conversation
    let conversation: any = null

    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        res.status(400).json({ success: false, message: 'Invalid conversation ID.' })
        return
      }

      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: new mongoose.Types.ObjectId(userId),
      })

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversation not found or access denied.',
        })
        return
      }
    } else {
      // Create new conversation
      const truncatedTitle = message.length > 50 ? `${message.slice(0, 47)}...` : message
      conversation = new Conversation({
        userId: new mongoose.Types.ObjectId(userId),
        title: truncatedTitle,
        language: effectiveLanguage,
        messages: [],
      })
    }

    // Build chat history for AI service context (last 10 messages)
    const historyPayload = conversation.messages.slice(-10).map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    }))

    // Add current user message
    historyPayload.push({
      role: 'user',
      content: message,
    })

    // Context metadata
    const contextMetadata: Record<string, string> = {}
    if (user?.locationPreference?.cityName) {
      contextMetadata.location = user.locationPreference.cityName
    }
    if (user?.locationPreference?.state) {
      contextMetadata.state = user.locationPreference.state
    }

    // Call AI service
    const aiServiceUrl = env.AI_SERVICE_URL
    const internalKey = env.AI_SERVICE_INTERNAL_KEY

    let assistantReply = ''
    let modelName = 'krishi-grounded-kb-v1'
    let isFallback = true

    try {
      const aiRes = await axios.post(
        `${aiServiceUrl}/api/v1/assistant/chat`,
        {
          messages: historyPayload,
          language: effectiveLanguage,
          context: Object.keys(contextMetadata).length > 0 ? contextMetadata : undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(internalKey ? { 'X-Internal-Key': internalKey } : {}),
          },
          timeout: 25_000,
        },
      )

      if (aiRes.data?.reply) {
        assistantReply = aiRes.data.reply
        modelName = aiRes.data.model || 'gemini-2.5-flash'
        isFallback = Boolean(aiRes.data.is_fallback)
      }
    } catch (aiErr) {
      logger.warn('AI Assistant service call failed; using local grounded template: %s', (aiErr as Error).message)
      assistantReply =
        effectiveLanguage === 'hi'
          ? 'नमस्ते किसान भाई! हमारे कृषि सलाहकार से संपर्क हो रहा है। कृपया फसल रोग, खाद अथवा मौसम से संबंधित सवाल पूछें।'
          : effectiveLanguage === 'as'
          ? 'নমস্কাৰ কৃষক বন্ধু! আমাৰ কৃষি সহায়ক সক্ৰিয় হৈ আছে। অনুগ্ৰহ কৰি আপোনাৰ শস্য, সাৰ বা বতৰৰ বিষয়ে প্ৰশ্ন সোধক।'
          : 'Namaste farmer friend! I am your KrishiAI Assistant. You can ask me about crop diseases, pest controls, fertilizer dosages, or mandi rates.'
    }

    // Append user & assistant messages to conversation
    const userMsgObj = {
      sender: 'user' as const,
      text: message,
      timestamp: new Date(),
    }
    const assistantMsgObj = {
      sender: 'assistant' as const,
      text: assistantReply,
      timestamp: new Date(),
    }

    conversation.messages.push(userMsgObj, assistantMsgObj)
    conversation.language = effectiveLanguage
    await conversation.save()

    // Activity log
    await Activity.create({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'assistant_query',
      title: 'Consulted Agricultural AI Assistant',
      description: `Inquiry: "${message.slice(0, 40)}..." (${effectiveLanguage.toUpperCase()})`,
      metadata: {
        conversationId: conversation._id.toString(),
        language: effectiveLanguage,
        model: modelName,
      },
    })

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id.toString(),
        reply: assistantReply,
        language: effectiveLanguage,
        model: modelName,
        isFallback,
        messages: conversation.messages,
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assistant/conversations
 * List user's conversations with pagination.
 */
export async function getConversations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const parsed = paginationQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination query parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
      return
    }

    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Conversation.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id title language messages updatedAt createdAt')
        .lean(),
      Conversation.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ])

    const formatted = items.map((c: any) => ({
      id: c._id.toString(),
      title: c.title,
      language: c.language,
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.[c.messages.length - 1]?.text || '',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }))

    res.status(200).json({
      success: true,
      data: {
        items: formatted,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assistant/conversations/:id
 * Retrieve a single conversation by ID (user-isolated).
 */
export async function getConversationById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID.' })
      return
    }

    const conversation = await Conversation.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select('-__v')
      .lean()

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied.',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: conversation,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/assistant/conversations/:id
 * Delete a conversation (user-isolated).
 */
export async function deleteConversation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId
    const rawId = req.params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID.' })
      return
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied.',
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    })
  } catch (err) {
    next(err)
  }
}

