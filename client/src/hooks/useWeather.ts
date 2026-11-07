import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

export interface ICurrentWeatherData {
  location: {
    name: string
    country: string
    lat: number
    lon: number
  }
  current: {
    temp: number
    feelsLike: number
    tempMin: number
    tempMax: number
    humidity: number
    pressure: number
    windSpeed: number
    windDeg: number
    clouds: number
    condition: string
    description: string
    icon: string
    rainfall1h: number
    sunrise: number
    sunset: number
    dt: number
  }
  cached?: boolean
  source?: string
}

export interface IHourlyForecastItem {
  dt: number
  time: string
  temp: number
  feelsLike: number
  humidity: number
  pop: number
  rain3h: number
  windSpeed: number
  condition: string
  icon: string
}

export interface IDailyForecastItem {
  dt: number
  date: string
  dayName: string
  tempMin: number
  tempMax: number
  avgHumidity: number
  maxPop: number
  totalRain: number
  condition: string
  icon: string
  sprayOk: boolean
}

export interface IForecastData {
  location: {
    name: string
    country: string
    lat: number
    lon: number
  }
  hourly: IHourlyForecastItem[]
  daily: IDailyForecastItem[]
  lastUpdated: string
}

export interface IWeatherAlertItem {
  _id?: string
  id?: string
  alertType: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  actionableGuidance: string
  validUntil: string
}

export interface ISprayWindowGuidance {
  status: 'optimal' | 'acceptable' | 'unfavorable' | 'hazardous'
  statusLabel: string
  isFavorableToday: boolean
  recommendedHours: string
  windSpeedKmH: number
  rainProbabilityNext12h: number
  riskFactors: string[]
  guidanceText: string
}

export interface IIrrigationAdvisory {
  action: 'delay' | 'normal' | 'increase' | 'halt'
  statusLabel: string
  expectedRainfall24hMm: number
  expectedRainfall48hMm: number
  soilMoistureStatus: string
  recommendation: string
}

export interface IFieldActivities {
  spraying: { suitable: boolean; note: string }
  irrigation: { suitable: boolean; note: string }
  harvesting: { suitable: boolean; note: string }
  sowing: { suitable: boolean; note: string }
}

export interface IWeatherAdvisoryData {
  location: {
    name: string
    country: string
    lat: number
    lon: number
  }
  generatedAt: string
  alerts: IWeatherAlertItem[]
  sprayWindow: ISprayWindowGuidance
  irrigation: IIrrigationAdvisory
  fieldActivities: IFieldActivities
  explanationSummary: string
  language: 'en' | 'hi' | 'as'
}

export interface ICityOption {
  name: string
  state?: string
  country: string
  lat: number
  lon: number
}

export function useWeather() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Selected Location State (null = use server/user default)
  const [coords, setCoords] = useState<{ lat?: number; lon?: number; city?: string }>({})
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle')
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'as'>('en')

  // Check initial GPS permission status if supported
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') setGpsStatus('granted')
          else if (res.state === 'denied') setGpsStatus('denied')
        })
        .catch(() => {
          // Permissions API query not supported for geolocation in some browsers
        })
    }
  }, [])

  // Request browser GPS coordinates
  const requestGpsLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('unavailable')
      toast.error('Geolocation is not supported by your browser. Please search city manually.')
      return
    }

    setGpsStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(4))
        const lon = Number(pos.coords.longitude.toFixed(4))
        setCoords({ lat, lon })
        setGpsStatus('granted')
        toast.success('GPS coordinates acquired! Refreshing farm weather telemetry...')

        // Update user location preference on server
        try {
          await apiClient.post('/api/weather/location', {
            latitude: lat,
            longitude: lon,
            source: 'gps',
          })
          void queryClient.invalidateQueries({ queryKey: ['weather'] })
        } catch {
          // Non-blocking
        }
      },
      (err) => {
        setGpsStatus('denied')
        let msg = 'Unable to retrieve location.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. You can select your district or city manually.'
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.'
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.'
        }
        toast.warning(msg)
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 300_000 },
    )
  }, [queryClient, toast])

  // Set Manual City Location
  const setManualLocation = useCallback(
    async (city: ICityOption) => {
      setCoords({ lat: city.lat, lon: city.lon, city: city.name })
      toast.success(`Weather location switched to ${city.name}${city.state ? `, ${city.state}` : ''}`)

      try {
        await apiClient.post('/api/weather/location', {
          cityName: `${city.name}${city.state ? `, ${city.state}` : ''}`,
          state: city.state,
          country: city.country,
          latitude: city.lat,
          longitude: city.lon,
          source: 'manual',
        })
        void queryClient.invalidateQueries({ queryKey: ['weather'] })
      } catch {
        // Non-blocking
      }
    },
    [queryClient, toast],
  )

  // Query: Full Weather & Agronomic Advisory
  const {
    data: advisoryData,
    isLoading: isLoadingAdvisory,
    isError: isAdvisoryError,
    error: advisoryError,
    refetch: refetchAdvisory,
  } = useQuery({
    queryKey: ['weather', 'advisory', coords.lat, coords.lon, coords.city, selectedLanguage],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (coords.lat !== undefined) params.append('lat', String(coords.lat))
      if (coords.lon !== undefined) params.append('lon', String(coords.lon))
      if (coords.city) params.append('city', coords.city)
      params.append('lang', selectedLanguage)

      const res = await apiClient.get(`/api/weather/advisory?${params.toString()}`)
      return res.data.data as {
        current: ICurrentWeatherData
        forecast: IForecastData
        advisory: IWeatherAdvisoryData
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Dismiss Alert Mutation
  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiClient.patch(`/api/weather/alerts/${alertId}/dismiss`)
    },
    onSuccess: () => {
      toast.success('Alert dismissed.')
      void queryClient.invalidateQueries({ queryKey: ['weather', 'advisory'] })
    },
    onError: () => {
      toast.error('Failed to dismiss alert.')
    },
  })

  return {
    current: advisoryData?.current ?? null,
    forecast: advisoryData?.forecast ?? null,
    advisory: advisoryData?.advisory ?? null,
    isLoading: isLoadingAdvisory,
    isError: isAdvisoryError,
    error: advisoryError,
    refetch: refetchAdvisory,
    // Location
    coords,
    gpsStatus,
    requestGpsLocation,
    setManualLocation,
    // Language
    language: selectedLanguage,
    setLanguage: setSelectedLanguage,
    // Dismiss alert
    dismissAlert: dismissMutation.mutate,
  }
}

