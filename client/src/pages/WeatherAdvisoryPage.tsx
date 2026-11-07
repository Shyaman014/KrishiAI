import { useState } from 'react'
import {
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  MapPin,
  RefreshCw,
  Navigation,
  Sparkles,
  Sunrise,
  Sunset,
  Gauge,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useWeather } from '@/hooks/useWeather'
import { WeatherCharts } from '@/components/weather/WeatherCharts'
import { WeatherAlertsBanner } from '@/components/weather/WeatherAlertsBanner'
import { SprayWindowCard } from '@/components/weather/SprayWindowCard'
import { IrrigationAdvisoryCard } from '@/components/weather/IrrigationAdvisoryCard'
import { LocationSelectorModal } from '@/components/weather/LocationSelectorModal'

export default function WeatherAdvisoryPage() {
  const {
    current,
    forecast,
    advisory,
    isLoading,
    isError,
    error,
    refetch,
    gpsStatus,
    requestGpsLocation,
    setManualLocation,
    language,
    setLanguage,
    dismissAlert,
  } = useWeather()

  const [locationModalOpen, setLocationModalOpen] = useState(false)

  // Format Sunrise / Sunset from epoch
  const formatTime = (epochSeconds?: number) => {
    if (!epochSeconds) return '--:--'
    return new Date(epochSeconds * 1000).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* ===================== 1. Header & Controls ===================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <button
              onClick={() => setLocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>{current?.location.name || 'Detecting Location...'}</span>
              <span className="text-[10px] text-muted-foreground underline ml-1">Change</span>
            </button>

            {gpsStatus === 'granted' && (
              <Badge variant="success" size="sm" className="text-[10px]">
                <Navigation className="h-3 w-3 mr-1" />
                Live GPS Active
              </Badge>
            )}

            <span className="text-xs text-muted-foreground">
              {current?.current.dt
                ? `Telemetry: ${new Date(current.current.dt * 1000).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Micro-climate Station'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <CloudSun className="h-7 w-7 text-amber-500" />
            Weather & Agronomic Advisory
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Real-time farm telemetry, 5-day predictive forecasts, and intelligent spray/irrigation windows.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Switcher */}
          <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setLanguage('en')}
            >
              EN
            </Button>
            <Button
              variant={language === 'hi' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setLanguage('hi')}
            >
              हिन्दी
            </Button>
            <Button
              variant={language === 'as' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setLanguage('as')}
            >
              অসমীয়া
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={requestGpsLocation}
            isLoading={gpsStatus === 'requesting'}
            leftIcon={<Navigation className="h-3.5 w-3.5" />}
          >
            GPS
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ===================== 2. Active Severe Weather Alerts ===================== */}
      {advisory?.alerts && advisory.alerts.length > 0 && (
        <WeatherAlertsBanner alerts={advisory.alerts} onDismiss={dismissAlert} />
      )}

      {/* ===================== 3. Loading & Error States ===================== */}
      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5 text-center p-8 space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Weather Telemetry Unavailable</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {error instanceof Error ? error.message : 'Unable to load real-time micro-climate data. Please verify network or select another district.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry Connection
          </Button>
        </Card>
      )}

      {/* ===================== 4. Loaded Weather Interface ===================== */}
      {!isLoading && !isError && current && forecast && advisory && (
        <>
          {/* Main Weather Hero Card */}
          <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 shadow-premium">
            <CardContent className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Primary Temp & Condition (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Current Telemetry • {current.location.name}
                    </span>
                    {current.source && (
                      <Badge variant="outline" size="sm" className="text-[10px] capitalize">
                        {current.source}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-6xl sm:text-7xl font-black text-foreground tracking-tight">
                      {current.current.temp}°C
                    </span>
                    <CloudSun className="h-16 w-16 text-amber-500 animate-pulse shrink-0" />
                  </div>

                  <p className="text-sm font-semibold text-foreground capitalize">
                    {current.current.description} • Feels like {current.current.feelsLike}°C
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Day Range: {current.current.tempMin}°C – {current.current.tempMax}°C • Barometric: {current.current.pressure} hPa
                  </p>
                </div>

                {/* Quick Micro-Metrics (7 Cols) */}
                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Humidity */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span>Humidity</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{current.current.humidity}%</p>
                    <span className="text-[10px] text-muted-foreground">
                      {current.current.humidity > 80 ? 'High (Blight risk)' : current.current.humidity < 40 ? 'Dry' : 'Optimal'}
                    </span>
                  </div>

                  {/* Wind Speed */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Wind className="h-4 w-4 text-teal-500" />
                      <span>Wind Speed</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{current.current.windSpeed} km/h</p>
                    <span className="text-[10px] text-muted-foreground">
                      {current.current.windSpeed < 12 ? 'Calm (Low drift)' : 'Breezy (Drift risk)'}
                    </span>
                  </div>

                  {/* Rainfall Chance */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <CloudRain className="h-4 w-4 text-blue-500" />
                      <span>Precipitation</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {forecast.daily[0]?.maxPop ?? 0}%
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {current.current.rainfall1h > 0 ? `${current.current.rainfall1h} mm rain` : 'No rain recorded'}
                    </span>
                  </div>

                  {/* Barometric Pressure */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Gauge className="h-4 w-4 text-indigo-500" />
                      <span>Atmospheric</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{current.current.pressure} hPa</p>
                    <span className="text-[10px] text-muted-foreground">Stable pressure</span>
                  </div>

                  {/* Sunrise */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Sunrise className="h-4 w-4 text-amber-500" />
                      <span>Sunrise</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatTime(current.current.sunrise)}</p>
                    <span className="text-[10px] text-muted-foreground">Dawn window</span>
                  </div>

                  {/* Sunset */}
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                      <Sunset className="h-4 w-4 text-orange-500" />
                      <span>Sunset</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatTime(current.current.sunset)}</p>
                    <span className="text-[10px] text-muted-foreground">Dusk window</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===================== 5. Agronomic Advisory Row ===================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SprayWindowCard sprayWindow={advisory.sprayWindow} />
            <IrrigationAdvisoryCard irrigation={advisory.irrigation} />
          </div>

          {/* ===================== 6. Field Activity Suitability Grid ===================== */}
          <Card className="shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Field Operations Suitability Index</CardTitle>
              <CardDescription>
                Automated agricultural operational windows calculated from weather criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Spraying */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Foliar Spraying</span>
                    {advisory.fieldActivities.spraying.suitable ? (
                      <Badge variant="success" size="sm">Favorable</Badge>
                    ) : (
                      <Badge variant="destructive" size="sm">Unfavorable</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {advisory.fieldActivities.spraying.note}
                  </p>
                </div>

                {/* Irrigation */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Irrigation</span>
                    {advisory.fieldActivities.irrigation.suitable ? (
                      <Badge variant="success" size="sm">Favorable</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Halt / Delay</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {advisory.fieldActivities.irrigation.note}
                  </p>
                </div>

                {/* Harvesting */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Harvesting</span>
                    {advisory.fieldActivities.harvesting.suitable ? (
                      <Badge variant="success" size="sm">Favorable</Badge>
                    ) : (
                      <Badge variant="destructive" size="sm">Delay</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {advisory.fieldActivities.harvesting.note}
                  </p>
                </div>

                {/* Sowing */}
                <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Sowing / Planting</span>
                    {advisory.fieldActivities.sowing.suitable ? (
                      <Badge variant="success" size="sm">Favorable</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Delay</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {advisory.fieldActivities.sowing.note}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===================== 7. Recharts Visualizations ===================== */}
          <WeatherCharts hourly={forecast.hourly} daily={forecast.daily} />

          {/* ===================== 8. 7-Day Agronomic Daily Forecast ===================== */}
          <Card className="shadow-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">7-Day Agricultural Outlook</CardTitle>
              <CardDescription>
                Day-by-day temperature extremes, rain probability, and spray eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                {forecast.daily.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between space-y-2 transition-all ${
                      idx === 0
                        ? 'border-primary bg-primary/5 shadow-subtle'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">{f.dayName}</span>
                    <span className="text-[10px] text-muted-foreground">{f.date}</span>
                    <CloudSun className="h-8 w-8 text-amber-500 my-1" />
                    <span className="text-xs font-bold text-foreground">
                      {f.tempMax}° / {f.tempMin}°
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      Rain: {f.maxPop}%
                    </span>
                    <Badge
                      variant={f.sprayOk ? 'success' : 'destructive'}
                      size="sm"
                      className="w-full justify-center text-[10px]"
                    >
                      {f.sprayOk ? 'Spray OK' : 'No Spray'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ===================== 9. AI Agronomic Synthesis Banner ===================== */}
          {advisory.explanationSummary && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground">
                  AI Micro-Climate Synthesis ({language.toUpperCase()})
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {advisory.explanationSummary}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Location Selector Modal */}
      <LocationSelectorModal
        open={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        onSelectCity={setManualLocation}
        onRequestGps={requestGpsLocation}
        gpsStatus={gpsStatus}
        currentCityName={current?.location.name}
      />
    </div>
  )
}
