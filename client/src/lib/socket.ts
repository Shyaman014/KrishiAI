import { io, Socket } from 'socket.io-client'
import { getAccessToken } from './api'

const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket: Socket | null = null

/**
 * Connects or returns existing Socket.IO connection authenticated with JWT token.
 */
export function getSocket(): Socket | null {
  const token = getAccessToken()
  if (!token) {
    if (socket) {
      socket.disconnect()
      socket = null
    }
    return null
  }

  if (!socket) {
    socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: true,
      withCredentials: true,
    })

    socket.on('connect', () => {
      // connected
    })

    socket.on('connect_error', () => {
      // connection error handled gracefully
    })
  } else if (!socket.connected) {
    socket.auth = { token }
    socket.connect()
  }

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

