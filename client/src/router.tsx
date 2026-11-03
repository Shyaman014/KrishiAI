import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootLayout from '@/layouts/RootLayout'
import AppLayout from '@/layouts/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import DashboardPage from '@/pages/DashboardPage'
import CropDiseaseScannerPage from '@/pages/CropDiseaseScannerPage'
import MyCropsPage from '@/pages/MyCropsPage'
import WeatherAdvisoryPage from '@/pages/WeatherAdvisoryPage'
import CropRecommendationsPage from '@/pages/CropRecommendationsPage'
import MarketPricesPage from '@/pages/MarketPricesPage'
import AiAssistantPage from '@/pages/AiAssistantPage'
import ScanHistoryPage from '@/pages/ScanHistoryPage'
import SettingsPage from '@/pages/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      // Public-only authentication routes
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <PublicOnlyRoute>
            <ResetPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        path: 'dashboard',
        element: <Navigate to="/app" replace />,
      },
      // Protected application routes
      {
        path: 'app',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'scanner',
            element: <CropDiseaseScannerPage />,
          },
          {
            path: 'crops',
            element: <MyCropsPage />,
          },
          {
            path: 'weather',
            element: <WeatherAdvisoryPage />,
          },
          {
            path: 'recommendations',
            element: <CropRecommendationsPage />,
          },
          {
            path: 'market',
            element: <MarketPricesPage />,
          },
          {
            path: 'assistant',
            element: <AiAssistantPage />,
          },
          {
            path: 'history',
            element: <ScanHistoryPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
