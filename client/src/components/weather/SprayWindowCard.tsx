import { CheckCircle2, AlertTriangle, XCircle, Clock, Wind, CloudRain } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ISprayWindowGuidance } from '@/hooks/useWeather'

interface SprayWindowCardProps {
  sprayWindow: ISprayWindowGuidance
}

export function SprayWindowCard({ sprayWindow }: SprayWindowCardProps) {
  const getBadgeVariant = (
    status: string,
  ): 'success' | 'default' | 'warning' | 'destructive' | 'outline' => {
    switch (status) {
      case 'optimal':
        return 'success'
      case 'acceptable':
        return 'default'
      case 'unfavorable':
        return 'warning'
      case 'hazardous':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      case 'acceptable':
        return <CheckCircle2 className="h-5 w-5 text-primary" />
      case 'unfavorable':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      case 'hazardous':
        return <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
      default:
        return <CheckCircle2 className="h-5 w-5 text-primary" />
    }
  }

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getStatusIcon(sprayWindow.status)}
            Foliar Spray & Chemical Timing
          </CardTitle>
          <Badge variant={getBadgeVariant(sprayWindow.status)} size="sm">
            {sprayWindow.statusLabel}
          </Badge>
        </div>
        <CardDescription>
          Minimizes pesticide drift, wash-off, and evaporation losses
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs">
        {/* Recommended Hours */}
        <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Optimal Hours:</span>
          </div>
          <span className="font-bold text-foreground">{sprayWindow.recommendedHours}</span>
        </div>

        {/* Telemetry checks */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wind className="h-3.5 w-3.5" />
              <span>Wind Speed</span>
            </div>
            <strong className="text-foreground">{sprayWindow.windSpeedKmH} km/h</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CloudRain className="h-3.5 w-3.5" />
              <span>12h Rain Risk</span>
            </div>
            <strong className="text-foreground">{sprayWindow.rainProbabilityNext12h}%</strong>
          </div>
        </div>

        {/* Guidance Text */}
        <p className="text-foreground leading-relaxed">{sprayWindow.guidanceText}</p>

        {/* Risk factors if any */}
        {sprayWindow.riskFactors.length > 0 && (
          <div className="space-y-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
            <span className="font-bold block">Environmental Risks Detected:</span>
            <ul className="list-disc list-inside space-y-0.5">
              {sprayWindow.riskFactors.map((rf, idx) => (
                <li key={idx}>{rf}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
