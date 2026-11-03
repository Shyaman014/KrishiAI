import {
  CloudSun,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Compass,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/ToastContext'

const forecastDays = [
  { day: 'Today', date: '3 Nov', temp: '26° / 14°', rain: '10%', condition: 'Partly Sunny', icon: CloudSun, sprayOk: true },
  { day: 'Tomorrow', date: '4 Nov', temp: '27° / 15°', rain: '15%', condition: 'Clear Sky', icon: Sun, sprayOk: true },
  { day: 'Wednesday', date: '5 Nov', temp: '25° / 16°', rain: '65%', condition: 'Thunder Showers', icon: CloudRain, sprayOk: false },
  { day: 'Thursday', date: '6 Nov', temp: '23° / 13°', rain: '40%', condition: 'Scattered Rain', icon: CloudRain, sprayOk: false },
  { day: 'Friday', date: '7 Nov', temp: '24° / 12°', rain: '5%', condition: 'Sunny', icon: Sun, sprayOk: true },
  { day: 'Saturday', date: '8 Nov', temp: '25° / 13°', rain: '0%', condition: 'Clear Sky', icon: Sun, sprayOk: true },
  { day: 'Sunday', date: '9 Nov', temp: '26° / 14°', rain: '0%', condition: 'Clear Sky', icon: Sun, sprayOk: true },
]

export default function WeatherAdvisoryPage() {
  const { toast } = useToast()

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" size="sm">
              Hyper-Local Farm Weather Station
            </Badge>
            <span className="text-xs text-muted-foreground">Updated 15 mins ago</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <CloudSun className="h-7 w-7 text-warning" />
            Weather & Agronomic Advisory
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Micro-climate telemetry, rainfall probability modeling, and intelligent spray timing
            for maximum nutrient efficacy.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => toast.success('Telemetry refreshed from IMD / Farm Grid sensor.')}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Main Weather Card */}
      <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-primary/20 shadow-premium">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Primary Temp & Condition (5 Cols) */}
            <div className="md:col-span-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Farm Reading • Ludhiana, Punjab
              </span>
              <div className="flex items-center gap-4">
                <span className="text-6xl font-black text-foreground tracking-tight">26°C</span>
                <CloudSun className="h-16 w-16 text-warning" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Partly sunny with light breeze • Feels like 27°C
              </p>
              <p className="text-xs text-muted-foreground">
                Dew Point: 13°C • Solar Radiation: 620 W/m² • Evapotranspiration (ET₀): 3.2 mm/day
              </p>
            </div>

            {/* Quick Micro-Metrics (7 Cols) */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Droplets className="h-4 w-4 text-info" />
                  <span>Humidity</span>
                </div>
                <p className="text-lg font-bold text-foreground">62%</p>
                <span className="text-[10px] text-success font-medium">Optimal range</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Wind className="h-4 w-4 text-secondary" />
                  <span>Wind Speed</span>
                </div>
                <p className="text-lg font-bold text-foreground">6.5 km/h</p>
                <span className="text-[10px] text-muted-foreground">North-West (Gentle)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CloudRain className="h-4 w-4 text-primary" />
                  <span>Rainfall Chance</span>
                </div>
                <p className="text-lg font-bold text-foreground">10%</p>
                <span className="text-[10px] text-success font-medium">Clear today</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Sun className="h-4 w-4 text-warning" />
                  <span>UV Index</span>
                </div>
                <p className="text-lg font-bold text-foreground">5 (Moderate)</p>
                <span className="text-[10px] text-muted-foreground">Peak at 12:30 PM</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Barometric</span>
                </div>
                <p className="text-lg font-bold text-foreground">1014 hPa</p>
                <span className="text-[10px] text-muted-foreground">Stable atmospheric pressure</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-subtle">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="h-4 w-4 text-secondary" />
                  <span>Soil Temp</span>
                </div>
                <p className="text-lg font-bold text-foreground">19°C (at 5cm)</p>
                <span className="text-[10px] text-success font-medium">Good for roots</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agronomic Recommendations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spray Window Advisory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Chemical & Foliar Spray Guidance
              </CardTitle>
              <Badge variant="success" size="sm">Favorable Today</Badge>
            </div>
            <CardDescription>Targeted window for herbicide and nutrient absorption</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-foreground leading-relaxed">
              <strong>Today:</strong> High suitability between <strong>3:30 PM and 6:00 PM</strong>. Low wind drift risk (&lt; 8 km/h) and moderate canopy humidity.
            </p>
            <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                <strong>Attention:</strong> Severe weather front predicted for Wednesday afternoon. Complete any essential foliar applications at least 24 hours prior.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Irrigation Advisory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-5 w-5 text-info" />
                Soil Moisture & Irrigation Scheduling
              </CardTitle>
              <Badge variant="info" size="sm">Conserve Water</Badge>
            </div>
            <CardDescription>Evapotranspiration-based soil water balancing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-foreground leading-relaxed">
              <strong>Wheat Plot #4:</strong> Soil moisture is currently adequate (71% field capacity). Delay scheduled sprinkler round by 2 days due to impending mid-week precipitation.
            </p>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Expected natural recharge on Wednesday: 14mm to 22mm.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Micro-Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7-Day Agronomic Outlook</CardTitle>
          <CardDescription>Daily temperature trends, rainfall expectations, and operational spray windows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {forecastDays.map((f, idx) => {
              const Icon = f.icon
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between space-y-2 transition-all ${
                    idx === 0
                      ? 'border-primary bg-primary/5 shadow-subtle'
                      : 'border-border bg-card hover:bg-muted/30'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground">{f.day}</span>
                  <span className="text-[10px] text-muted-foreground">{f.date}</span>
                  <Icon className="h-8 w-8 text-warning my-1" />
                  <span className="text-xs font-bold text-foreground">{f.temp}</span>
                  <span className="text-[10px] text-info font-medium">Rain: {f.rain}</span>
                  <Badge
                    variant={f.sprayOk ? 'success' : 'destructive'}
                    size="sm"
                    className="w-full justify-center text-[10px]"
                  >
                    {f.sprayOk ? 'Spray OK' : 'No Spray'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

