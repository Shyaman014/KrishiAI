import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { useToast } from '@/contexts/ToastContext'

export interface NotificationItem {
  id: string
  type:
    | 'scan_completed'
    | 'scan_failed'
    | 'weather_alert'
    | 'price_target_reached'
    | 'farming_advisory'
  title: string
  message: string
  relatedResourceId?: string
  resourceType?: 'scan' | 'market' | 'weather' | 'crop_recommendation' | 'advisory'
  isRead: boolean
  readAt?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useNotifications(params?: {
  page?: number
  limit?: number
  unreadOnly?: boolean
}) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const page = params?.page || 1
  const limit = params?.limit || 20
  const unreadOnly = params?.unreadOnly || false

  const queryKey = ['notifications', { page, limit, unreadOnly }]

  const query = useQuery<NotificationsResponse>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get('/api/notifications', {
        params: { page, limit, unreadOnly: unreadOnly ? 'true' : undefined },
      })
      return res.data.data
    },
    staleTime: 30_000,
  })

  // Real-time socket listener
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (notif: NotificationItem) => {
      // Invalidate notifications queries
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })

      // Display live toast notification
      toast.info(`${notif.title}: ${notif.message.slice(0, 80)}...`)
    }

    const handleUpdatedNotification = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }

    const handleReadAll = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }

    const handleDeleted = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    }

    socket.on('notification:new', handleNewNotification)
    socket.on('notification:updated', handleUpdatedNotification)
    socket.on('notification:read_all', handleReadAll)
    socket.on('notification:deleted', handleDeleted)

    return () => {
      socket.off('notification:new', handleNewNotification)
      socket.off('notification:updated', handleUpdatedNotification)
      socket.off('notification:read_all', handleReadAll)
      socket.off('notification:deleted', handleDeleted)
    }
  }, [queryClient, toast])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/api/notifications/${id}/read`)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch('/api/notifications/read-all')
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/notifications/${id}`)
      return res.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  return {
    ...query,
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unreadCount || 0,
    pagination: query.data?.pagination,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
  }
}

export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiClient.get('/api/notifications', { params: { limit: 1 } })
      return res.data.data?.unreadCount || 0
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

