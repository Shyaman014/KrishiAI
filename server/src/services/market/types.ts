export interface IMandiPriceRecord {
  id: string
  commodity: string
  variety: string
  grade: string
  market: string
  district: string
  state: string
  minPrice: number // ₹/Quintal
  maxPrice: number // ₹/Quintal
  modalPrice: number // ₹/Quintal
  msp?: number // Government MSP in ₹/Quintal if applicable
  date: string // YYYY-MM-DD
  arrivalQuantityTonnes?: number
  trend: 'up' | 'down' | 'flat'
  changePercent: number
  source: string // 'data.gov.in Agmarknet API' | 'Agmarknet Daily Market Bulletin Archive'
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
  date: string // YYYY-MM-DD
  modalPrice: number
  minPrice: number
  maxPrice: number
  marketCount: number
}

export interface ICommoditySummary {
  commodity: string
  hindiName?: string
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

