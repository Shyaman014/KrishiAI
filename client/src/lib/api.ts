import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// IN-MEMORY TOKEN STORE (Strict security: Never store tokens in localStorage)
let inMemoryAccessToken: string | null = null

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true, // Crucial for automatic transmission of HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: Attach in-memory Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (inMemoryAccessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`
  }
  return config
})

// Track refresh promise to avoid duplicate simultaneous refresh calls
let refreshPromise: Promise<string | null> | null = null

// Response interceptor: Automatically refresh session on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If 401 occurs and we haven't tried refreshing yet
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/refresh') &&
      !originalRequest.url?.includes('/api/auth/login')
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_BASE_URL}/api/auth/refresh`,
              {},
              { withCredentials: true },
            )
            .then((res) => {
              const newToken = res.data?.data?.accessToken as string
              setAccessToken(newToken)
              return newToken
            })
            .catch((refreshErr) => {
              setAccessToken(null)
              return Promise.reject(refreshErr)
            })
            .finally(() => {
              refreshPromise = null
            })
        }

        const newToken = await refreshPromise
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        setAccessToken(null)
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default apiClient
