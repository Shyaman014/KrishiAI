// =============================================
// Shared TypeScript types for the KrishiAI client
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error'
  service: string
  version: string
  timestamp: string
  checks?: {
    database?: 'connected' | 'disconnected'
    cache?: 'connected' | 'disconnected'
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
