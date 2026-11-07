import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Sprout,
  ScanLine,
  CloudSun,
  Activity as ActivityIcon,
  Plus,
  Bot,
  ExternalLink,
  Droplets,
  Wind,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import apiClient from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'

// API Response interfaces
interface DashboardOverview {
  totalScans: number
  healthyScans: number
  diseaseScans: number
  pendingScans: number
  totalCrops: number
  monitoredAcres: number
  healthyCrops: number
  healthIndex: number | null
  recentActivityCount: number
}

interface CropHealthItem {
  id: string
  name: string
  variety?: string
  area: number
  stage: string
  healthStatus: 'healthy' | 'moderate' | 'critical'
  location?: string
}

interface CropHealthData {
  summary: {
    healthy: number
    moderate: number
    critical: number
    pending: number
    total: number
  }
  distribution: Array<{
    name: string
    value: number
    color: string
  }>
  crops: CropHealthItem[]
}

interface ScanRecord {
  id: string
  cropName: string
  fieldLocation?: string
  imageUrl?: string
  diseaseName: string
  severity: 'healthy' | 'moderate' | 'high'
  confidence: number
  status: 'pending' | 'completed' | 'failed'
  remediation?: string
  createdAt: string
}

interface RecentScansResponse {
  scans: ScanRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UserActivity {
  id: string
  type: string
  title: string
  description: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface ActivityResponse {
  activities: UserActivity[]
  total: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null)
  const [scanFilter, setScanFilter] = useState<'all' | 'flagged'>('all')

  // 1. Fetch Overview Statistics
  const {
    data: overview,
    isLoading: isLoadingOverview,
    refetch: refetchOverview,
  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/overview')
      return res.data.data
    },
  })

  // 2. Fetch Crop Health Data
  const {
    data: cropHealth,
    isLoading: isLoadingCropHealth,
  } = useQuery<CropHealthData>({
    queryKey: ['dashboard-crop-health'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/crop-health')
      return res.data.data
    },
  })

  // 3. Fetch Recent Scans
  const {
    data: recentScansData,
    isLoading: isLoadingScans,
  } = useQuery<RecentScansResponse>({
    queryKey: ['dashboard-recent-scans'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/recent-scans?limit=6')
      return res.data.data
    },
  })

  // 4. Fetch User Activity
  const {
    data: activityData,
    isLoading: isLoadingActivity,
  } = useQuery<ActivityResponse>({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/api/dashboard/activity?limit=6')
      return res.data.data
    },
  })

  // 5. Fetch Live Micro-Climate & Agro-Advisory
  const {
    data: weatherData,
    isLoading: isLoadingWeather,
  } = useQuery({
    queryKey: ['dashboard-weather'],
    queryFn: async () => {
      const res = await apiClient.get('/api/weather/advisory')
      return res.data?.data
    },
    staleTime: 5 * 60 * 1000,
  })

  // Format current date
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  // Filter scans based on tab
  const scansList = recentScansData?.scans ?? []
  const filteredScans =
    scanFilter === 'all'
      ? scansList
      : scansList.filter((s) => s.severity !== 'healthy')

  // Activity icon helper
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account_created':
        return UserCheck
      case 'profile_updated':
        return Sparkles
      case 'password_changed':
        return ShieldCheck
      case 'crop_registered':
        return Sprout
      case 'scan_completed':
      case 'scan_submitted':
        return ScanLine
      default:
        return ActivityIcon
    }
  }

  const formatActivityTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const diffMs = Date.now() - date.getTime()
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      if (diffHrs < 1) return 'Just now'
      if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
      const diffDays = Math.floor(diffHrs / 24)
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    } catch {
      return 'Recently'
    }
  }

  // Check if chart has any values
  const hasHealthData =
    cropHealth &&
    (cropHealth.summary.total > 0 || cropHealth.crops.length > 0)

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ===================== 1. Personalized Hero Header ===================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border border-primary/20 shadow-premium">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xl">🌱</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Rabi Agricultural Season 2026-27
            </span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-xs text-muted-foreground font-medium">
              {todayFormatted}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Namaste, {user?.fullName || 'Farmer'} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Welcome to your KrishiAI control center. Monitor registered plots, diagnose leaf health, and track real-time farm activities.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Regional Agro-Climatic Zone
            </span>
            <span>•</span>
            <span>
              Language:{' '}
              <strong className="text-foreground uppercase">
                {user?.preferredLanguage || 'en'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Role:{' '}
              <strong className="text-foreground capitalize">
                {user?.role || 'farmer'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh Data
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/scanner')}
            leftIcon={<ScanLine className="h-4 w-4" />}
          >
            New Crop Scan
          </Button>
        </div>
      </div>

      {/* ===================== 2. Dynamic Statistic Cards ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <Card className="hover:border-primary/40 transition-all shadow-subtle hover:shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Crop Scans
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ScanLine className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-extrabold text-foreground">
                  {overview?.totalScans ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {overview && overview.totalScans > 0 ? (
                  <span>
                    {overview.healthyScans} healthy • {overview.diseaseScans} flagged
                  </span>
                ) : (
                  <span>No scans performed yet</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Healthy Crops Detected */}
        <Card className="hover:border-emerald-500/40 transition-all shadow-subtle hover:shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Healthy Foliage
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-extrabold text-foreground">
                  {overview?.healthyScans ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Verified pest & pathogen-free records
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Disease Cases Detected */}
        <Card className="hover:border-rose-500/40 transition-all shadow-subtle hover:shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Disease Cases
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-extrabold text-foreground">
                  {overview?.diseaseScans ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {overview && overview.diseaseScans > 0
                  ? 'Foliar treatment recommended'
                  : 'Zero disease detections'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total Registered Crops */}
        <Card className="hover:border-primary/40 transition-all shadow-subtle hover:shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Registered Crops
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sprout className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              {isLoadingOverview ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-extrabold text-foreground">
                  {overview?.totalCrops ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {overview?.monitoredAcres ?? 0} Acres under management
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================== 3. Crop Health & Weather Section ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Crop Health Overview Chart */}
        <Card className="lg:col-span-2 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Crop Health Overview</CardTitle>
              <CardDescription>
                Aggregated diagnostic distribution across monitored farm plots
              </CardDescription>
            </div>
            {overview?.healthIndex !== null && overview?.healthIndex !== undefined && (
              <Badge variant="success" size="sm" className="font-semibold">
                {overview.healthIndex}% Health Score
              </Badge>
            )}
          </CardHeader>

          <CardContent className="pt-4">
            {isLoadingCropHealth ? (
              <div className="space-y-4 py-8">
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : hasHealthData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Recharts Donut Visual */}
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropHealth?.distribution.filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {cropHealth?.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            return (
                              <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
                                <p className="text-xs font-semibold text-foreground">
                                  {data.name}
                                </p>
                                <p className="text-sm font-extrabold text-primary">
                                  {data.value} record{data.value !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Health Metrics Breakdown Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-foreground">Optimal / Healthy</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {cropHealth?.summary.healthy ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium text-foreground">Moderate / Watch</span>
                    </div>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {cropHealth?.summary.moderate ?? 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="text-xs font-medium text-foreground">Critical / Disease</span>
                    </div>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      {cropHealth?.summary.critical ?? 0}
                    </span>
                  </div>

                  {cropHealth?.summary.pending ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">Pending Analysis</span>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">
                        {cropHealth.summary.pending}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Sprout}
                title="No Crop Health Records"
                description="Crop health distributions appear automatically when you register crops or perform foliage scans."
                actionLabel="Scan Your First Crop"
                onAction={() => navigate('/app/scanner')}
                actionIcon={<ScanLine className="h-4 w-4" />}
                className="py-10"
              />
            )}
          </CardContent>
        </Card>

        {/* Right: Weather Telemetry Widget */}
        <Card className="shadow-subtle flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Regional Weather
                </span>
                <Badge variant="success" size="sm" className="text-[10px]">
                  Live Telemetry
                </Badge>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CloudSun className="h-5 w-5 text-amber-500" />
                Micro-Climate Telemetry
              </CardTitle>
              <CardDescription>
                Hyper-local farm weather and spray window monitoring
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isLoadingWeather ? (
                <div className="space-y-3 py-2">
                  <Skeleton className="h-28 w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : weatherData?.current ? (
                <>
                  {/* Weather Data Display Panel */}
                  <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-foreground">
                          {weatherData.current.location.name}
                        </span>
                      </div>
                      <Badge variant="outline" size="sm" className="text-[11px] capitalize">
                        {weatherData.current.current.condition}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground">
                          {weatherData.current.current.temp}°C
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Feels like {weatherData.current.current.feelsLike}°C
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        High {weatherData.current.current.tempMax}° • Low {weatherData.current.current.tempMin}°
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
                      <div className="p-2 rounded-xl bg-card border border-border/40">
                        <Droplets className="h-3.5 w-3.5 text-blue-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted-foreground block">Humidity</span>
                        <span className="text-xs font-bold text-foreground">
                          {weatherData.current.current.humidity}%
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-border/40">
                        <Wind className="h-3.5 w-3.5 text-teal-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted-foreground block">Wind</span>
                        <span className="text-xs font-bold text-foreground">
                          {weatherData.current.current.windSpeed} km/h
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-card border border-border/40">
                        <CloudSun className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted-foreground block">Rain Chance</span>
                        <span className="text-xs font-bold text-foreground">
                          {weatherData.forecast?.daily?.[0]?.maxPop ?? 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Alert or Spray Advisory Snippet */}
                  {weatherData.advisory?.alerts && weatherData.advisory.alerts.length > 0 ? (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <strong className="block font-bold">{weatherData.advisory.alerts[0].title}</strong>
                        <p className="text-[11px] opacity-90">{weatherData.advisory.alerts[0].actionableGuidance}</p>
                      </div>
                    </div>
                  ) : weatherData.advisory?.sprayWindow ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
                      <span className="text-muted-foreground">Spray Window Today:</span>
                      <Badge
                        variant={weatherData.advisory.sprayWindow.isFavorableToday ? 'success' : 'warning'}
                        size="sm"
                      >
                        {weatherData.advisory.sprayWindow.statusLabel}
                      </Badge>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Weather telemetry unavailable.
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/app/weather')}
              rightIcon={<ExternalLink className="h-3.5 w-3.5" />}
            >
              Open Weather Advisory
            </Button>
          </div>
        </Card>
      </div>

      {/* ===================== 4. Quick Actions Hub ===================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
            <p className="text-xs text-muted-foreground">
              Frequently accessed agronomic tools and workflows
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => navigate('/app/scanner')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary-hover transition-all text-center group shadow-sm hover:shadow-md"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ScanLine className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Scan a Crop</span>
            <span className="text-[10px] opacity-80 mt-0.5">Instant AI Check</span>
          </button>

          <button
            onClick={() => navigate('/app/crops')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Add a Crop</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Register Plot</span>
          </button>

          <button
            onClick={() => navigate('/app/history')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Scan History</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Past Records</span>
          </button>

          <button
            onClick={() => navigate('/app/assistant')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">AI Assistant</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Farming Q&A</span>
          </button>

          <button
            onClick={() => navigate('/app/weather')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <CloudSun className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Weather Advisory</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Spray Guidance</span>
          </button>

          <button
            onClick={() => navigate('/app/market')}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-center group shadow-subtle"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-foreground">Mandi Prices</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Market Rates</span>
          </button>
        </div>
      </div>

      {/* ===================== 5. Recent Scans & Activity Split ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Recent Scans */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recent Scans</h2>
              <p className="text-xs text-muted-foreground">
                Diagnostic reports from your crop foliage submissions
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={scanFilter}
                onValueChange={(v) => setScanFilter(v as 'all' | 'flagged')}
              >
                <TabsList>
                  <TabsTrigger value="all">All Scans</TabsTrigger>
                  <TabsTrigger value="flagged">Needs Attention</TabsTrigger>
                </TabsList>
              </Tabs>
              <Link to="/app/history">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </div>

          {isLoadingScans ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredScans.length > 0 ? (
            <div className="space-y-3">
              {filteredScans.map((scan) => (
                <motion.div
                  key={scan.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card className="hover:border-primary/40 transition-all shadow-subtle hover:shadow-card">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        {/* Thumbnail */}
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden">
                          {scan.imageUrl ? (
                            <img
                              src={scan.imageUrl}
                              alt={scan.cropName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Sprout className="h-6 w-6 text-primary" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {scan.cropName}
                            </h4>
                            {scan.fieldLocation && (
                              <span className="text-xs text-muted-foreground">
                                • {scan.fieldLocation}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {scan.diseaseName}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span>
                              {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {scan.confidence > 0 && (
                              <span>
                                Confidence:{' '}
                                <strong className="text-foreground">
                                  {scan.confidence}%
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Badge
                          variant={
                            scan.severity === 'healthy'
                              ? 'success'
                              : scan.severity === 'moderate'
                              ? 'warning'
                              : 'destructive'
                          }
                          size="sm"
                        >
                          {scan.severity === 'healthy'
                            ? 'Optimal'
                            : scan.severity === 'moderate'
                            ? 'Moderate'
                            : 'Critical'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedScan(scan)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                        >
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ScanLine}
              title={
                scanFilter === 'flagged'
                  ? 'No Disease Issues Flagged'
                  : 'No Crop Scans Yet'
              }
              description={
                scanFilter === 'flagged'
                  ? 'Great news! None of your scanned crops require immediate intervention.'
                  : 'Upload leaf photographs to diagnose pests, nutrient deficiencies, or fungal pathogens.'
              }
              actionLabel="Scan a Crop Now"
              onAction={() => navigate('/app/scanner')}
              actionIcon={<ScanLine className="h-4 w-4" />}
            />
          )}
        </div>

        {/* Right Col: Real User Activity */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
            <p className="text-xs text-muted-foreground">
              Audit log of real account and farm events
            </p>
          </div>

          <Card className="shadow-subtle">
            <CardContent className="p-4 sm:p-5">
              {isLoadingActivity ? (
                <div className="space-y-4 py-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : activityData && activityData.activities.length > 0 ? (
                <div className="space-y-4">
                  {activityData.activities.map((act) => {
                    const IconComponent = getActivityIcon(act.type)
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {act.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {act.description}
                          </p>
                          <span className="text-[10px] text-muted-foreground block mt-1">
                            {formatActivityTime(act.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No recent activities recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===================== Scan Details Inspection Dialog ===================== */}
      {selectedScan && (
        <Dialog
          open={!!selectedScan}
          onOpenChange={(open) => {
            if (!open) setSelectedScan(null)
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={
                    selectedScan.severity === 'healthy'
                      ? 'success'
                      : selectedScan.severity === 'moderate'
                      ? 'warning'
                      : 'destructive'
                  }
                  size="sm"
                >
                  {selectedScan.severity.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {selectedScan.id.substring(0, 8)}
                </span>
              </div>
              <DialogTitle className="text-xl">
                {selectedScan.cropName} • {selectedScan.diseaseName}
              </DialogTitle>
              <DialogDescription>
                Diagnostic inspection recorded on{' '}
                {new Date(selectedScan.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Image preview if exists */}
              {selectedScan.imageUrl && (
                <div className="h-44 w-full rounded-2xl overflow-hidden border border-border">
                  <img
                    src={selectedScan.imageUrl}
                    alt={selectedScan.cropName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Diagnosis metadata grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-card border border-border text-xs">
                <div>
                  <span className="text-muted-foreground block">Field Plot:</span>
                  <strong className="text-foreground">
                    {selectedScan.fieldLocation || 'General Farm Plot'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Model Confidence:</span>
                  <strong className="text-foreground">
                    {selectedScan.confidence > 0 ? `${selectedScan.confidence}%` : 'Standard Assessment'}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Analysis Status:</span>
                  <strong className="text-foreground capitalize">
                    {selectedScan.status}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Category:</span>
                  <strong className="text-foreground capitalize">
                    {selectedScan.severity}
                  </strong>
                </div>
              </div>

              {/* Treatment recommendations */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Agronomic Remediation & Guidance
                </h4>
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground leading-relaxed">
                  {selectedScan.remediation ||
                    'Maintain current scheduled irrigation and scouting. No aggressive intervention required at this stage.'}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedScan(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedScan(null)
                  navigate('/app/scanner')
                }}
                leftIcon={<ScanLine className="h-4 w-4" />}
              >
                Perform New Scan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
