import { useState, useEffect } from 'react'
import {
  Compass,
  Sparkles,
  Droplet,
  Layers,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertTriangle,
  History,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { useToast } from '@/contexts/ToastContext'
import { useWeather, ICityOption } from '@/hooks/useWeather'
import { LocationSelectorModal } from '@/components/weather/LocationSelectorModal'
import {
  useCropRecommendMutation,
  useCropRecommendHistory,
  CropRecommendationResult,
  CropRecommendationItem,
} from '@/hooks/useCropRecommendation'

export default function CropRecommendationsPage() {
  const { toast } = useToast()

  // Weather & Location Hook (reuses Phase 9 weather telemetry)
  const {
    current: currentWeather,
    coords,
    gpsStatus,
    requestGpsLocation,
    setManualLocation,
  } = useWeather()

  // Location selector modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)

  // Language selection
  const [language, setLanguage] = useState<'en' | 'hi' | 'as'>('en')

  // Form inputs
  const [soilType, setSoilType] = useState<string>('alluvial')
  const [season, setSeason] = useState<'kharif' | 'rabi' | 'zaid' | 'year-round'>('kharif')
  const [ph, setPh] = useState<number>(6.5)
  const [nitrogen, setNitrogen] = useState<number>(90)
  const [phosphorus, setPhosphorus] = useState<number>(42)
  const [potassium, setPotassium] = useState<number>(43)
  const [temperature, setTemperature] = useState<number>(24.0)
  const [humidity, setHumidity] = useState<number>(75.0)
  const [rainfall, setRainfall] = useState<number>(140.0)
  const [useLiveWeather, setUseLiveWeather] = useState<boolean>(true)

  // Active tab
  const [activeTab, setActiveTab] = useState<'recommend' | 'history'>('recommend')

  // Selected result to view (either newly computed or from history)
  const [activeResult, setActiveResult] = useState<CropRecommendationResult | null>(null)

  // History pagination
  const [historyPage, setHistoryPage] = useState<number>(1)

  // Queries & Mutations
  const recommendMutation = useCropRecommendMutation()
  const historyQuery = useCropRecommendHistory(historyPage, 10)

  // Sync temperature & humidity when live weather is updated and toggle is on
  useEffect(() => {
    if (useLiveWeather && currentWeather?.current) {
      if (typeof currentWeather.current.temp === 'number') {
        setTemperature(Number(currentWeather.current.temp.toFixed(1)))
      }
      if (typeof currentWeather.current.humidity === 'number') {
        setHumidity(Number(currentWeather.current.humidity.toFixed(1)))
      }
      // Estimate rainfall if available, else default to seasonal average
      if (typeof currentWeather.current.rainfall1h === 'number' && currentWeather.current.rainfall1h > 0) {
        setRainfall(Number((currentWeather.current.rainfall1h * 30).toFixed(1)))
      }
    }
  }, [useLiveWeather, currentWeather])

  // Handle city selection from modal
  const handleSelectCity = (city: ICityOption) => {
    setManualLocation(city)
    setIsLocationModalOpen(false)
    toast.success(`Location set to ${city.name}. Weather telemetry updated.`)
  }

  // Handle Form Submission
  const handleCompute = () => {
    if (nitrogen < 0 || nitrogen > 300) {
      toast.error('Nitrogen (N) must be between 0 and 300 kg/ha')
      return
    }
    if (phosphorus < 0 || phosphorus > 300) {
      toast.error('Phosphorus (P) must be between 0 and 300 kg/ha')
      return
    }
    if (potassium < 0 || potassium > 300) {
      toast.error('Potassium (K) must be between 0 and 300 kg/ha')
      return
    }
    if (ph < 0 || ph > 14) {
      toast.error('Soil pH must be between 0.0 and 14.0')
      return
    }
    if (rainfall < 0 || rainfall > 600) {
      toast.error('Rainfall must be between 0 and 600 mm')
      return
    }

    recommendMutation.mutate(
      {
        N: nitrogen,
        P: phosphorus,
        K: potassium,
        temperature,
        humidity,
        ph,
        rainfall,
        soilType,
        season,
        language,
        latitude: coords.lat,
        longitude: coords.lon,
        cityName: currentWeather?.location?.name || coords.city || 'Ludhiana, Punjab',
      },
      {
        onSuccess: (data) => {
          setActiveResult(data)
          toast.success('Crop recommendation computed successfully!')
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { message?: string } } }
          const msg = axiosErr.response?.data?.message || 'Failed to generate recommendation. Please check your inputs.'
          toast.error(msg)
        },
      },
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCompute()
  }

  const currentCityDisplay = currentWeather?.location?.name || coords.city || 'Ludhiana, Punjab'

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="default" size="sm">
              Agronomic Soil Matching AI
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono">
              RandomForest ML Engine v1.0
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-primary" />
            Intelligent Crop Recommendation System
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Algorithmically pair your farm's soil profile and live microclimate data with optimal crop
            varieties validated against ICAR and FAO agronomic benchmarks.
          </p>
        </div>

        {/* Location & Language Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center gap-1.5 text-xs shadow-sm bg-card hover:bg-muted/60"
          >
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium max-w-[130px] truncate">{currentCityDisplay}</span>
          </Button>

          <Select
            value={language}
            onValueChange={(val: 'en' | 'hi' | 'as') => setLanguage(val)}
          >
            <SelectTrigger className="w-[125px] h-8 text-xs bg-card">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
              <SelectItem value="as">অসমীয়া (Assamese)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'recommend' | 'history')}
        className="space-y-6"
      >
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="recommend" className="flex items-center gap-2 text-xs sm:text-sm">
            <Sparkles className="h-4 w-4" />
            New Crop Matching
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm">
            <History className="h-4 w-4" />
            Recommendation History
            {historyQuery.data?.pagination?.total ? (
              <Badge variant="secondary" size="sm" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {historyQuery.data.pagination.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: NEW RECOMMENDATION FORM & RESULTS */}
        <TabsContent value="recommend" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-5 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Soil Nutrients Card */}
                <Card className="shadow-subtle border-border">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Soil & Nutrient Parameters
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Enter N-P-K nutrient values from your soil health card or lab report.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Soil Type
                        </label>
                        <Select value={soilType} onValueChange={setSoilType}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Soil type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alluvial">Alluvial Deep Loam</SelectItem>
                            <SelectItem value="black">Black Cotton (Vertisol)</SelectItem>
                            <SelectItem value="red">Red / Laterite</SelectItem>
                            <SelectItem value="sandy">Sandy Loam</SelectItem>
                            <SelectItem value="clay">Clayey Heavy Soil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1">
                          Target Season
                        </label>
                        <Select
                          value={season}
                          onValueChange={(val: 'kharif' | 'rabi' | 'zaid' | 'year-round') => setSeason(val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Season" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                            <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                            <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                            <SelectItem value="year-round">Year-round</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* pH input */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                          Soil pH Level
                        </label>
                        <span className="text-xs font-mono font-bold text-primary">
                          pH {ph.toFixed(1)} ({ph < 6.0 ? 'Acidic' : ph > 7.5 ? 'Alkaline' : 'Neutral'})
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        value={ph}
                        onChange={(e) => setPh(parseFloat(e.target.value) || 0)}
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    {/* N-P-K grid */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Nitrogen (N)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="300"
                            value={nitrogen}
                            onChange={(e) => setNitrogen(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs font-mono pr-7"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            kg/ha
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Phosphorus (P)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="300"
                            value={phosphorus}
                            onChange={(e) => setPhosphorus(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs font-mono pr-7"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            kg/ha
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Potassium (K)
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="300"
                            value={potassium}
                            onChange={(e) => setPotassium(parseFloat(e.target.value) || 0)}
                            className="h-9 text-xs font-mono pr-7"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            kg/ha
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather & Climate Card */}
                <Card className="shadow-subtle border-border">
                  <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Droplet className="h-4 w-4 text-info" />
                        Climate & Environmental Conditions
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() => setUseLiveWeather(!useLiveWeather)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                          useLiveWeather
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {useLiveWeather ? '● Live Telemetry On' : '○ Manual Climate'}
                      </button>
                    </div>
                    <CardDescription className="text-xs">
                      Reuses verified Phase 9 OpenWeather telemetry for {currentCityDisplay}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Temperature
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.5"
                            value={temperature}
                            onChange={(e) => {
                              setTemperature(parseFloat(e.target.value) || 0)
                              setUseLiveWeather(false)
                            }}
                            className="h-9 text-xs font-mono pr-6"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            °C
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Humidity
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={humidity}
                            onChange={(e) => {
                              setHumidity(parseFloat(e.target.value) || 0)
                              setUseLiveWeather(false)
                            }}
                            className="h-9 text-xs font-mono pr-5"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            %
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">
                          Rainfall
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="600"
                            value={rainfall}
                            onChange={(e) => {
                              setRainfall(parseFloat(e.target.value) || 0)
                              setUseLiveWeather(false)
                            }}
                            className="h-9 text-xs font-mono pr-7"
                          />
                          <span className="absolute right-2 top-2 text-[10px] text-muted-foreground pointer-events-none">
                            mm
                          </span>
                        </div>
                      </div>
                    </div>

                    {currentWeather?.current && (
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5 text-primary" />
                          Live telemetry from {currentCityDisplay}:
                        </span>
                        <span className="font-semibold text-foreground">
                          {currentWeather.current.temp.toFixed(1)}°C • {currentWeather.current.humidity}% Humidity
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={recommendMutation.isPending}
                  leftIcon={
                    recommendMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )
                  }
                  className="w-full shadow-premium py-2.5"
                >
                  {recommendMutation.isPending ? 'Computing Agronomic Matches...' : 'Predict Top-3 Suitable Crops'}
                </Button>
              </form>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-7 space-y-6">
              {recommendMutation.isPending && (
                <Card className="p-12">
                  <LoadingState
                    message="Analyzing Soil & Microclimate Conditions"
                    subtext="Running Random Forest inference across 22 crop classification vectors and ICAR agronomic thresholds..."
                  />
                </Card>
              )}

              {recommendMutation.isError && (
                <ErrorState
                  title="Recommendation Failed"
                  message="Unable to compute crop recommendations. Please verify the AI microservice status and nutrient ranges."
                  onRetry={handleCompute}
                  isRetrying={recommendMutation.isPending}
                />
              )}

              {!recommendMutation.isPending && !activeResult && (
                <Card className="p-8">
                  <EmptyState
                    icon={Compass}
                    title="No Recommendation Computed Yet"
                    description="Enter your soil nutrient readings (N-P-K), pH, and climate parameters on the left to receive algorithmically matched crop varieties."
                    actionLabel="Load Default Parameters"
                    onAction={() => {
                      setNitrogen(90)
                      setPhosphorus(42)
                      setPotassium(43)
                      setPh(6.5)
                      setRainfall(140)
                      toast.info('Loaded baseline parameters for alluvial soil.')
                    }}
                  />
                </Card>
              )}

              {activeResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* Results Header with Model Version */}
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <h2 className="text-lg font-bold text-foreground">
                        Top 3 Recommended Crops
                      </h2>
                    </div>
                    <Badge variant="outline" size="sm" className="font-mono text-xs">
                      Model v{activeResult.modelVersion}
                    </Badge>
                  </div>

                  {/* Mandatory Agronomic Disclaimer Alert */}
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold">Agronomic Advisory Notice:</span>
                      <p className="leading-relaxed opacity-90">{activeResult.disclaimer}</p>
                    </div>
                  </div>

                  {/* Top-3 Cards */}
                  <div className="space-y-4">
                    {activeResult.recommendations.map((rec: CropRecommendationItem) => {
                      const badgeVariant: 'success' | 'default' | 'secondary' =
                        rec.rank === 1 ? 'success' : rec.rank === 2 ? 'default' : 'secondary'
                      return (
                        <Card
                          key={rec.rank}
                          className={`border-border transition-all hover:shadow-subtle ${
                            rec.rank === 1 ? 'ring-1 ring-primary/30' : ''
                          }`}
                        >
                          <CardHeader className="pb-2.5">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                  #{rec.rank}
                                </span>
                                <CardTitle className="text-lg capitalize">{rec.cropName}</CardTitle>
                              </div>
                              <Badge variant={badgeVariant} dot>
                                {rec.confidencePct}% Suitability Match
                              </Badge>
                            </div>
                            <CardDescription className="text-xs">
                              {rec.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="space-y-3 pt-0">
                            {/* Key specs grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Duration
                                </span>
                                <span className="font-semibold">{rec.growingDuration}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Water Need
                                </span>
                                <span className="font-semibold">{rec.waterRequirement}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Best Season
                                </span>
                                <span className="font-semibold">{rec.suitableSeason}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                                  Source
                                </span>
                                <span className="font-medium text-muted-foreground truncate block">
                                  {rec.source}
                                </span>
                              </div>
                            </div>

                            {/* Supporting factors */}
                            {rec.supportingFactors && rec.supportingFactors.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                                  Supporting Agronomic Factors:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {rec.supportingFactors.map((f, i) => (
                                    <div
                                      key={i}
                                      className="p-2 rounded bg-background border border-border/60 text-xs space-y-0.5"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold text-foreground flex items-center gap-1">
                                          <ShieldCheck className="h-3 w-3 text-primary" />
                                          {f.factor}
                                        </span>
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          {f.value}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-tight">
                                        {f.explanation}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Crop Comparison Matrix */}
                  <Card className="border-border">
                    <CardHeader className="pb-3 border-b border-border/50">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Crop Comparison Matrix
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Side-by-side comparison of the top 3 recommended varieties for your land.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Parameter</th>
                              {activeResult.recommendations.map((r) => (
                                <th key={r.rank} className="py-2.5 px-4 font-bold capitalize">
                                  #{r.rank} {r.cropName}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            <tr>
                              <td className="py-2 px-4 font-semibold text-muted-foreground">
                                Suitability Score
                              </td>
                              {activeResult.recommendations.map((r) => (
                                <td key={r.rank} className="py-2 px-4 font-bold text-primary">
                                  {r.confidencePct}%
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-semibold text-muted-foreground">
                                Water Requirement
                              </td>
                              {activeResult.recommendations.map((r) => (
                                <td key={r.rank} className="py-2 px-4">
                                  {r.waterRequirement}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-semibold text-muted-foreground">
                                Growing Cycle
                              </td>
                              {activeResult.recommendations.map((r) => (
                                <td key={r.rank} className="py-2 px-4">
                                  {r.growingDuration}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-semibold text-muted-foreground">
                                Target Season
                              </td>
                              {activeResult.recommendations.map((r) => (
                                <td key={r.rank} className="py-2 px-4">
                                  {r.suitableSeason}
                                </td>
                              ))}
                            </tr>
                            <tr>
                              <td className="py-2 px-4 font-semibold text-muted-foreground">
                                Soil Suitability
                              </td>
                              {activeResult.recommendations.map((r) => (
                                <td key={r.rank} className="py-2 px-4 text-muted-foreground text-[11px]">
                                  {r.soilRequirement}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: RECOMMENDATION HISTORY */}
        <TabsContent value="history" className="space-y-4">
          {historyQuery.isLoading && (
            <Card className="p-12">
              <LoadingState
                message="Loading Recommendation History"
                subtext="Retrieving your past agronomic match evaluations..."
              />
            </Card>
          )}

          {historyQuery.isError && (
            <ErrorState
              title="Unable to Load History"
              message="Failed to fetch previous crop recommendation records."
              onRetry={() => historyQuery.refetch()}
              isRetrying={historyQuery.isFetching}
            />
          )}

          {historyQuery.data && historyQuery.data.items.length === 0 && (
            <Card className="p-8">
              <EmptyState
                icon={History}
                title="No Prior Recommendations Found"
                description="You haven't generated any crop recommendations yet. Fill out the soil form on the 'New Crop Matching' tab to get started."
                actionLabel="Create First Recommendation"
                onAction={() => setActiveTab('recommend')}
              />
            </Card>
          )}

          {historyQuery.data && historyQuery.data.items.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyQuery.data.items.map((item) => {
                  const topCrop = item.recommendations[0]
                  return (
                    <Card
                      key={item._id}
                      hover
                      className="cursor-pointer border-border transition-all"
                      onClick={() => {
                        setActiveResult({
                          id: item._id,
                          modelVersion: item.modelVersion,
                          recommendations: item.recommendations,
                          inputs: item.inputs,
                          disclaimer: item.disclaimer,
                          dataSourceNote: '',
                          createdAt: item.createdAt,
                        })
                        setActiveTab('recommend')
                        toast.info(`Loaded recommendation for ${topCrop?.cropName || 'crop'}.`)
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {topCrop && (
                            <Badge variant="success" size="sm">
                              {topCrop.confidencePct}% Top Match
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base capitalize">
                          Top Match: {topCrop?.cropName || 'Unknown Crop'}
                        </CardTitle>
                        <CardDescription className="text-xs line-clamp-1">
                          Other options:{' '}
                          {item.recommendations
                            .slice(1)
                            .map((r) => r.cropName)
                            .join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 text-xs">
                        <div className="p-2 rounded bg-muted/40 border border-border/60 text-muted-foreground flex items-center justify-between font-mono text-[11px]">
                          <span>
                            N:{item.inputs.N} P:{item.inputs.P} K:{item.inputs.K}
                          </span>
                          <span>pH:{item.inputs.ph}</span>
                          <span>{item.inputs.temperature}°C</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-primary font-medium text-xs mt-3">
                          <span>Inspect Full Details</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* History Pagination */}
              {historyQuery.data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    Page {historyQuery.data.pagination.page} of {historyQuery.data.pagination.totalPages} (
                    {historyQuery.data.pagination.total} total records)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!historyQuery.data.pagination.hasPrevPage}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!historyQuery.data.pagination.hasNextPage}
                      onClick={() => setHistoryPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reusable Location Selector Modal from Phase 9 */}
      <LocationSelectorModal
        open={isLocationModalOpen}
        onOpenChange={setIsLocationModalOpen}
        onSelectCity={handleSelectCity}
        onRequestGps={() => {
          requestGpsLocation()
          setIsLocationModalOpen(false)
        }}
        gpsStatus={gpsStatus}
        currentCityName={currentCityDisplay}
      />
    </div>
  )
}
