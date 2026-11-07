import { Droplets, Calendar, CloudRain } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { IIrrigationAdvisory } from '@/hooks/useWeather'

interface IrrigationAdvisoryCardProps {
  irrigation: IIrrigationAdvisory
}

export function IrrigationAdvisoryCard({ irrigation }: IrrigationAdvisoryCardProps) {
  const getBadgeVariant = (
    action: string,
  ): 'info' | 'destructive' | 'warning' | 'success' => {
    switch (action) {
      case 'delay':
        return 'info'
      case 'halt':
        return 'destructive'
      case 'increase':
        return 'warning'
      default:
        return 'success'
    }
  }

  return (
    <Card className="shadow-subtle">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            Soil Moisture & Irrigation Scheduling
          </CardTitle>
          <Badge variant={getBadgeVariant(irrigation.action)} size="sm">
            {irrigation.statusLabel}
          </Badge>
        </div>
        <CardDescription>
          Evapotranspiration-based soil water balancing and conservation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CloudRain className="h-3.5 w-3.5 text-blue-500" />
              <span>Rain next 24h</span>
            </div>
            <strong className="text-foreground">{irrigation.expectedRainfall24hMm} mm</strong>
          </div>

          <div className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Rain next 48h</span>
            </div>
            <strong className="text-foreground">{irrigation.expectedRainfall48hMm} mm</strong>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between">
          <span className="text-muted-foreground">Canopy / Soil Moisture Status:</span>
          <span className="font-bold text-foreground">{irrigation.soilMoistureStatus}</span>
        </div>

        <p className="text-foreground leading-relaxed">{irrigation.recommendation}</p>
      </CardContent>
    </Card>
  )
}
