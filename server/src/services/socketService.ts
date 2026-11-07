import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import logger from '../utils/logger'

let io: SocketIOServer | null = null

interface SocketUserPayload {
  userId: string
  role?: string
}

/**
 * Initializes the Socket.IO server attached to the HTTP server.
 */
export function initSocketService(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  })

  // Socket authentication middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : null)

      if (!token) {
        // Allow unauthenticated connection or reject? Reject with error
        return next(new Error('Authentication token required'))
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as SocketUserPayload
      socket.data.user = decoded
      next()
    } catch (err) {
      logger.debug('Socket authentication error: %s', (err as Error).message)
      next(new Error('Invalid socket credentials'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUserPayload | undefined
    if (user?.userId) {
      const room = `user:${user.userId}`
      void socket.join(room)
      logger.info(`Socket connected: ${socket.id} joined ${room}`)

      socket.on('disconnect', (reason) => {
        logger.debug(`Socket disconnected: ${socket.id} (${reason})`)
      })
    }
  })

  logger.info('🔌 Socket.IO service initialized')
  return io
}

/**
 * Returns the active Socket.IO server instance, if initialized.
 */
export function getIO(): SocketIOServer | null {
  return io
}

/**
 * Emits an event to all connected sockets of a specific user.
 */
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (!io) {
    logger.debug(`Socket.IO not initialized; skipping emitToUser for ${userId}`)
    return
  }
  io.to(`user:${userId}`).emit(event, data)
}

/**
 * Broadcasts an event to all connected sockets in the system.
 */
export function broadcastToAll(event: string, data: unknown): void {
  if (!io) {
    logger.debug('Socket.IO not initialized; skipping broadcastToAll')
    return
  }
  io.emit(event, data)
}

