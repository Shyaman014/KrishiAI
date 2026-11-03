import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface HealthResponse {
  status: string
  service: string
  timestamp: string
  version: string
}

export function useApiHealth() {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await apiClient.get<HealthResponse>('/api/health')
      return data
    },
    staleTime: 1000 * 30, // re-check every 30s
    retry: false,
  })
}
