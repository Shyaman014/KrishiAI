import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SupportingFactor {
  factor: string
  value: string
  importancePct: string
  explanation: string
}

export interface CropRecommendationItem {
  rank: number
  cropName: string
  confidence: number
  confidencePct: number
  supportingFactors: SupportingFactor[]
  growingDuration: string
  waterRequirement: string
  suitableSeason: string
  soilRequirement: string
  description: string
  source: string
}

export interface CropRecommendationResult {
  id: string
  modelVersion: string
  recommendations: CropRecommendationItem[]
  inputs: {
    N: number
    P: number
    K: number
    temperature: number
    humidity: number
    ph: number
    rainfall: number
    soilType?: string
    season?: string
  }
  weatherContext?: {
    temperature?: number
    humidity?: number
    condition?: string
    source?: string
  } | null
  location?: {
    cityName?: string
    latitude?: number
    longitude?: number
  } | null
  disclaimer: string
  dataSourceNote: string
  createdAt: string
}

export interface CropRecommendationRequest {
  N: number
  P: number
  K: number
  temperature?: number
  humidity?: number
  ph: number
  rainfall: number
  soilType?: string
  season?: string
  language: 'en' | 'hi' | 'as'
  latitude?: number
  longitude?: number
  cityName?: string
}

export interface HistoryItem {
  _id: string
  inputs: CropRecommendationResult['inputs']
  recommendations: CropRecommendationItem[]
  modelVersion: string
  disclaimer: string
  createdAt: string
}

export interface HistoryResponse {
  items: HistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const cropRecommendationKeys = {
  all: ['cropRecommendations'] as const,
  history: (page: number, limit: number) =>
    ['cropRecommendations', 'history', page, limit] as const,
  detail: (id: string) => ['cropRecommendations', 'detail', id] as const,
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Submit crop recommendation request (mutation).
 */
export function useCropRecommendMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CropRecommendationRequest): Promise<CropRecommendationResult> => {
      const res = await apiClient.post('/api/crops/recommend', body)
      return res.data.data as CropRecommendationResult
    },
    onSuccess: () => {
      // Invalidate history so the new entry appears
      queryClient.invalidateQueries({ queryKey: cropRecommendationKeys.all })
    },
  })
}

/**
 * Fetch paginated recommendation history.
 */
export function useCropRecommendHistory(page = 1, limit = 10) {
  return useQuery({
    queryKey: cropRecommendationKeys.history(page, limit),
    queryFn: async (): Promise<HistoryResponse> => {
      const res = await apiClient.get('/api/crops/recommendations/history', {
        params: { page, limit },
      })
      return res.data.data as HistoryResponse
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch a single recommendation by ID.
 */
export function useCropRecommendById(id: string | null) {
  return useQuery({
    queryKey: cropRecommendationKeys.detail(id ?? ''),
    queryFn: async (): Promise<CropRecommendationResult> => {
      const res = await apiClient.get(`/api/crops/recommendations/${id}`)
      return res.data.data as CropRecommendationResult
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}

