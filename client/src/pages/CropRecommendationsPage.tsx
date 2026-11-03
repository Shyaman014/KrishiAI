import { useState } from 'react'
import {
  Compass,
  Sparkles,
  TrendingUp,
  Droplet,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'

interface Recommendation {
  id: string
  crop: string
  variety: string
  suitabilityScore: number
  profitEstimate: string
  waterNeed: 'Low' | 'Medium' | 'High'
  duration: string
  soilMatch: string
  advantages: string[]
}

const sampleRecommendations: Recommendation[] = [
  {
    id: 'REC-1',
    crop: 'Mustard (Brassica juncea)',
    variety: 'Pusa Bold / NRCHB-101',
    suitabilityScore: 97,
    profitEstimate: '₹48,000 – ₹55,000 / Acre',
    waterNeed: 'Low',
    duration: '115 – 125 Days',
    soilMatch: 'Loam to Sandy Loam, pH 6.5 – 7.8',
    advantages: ['Low irrigation requirements', 'High oil content premium in local Mandis', 'Frost tolerant hybrid'],
  },
  {
    id: 'REC-2',
    crop: 'Wheat (Triticum aestivum)',
    variety: 'HD-2967 / PBW-550',
    suitabilityScore: 94,
    profitEstimate: '₹42,000 – ₹48,000 / Acre',
    waterNeed: 'Medium',
    duration: '140 – 145 Days',
    soilMatch: 'Alluvial deep soil, rich organic carbon',
    advantages: ['High market liquidity with MSP support', 'Excellent straw by-product value', 'Stripe rust resistant'],
  },
  {
    id: 'REC-3',
    crop: 'Chickpea / Desi Gram',
    variety: 'Pusa 362 / GNG 1581',
    suitabilityScore: 89,
    profitEstimate: '₹38,000 – ₹44,000 / Acre',
    waterNeed: 'Low',
    duration: '130 – 135 Days',
    soilMatch: 'Well-drained light to medium loam',
    advantages: ['Atmospheric nitrogen fixation enriches soil', 'Zero nitrogen fertilizer need', 'Strong consumer demand'],
  },
]

export default function CropRecommendationsPage() {
  const { toast } = useToast()
  const [soilType, setSoilType] = useState('alluvial')
  const [season, setSeason] = useState('rabi')
  const [waterAccess, setWaterAccess] = useState('tubewell')

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" size="sm">
              Agronomic Soil Matching AI
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-primary" />
            Crop Recommendations & Planning
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Select your field profile to receive algorithmically matched crop varieties tailored to
            soil nutrients, season, and market profit potential.
          </p>
        </div>

        <Button
          onClick={() => toast.success('Recalculated agronomic recommendations based on updated soil parameters.')}
          leftIcon={<Sparkles className="h-4 w-4" />}
          className="shadow-premium"
        >
          Compute Recommendations
        </Button>
      </div>

      {/* Parameter Filter Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Soil Classification
              </label>
              <Select value={soilType} onValueChange={setSoilType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Soil Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alluvial">Alluvial Deep Loam</SelectItem>
                  <SelectItem value="black">Black Cotton Soil (Regur)</SelectItem>
                  <SelectItem value="sandy">Sandy Loam</SelectItem>
                  <SelectItem value="clay">Clayey Heavy Soil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Target Crop Season
              </label>
              <Select value={season} onValueChange={setSeason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rabi">Rabi (Winter • Oct – Apr)</SelectItem>
                  <SelectItem value="kharif">Kharif (Monsoon • Jun – Nov)</SelectItem>
                  <SelectItem value="zaid">Zaid (Summer • Mar – Jun)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Irrigation Infrastructure
              </label>
              <Select value={waterAccess} onValueChange={setWaterAccess}>
                <SelectTrigger>
                  <SelectValue placeholder="Water Access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tubewell">Deep Tube-well / Borewell</SelectItem>
                  <SelectItem value="canal">Perennial Canal System</SelectItem>
                  <SelectItem value="rainfed">Rainfed / Semi-Arid</SelectItem>
                  <SelectItem value="drip">Drip Irrigation System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Cards */}
      <div className="space-y-6">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Recommended Crops for Your Field Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleRecommendations.map((rec) => (
            <Card key={rec.id} hover className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="success" size="lg" dot>
                    {rec.suitabilityScore}% Match
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{rec.id}</span>
                </div>
                <CardTitle className="text-lg">{rec.crop}</CardTitle>
                <CardDescription className="text-xs font-medium text-foreground/85">
                  {rec.variety}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Profit & Water Specs */}
                <div className="p-3 rounded-xl bg-muted/40 space-y-2 text-xs border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-success" /> Profit Potential:
                    </span>
                    <span className="font-bold text-success">{rec.profitEstimate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Droplet className="h-3.5 w-3.5 text-info" /> Water Need:
                    </span>
                    <span className="font-semibold">{rec.waterNeed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-secondary" /> Duration:
                    </span>
                    <span className="font-semibold">{rec.duration}</span>
                  </div>
                </div>

                {/* Advantages */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Key Agronomic Advantages:
                  </span>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {rec.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <div className="p-4 pt-0 border-t border-border/50 mt-2">
                <Button
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => toast.info(`Detailed crop guide opened for ${rec.crop}.`)}
                >
                  View Agronomic Package of Practices <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
