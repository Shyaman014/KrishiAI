import { useState } from 'react'
import {
  Sprout,
  Plus,
  Calendar,
  Layers,
  Search,
  Droplet,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { useToast } from '@/contexts/ToastContext'

interface CropPlot {
  id: string
  name: string
  variety: string
  area: string
  sowingDate: string
  harvestEstimate: string
  stage: string
  health: 'optimal' | 'attention' | 'critical'
  healthScore: number
  nextActivity: string
}

const initialCrops: CropPlot[] = [
  {
    id: 'CRP-101',
    name: 'Wheat',
    variety: 'PBW 343 (High Yield)',
    area: '12.0 Acres',
    sowingDate: '25 Oct 2026',
    harvestEstimate: 'March 2027',
    stage: 'Crown Root / Tillering',
    health: 'optimal',
    healthScore: 94,
    nextActivity: 'Second irrigation & Urea top-dressing in 3 days',
  },
  {
    id: 'CRP-102',
    name: 'Mustard',
    variety: 'Pusa Bold (00 Double Low)',
    area: '8.5 Acres',
    sowingDate: '10 Oct 2026',
    harvestEstimate: 'Feb 2027',
    stage: 'Flowering & Pod Formation',
    health: 'optimal',
    healthScore: 98,
    nextActivity: 'Monitor for aphid infestation during overcast days',
  },
  {
    id: 'CRP-103',
    name: 'Potato',
    variety: 'Kufri Jyoti',
    area: '4.0 Acres',
    sowingDate: '02 Oct 2026',
    harvestEstimate: 'Jan 2027',
    stage: 'Tuber Bulking',
    health: 'attention',
    healthScore: 86,
    nextActivity: 'Fungicide preventive spray for Early Blight',
  },
]

export default function MyCropsPage() {
  const { toast } = useToast()
  const [crops, setCrops] = useState<CropPlot[]>(initialCrops)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newCropName, setNewCropName] = useState('')
  const [newVariety, setNewVariety] = useState('')
  const [newArea, setNewArea] = useState('')

  const filteredCrops = crops.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.variety.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddCrop = () => {
    if (!newCropName || !newArea) {
      toast.error('Please enter crop name and acreage.')
      return
    }

    const newPlot: CropPlot = {
      id: `CRP-${Math.floor(100 + Math.random() * 900)}`,
      name: newCropName,
      variety: newVariety || 'Standard Hybrid',
      area: `${newArea} Acres`,
      sowingDate: 'Today',
      harvestEstimate: 'Spring 2027',
      stage: 'Germination & Emergence',
      health: 'optimal',
      healthScore: 100,
      nextActivity: 'Soil moisture inspection in 48 hours',
    }

    setCrops([newPlot, ...crops])
    setIsAddModalOpen(false)
    setNewCropName('')
    setNewVariety('')
    setNewArea('')
    toast.success(`Successfully registered ${newPlot.name} plot (${newPlot.area}).`)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="success" size="sm" dot>
              Active Season: Rabi 2026
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Sprout className="h-7 w-7 text-primary" />
            My Crops & Field Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Track growth stages, irrigation schedules, and individual field health metrics across all your farm plots.
          </p>
        </div>

        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="shadow-premium"
        >
          Register New Crop Plot
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search crops or varieties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Crops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCrops.map((crop) => (
          <Card key={crop.id} hover className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {crop.id}
                  </span>
                  <CardTitle className="text-lg mt-0.5">{crop.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-foreground/80 mt-0.5">
                    {crop.variety}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    crop.health === 'optimal'
                      ? 'success'
                      : crop.health === 'attention'
                      ? 'warning'
                      : 'destructive'
                  }
                  dot
                >
                  {crop.healthScore}% Vitality
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Plot Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{crop.area}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sown {crop.sowingDate}</span>
                </div>
              </div>

              {/* Growth Stage */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-muted-foreground">Current Phase:</span>
                  <span className="font-semibold text-foreground">{crop.stage}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${crop.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Next Action */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs space-y-1">
                <span className="font-semibold text-primary block flex items-center gap-1">
                  <Droplet className="h-3.5 w-3.5" /> Next Field Task
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {crop.nextActivity}
                </p>
              </div>
            </CardContent>

            <div className="p-4 pt-0 border-t border-border/50 mt-2 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Est. Harvest: {crop.harvestEstimate}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => toast.info(`Plot logs opened for ${crop.name}.`)}
              >
                Log Actions <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Register Crop Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register Crop Plot</DialogTitle>
            <DialogDescription>
              Add a new cultivation plot to track seasonal growth, irrigation, and foliar treatments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Input
              label="Crop Species"
              placeholder="e.g. Wheat, Gram, Barley, Cotton"
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
              required
            />
            <Input
              label="Seed Variety / Hybrid"
              placeholder="e.g. PBW 343, HD 2967"
              value={newVariety}
              onChange={(e) => setNewVariety(e.target.value)}
            />
            <Input
              label="Cultivated Area (Acres)"
              type="number"
              placeholder="e.g. 5.5"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCrop}>
              Register Plot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

