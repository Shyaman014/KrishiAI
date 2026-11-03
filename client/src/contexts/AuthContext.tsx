import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import apiClient, { setAccessToken } from '@/lib/api'
import { useToast } from './ToastContext'

export type UserRole = 'farmer' | 'admin'
export type UserLanguage = 'en' | 'hi' | 'pa' | 'mr' | 'te' | 'ta'

export interface User {
  _id: string
  fullName: string
  email: string
  phoneNumber?: string
  profileImage?: string
  preferredLanguage: UserLanguage
  role: UserRole
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface RegisterInput {
  fullName: string
  email: string
  phoneNumber?: string
  password: string
  confirmPassword: string
  preferredLanguage?: UserLanguage
}

export interface UpdateProfileInput {
  fullName?: string
  phoneNumber?: string
  preferredLanguage?: UserLanguage
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (data: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileInput) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>
  forgotPassword: (email: string) => Promise<string>
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { toast } = useToast()

  // Silent session restore via HttpOnly refresh cookie on application load
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await apiClient.post<{ success: boolean; data: { accessToken: string; user: User } }>(
        '/api/auth/refresh',
      )
      if (res.data?.success && res.data.data) {
        setAccessToken(res.data.data.accessToken)
        setUser(res.data.data.user)
        return true
      }
      return false
    } catch {
      setAccessToken(null)
      setUser(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = async (email: string, password: string, rememberMe = true): Promise<void> => {
    setIsLoading(true)
    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        data: { accessToken: string; user: User }
      }>('/api/auth/login', { email, password, rememberMe })

      if (res.data.success) {
        setAccessToken(res.data.data.accessToken)
        setUser(res.data.data.user)
        toast.success(`Welcome back, ${res.data.data.user.fullName}!`, 'Login Successful')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to log in. Please check your credentials.'
      toast.error(errorMsg, 'Authentication Error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterInput): Promise<void> => {
    setIsLoading(true)
    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        data: { accessToken: string; user: User }
      }>('/api/auth/register', data)

      if (res.data.success) {
        setAccessToken(res.data.data.accessToken)
        setUser(res.data.data.user)
        toast.success('Your account has been created successfully!', 'Welcome to KrishiAI')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please review your information.'
      toast.error(errorMsg, 'Registration Failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout')
    } catch {
      // Proceed even if network fails
    } finally {
      setAccessToken(null)
      setUser(null)
      toast.info('You have been logged out securely.', 'Signed Out')
    }
  }

  const updateProfile = async (data: UpdateProfileInput): Promise<void> => {
    try {
      const res = await apiClient.patch<{
        success: boolean
        message: string
        data: { user: User }
      }>('/api/auth/profile', data)

      if (res.data.success) {
        setUser(res.data.data.user)
        toast.success('Profile information updated.', 'Changes Saved')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile details.'
      toast.error(errorMsg, 'Update Error')
      throw err
    }
  }

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<void> => {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/api/auth/change-password',
        { currentPassword, newPassword, confirmNewPassword },
      )

      if (res.data.success) {
        setAccessToken(null)
        setUser(null)
        toast.success('Password updated successfully. Please log in with your new password.', 'Password Changed')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update password.'
      toast.error(errorMsg, 'Error')
      throw err
    }
  }

  const forgotPassword = async (email: string): Promise<string> => {
    try {
      const res = await apiClient.post<{
        success: boolean
        message: string
        devResetToken?: string
      }>('/api/auth/forgot-password', { email })

      toast.info(res.data.message, 'Instructions Sent')
      return res.data.devResetToken || ''
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to process password reset request.'
      toast.error(errorMsg, 'Request Failed')
      throw err
    }
  }

  const resetPassword = async (token: string, password: string, confirmPassword: string): Promise<void> => {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/api/auth/reset-password',
        { token, password, confirmPassword },
      )

      if (res.data.success) {
        toast.success(res.data.message, 'Password Reset')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Password reset link is invalid or expired.'
      toast.error(errorMsg, 'Reset Failed')
      throw err
    }
  }

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        '/api/auth/verify-email',
        { token },
      )
      if (res.data.success) {
        toast.success(res.data.message, 'Email Verified')
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Email verification link is invalid or expired.'
      toast.error(errorMsg, 'Verification Failed')
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        verifyEmail,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

