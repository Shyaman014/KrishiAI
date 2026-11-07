import { AlertTriangle, X, Thermometer, CloudRain, Droplets, Wind } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { IWeatherAlertItem } from '@/hooks/useWeather'

interface WeatherAlertsBannerProps {
  alerts: IWeatherAlertItem[]
  onDismiss?: (alertId: string) => void
}

export function WeatherAlertsBanner({ alerts, onDismiss }: WeatherAlertsBannerProps) {
  if (!alerts || alerts.length === 0) return null

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'heavy_rain':
        return <CloudRain className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
      case 'high_temp':
        return <Thermometer className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
      case 'high_humidity':
        return <Droplets className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
      case 'strong_wind':
        return <Wind className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
    }
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
    }
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, idx) => {
        const alertId = alert._id || alert.id || String(idx)
        return (
          <div
            key={alertId}
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-subtle ${getSeverityStyle(
              alert.severity,
            )}`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.alertType)}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold">{alert.title}</h4>
                  <Badge
                    variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
                    size="sm"
                    className="capitalize text-[10px]"
                  >
                    {alert.severity} Hazard
                  </Badge>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                {alert.actionableGuidance && (
                  <p className="text-xs font-semibold pt-1 border-t border-current/10">
                    Farming Guidance: {alert.actionableGuidance}
                  </p>
                )}
              </div>
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(alertId)}
                className="h-7 w-7 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
                title="Dismiss Alert"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
