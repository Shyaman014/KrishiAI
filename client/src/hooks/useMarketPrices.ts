import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

export interface IMandiPriceRecord {
  id: string
  commodity: string
  variety: string
  grade: string
  market: string
  district: string
  state: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  msp?: number
  date: string
  arrivalQuantityTonnes?: number
  trend: 'up' | 'down' | 'flat'
  changePercent: number
  source: string
  latitude?: number
  longitude?: number
  updatedAt: string
}

export interface INearbyMandi {
  market: string
  district: string
  state: string
  latitude: number
  longitude: number
  distanceKm: number
  activeCommoditiesCount: number
  sampleCommodities: string[]
  topModalPrice?: {
    commodity: string
    modalPrice: number
  }
}

export interface IHistoricalPricePoint {
  date: string
  modalPrice: number
  minPrice: number
  maxPrice: number
  marketCount: number
}

export interface IHistoricalPricesResponse {
  commodity: string
  marketOrState?: string
  days: number
  dataPoints: IHistoricalPricePoint[]
  highestModalPrice: number
  lowestModalPrice: number
  averageModalPrice: number
  disclaimer: string
}

export interface ICommoditySummary {
  commodity: string
  avgModalPrice: number
  minModalPrice: number
  maxModalPrice: number
  msp?: number
  marketCount: number
  states: string[]
  topMarket: {
    market: string
    state: string
    modalPrice: number
  }
}

export interface IMarketPricesResponse {
  items: IMandiPriceRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
  source: string
  lastUpdated: string
  filterMetadata: {
    availableStates: string[]
    availableCommodities: string[]
  }
}

export interface IPriceAlert {
  _id: string
  commodity: string
  targetPrice: number
  condition: 'above' | 'below'
  mandiName?: string
  state?: string
  isActive: boolean
  triggered: boolean
  triggeredAt?: string
  lastTriggeredPrice?: number
  createdAt: string
}

export interface IFavoriteItem {
  id: string
  commodity: string
  state?: string
  currentPrice: IMandiPriceRecord | null
  createdAt: string
}

export interface PriceFilterParams {
  commodity?: string
  state?: string
  district?: string
  market?: string
  search?: string
  sort?: 'price_asc' | 'price_desc' | 'date_desc' | 'name_asc'
  page?: number
  limit?: number
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const marketKeys = {
  all: ['markets'] as const,
  prices: (filters: PriceFilterParams) => ['markets', 'prices', filters] as const,
  commodities: () => ['markets', 'commodities'] as const,
  nearby: (lat?: number, lon?: number, radiusKm?: number) =>
    ['markets', 'nearby', lat, lon, radiusKm] as const,
  history: (commodity: string, marketOrState?: string, days?: number) =>
    ['markets', 'history', commodity, marketOrState, days] as const,
  alerts: () => ['markets', 'alerts'] as const,
  favorites: () => ['markets', 'favorites'] as const,
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetch filtered, sorted, paginated Mandi prices.
 */
export function useMarketPrices(filters: PriceFilterParams = {}) {
  return useQuery({
    queryKey: marketKeys.prices(filters),
    queryFn: async (): Promise<IMarketPricesResponse> => {
      const res = await apiClient.get('/api/markets/prices', { params: filters })
      return res.data.data as IMarketPricesResponse
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch commodity summaries with MSP & market coverage.
 */
export function useCommodities() {
  return useQuery({
    queryKey: marketKeys.commodities(),
    queryFn: async (): Promise<ICommoditySummary[]> => {
      const res = await apiClient.get('/api/markets/commodities')
      return res.data.data as ICommoditySummary[]
    },
    staleTime: 5 * 60_000,
  })
}

/**
 * Fetch nearby APMC Mandis based on GPS coordinates or user profile.
 */
export function useNearbyMandis(lat?: number, lon?: number, radiusKm = 250) {
  return useQuery({
    queryKey: marketKeys.nearby(lat, lon, radiusKm),
    queryFn: async (): Promise<{
      origin: { latitude: number; longitude: number }
      radiusKm: number
      mandis: INearbyMandi[]
    }> => {
      const params: Record<string, number | undefined> = { radiusKm }
      if (lat !== undefined) params.lat = lat
      if (lon !== undefined) params.lon = lon
      const res = await apiClient.get('/api/markets/nearby', { params })
      return res.data.data
    },
    staleTime: 3 * 60_000,
  })
}

/**
 * Fetch daily historical price series for Recharts analytics.
 */
export function useHistoricalPrices(commodity: string, marketOrState?: string, days = 14) {
  return useQuery({
    queryKey: marketKeys.history(commodity, marketOrState, days),
    queryFn: async (): Promise<IHistoricalPricesResponse> => {
      const res = await apiClient.get('/api/markets/history', {
        params: { commodity, market: marketOrState, days },
      })
      return res.data.data as IHistoricalPricesResponse
    },
    enabled: Boolean(commodity),
    staleTime: 5 * 60_000,
  })
}

/**
 * Fetch user's configured price alerts.
 */
export function useMarketAlerts() {
  return useQuery({
    queryKey: marketKeys.alerts(),
    queryFn: async (): Promise<IPriceAlert[]> => {
      const res = await apiClient.get('/api/markets/alerts')
      return res.data.data as IPriceAlert[]
    },
    staleTime: 30_000,
  })
}

/**
 * Mutation: Create a price alert.
 */
export function useCreatePriceAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      commodity: string
      targetPrice: number
      condition: 'above' | 'below'
      mandiName?: string
      state?: string
    }): Promise<IPriceAlert> => {
      const res = await apiClient.post('/api/markets/alerts', payload)
      return res.data.data as IPriceAlert
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketKeys.alerts() })
    },
  })
}

/**
 * Mutation: Delete a price alert.
 */
export function useDeletePriceAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string): Promise<void> => {
      await apiClient.delete(`/api/markets/alerts/${alertId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketKeys.alerts() })
    },
  })
}

/**
 * Fetch user's favorite commodities with live prices.
 */
export function useMarketFavorites() {
  return useQuery({
    queryKey: marketKeys.favorites(),
    queryFn: async (): Promise<IFavoriteItem[]> => {
      const res = await apiClient.get('/api/markets/favorites')
      return res.data.data as IFavoriteItem[]
    },
    staleTime: 60_000,
  })
}

/**
 * Mutation: Toggle favorite commodity.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { commodity: string; state?: string }): Promise<{ isFavorite: boolean }> => {
      const res = await apiClient.post('/api/markets/favorites', payload)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: marketKeys.favorites() })
    },
  })
}

