import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

export interface IMessage {
  _id?: string
  id?: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

export interface IConversationItem {
  id: string
  title: string
  language: 'en' | 'hi' | 'as'
  messageCount: number
  lastMessage: string
  updatedAt: string
  createdAt: string
}

export interface IConversationDetail {
  _id: string
  title: string
  language: 'en' | 'hi' | 'as'
  messages: IMessage[]
  updatedAt: string
  createdAt: string
}

export interface IChatResponseData {
  conversationId: string
  reply: string
  language: 'en' | 'hi' | 'as'
  model: string
  isFallback: boolean
  messages: IMessage[]
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const assistantKeys = {
  all: ['assistant'] as const,
  conversations: (page = 1) => ['assistant', 'conversations', page] as const,
  detail: (id?: string) => ['assistant', 'detail', id] as const,
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetch paginated list of farmer conversations.
 */
export function useConversations(page = 1, limit = 20) {
  return useQuery({
    queryKey: assistantKeys.conversations(page),
    queryFn: async (): Promise<{
      items: IConversationItem[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
        hasPrevPage: boolean
      }
    }> => {
      const res = await apiClient.get('/api/assistant/conversations', {
        params: { page, limit },
      })
      return res.data.data
    },
    staleTime: 30_000,
  })
}

/**
 * Fetch details of a single conversation.
 */
export function useConversation(id?: string) {
  return useQuery({
    queryKey: assistantKeys.detail(id),
    queryFn: async (): Promise<IConversationDetail> => {
      const res = await apiClient.get(`/api/assistant/conversations/${id}`)
      return res.data.data
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  })
}

/**
 * Send chat message mutation.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      message: string
      conversationId?: string
      language?: 'en' | 'hi' | 'as'
    }): Promise<IChatResponseData> => {
      const res = await apiClient.post('/api/assistant/chat', payload)
      return res.data.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.all })
      if (data.conversationId) {
        queryClient.setQueryData(
          assistantKeys.detail(data.conversationId),
          (old: IConversationDetail | undefined) => {
            if (!old) return undefined
            return {
              ...old,
              messages: data.messages,
            }
          },
        )
      }
    },
  })
}

/**
 * Delete conversation mutation.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/api/assistant/conversations/${id}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.all })
    },
  })
}
