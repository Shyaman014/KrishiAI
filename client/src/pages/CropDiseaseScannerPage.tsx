import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ScanLine,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/contexts/ToastContext'

interface DemoPreset {
  id: string
  name: string
  crop: string
  disease: string
  confidence: number
  severity: 'healthy' | 'moderate' | 'high'
  symptoms: string
  treatment: string
  organicTreatment: string
}

const presets: DemoPreset[] = [
  {
    id: 'p1',
    name: 'Sample 1: Wheat Leaf Rust',
    crop: 'Wheat (Triticum aestivum)',
    disease: 'Puccinia triticina (Brown Rust)',
    confidence: 96.4,
    severity: 'moderate',
    symptoms: 'Small, circular or oval orange-brown pustules scattered across the upper leaf lamina.',
    treatment: 'Apply Tebuconazole 25.9% EC @ 1ml/L or Propiconazole 25% EC at onset.',
    organicTreatment: 'Spray fermented butter milk (Lassi) solution @ 50ml/L or Neem oil 1500 ppm.',
  },
  {
    id: 'p2',
    name: 'Sample 2: Tomato Early Blight',
    crop: 'Tomato (Solanum lycopersicum)',
    disease: 'Alternaria solani',
    confidence: 93.8,
    severity: 'high',
    symptoms: 'Concentric dark rings (target-board effect) on older leaves progressing upward.',
    treatment: 'Apply Chlorothalonil 75% WP @ 2g/L or Mancozeb 75% WP @ 2.5g/L.',
    organicTreatment: 'Trichoderma viride bio-fungicide foliar spray @ 5g/L; remove lower affected leaves.',
  },
  {
    id: 'p3',
    name: 'Sample 3: Healthy Mustard Leaf',
    crop: 'Mustard (Brassica juncea)',
    disease: 'No Disease Detected (Healthy Foliage)',
    confidence: 98.9,
    severity: 'healthy',
    symptoms: 'Uniform dark-green lamina, intact stomatal coverage, robust vascular structure.',
    treatment: 'No chemical intervention required. Continue scheduled nutrient monitoring.',
    organicTreatment: 'Maintain preventive neem cake basal application.',
  },
]

export default function CropDiseaseScannerPage() {
  const { toast } = useToast()
  const [selectedPreset, setSelectedPreset] = useState<DemoPreset>(presets[0])
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const handleSimulateScan = (preset: DemoPreset) => {
    setIsAnalyzing(true)
    setSelectedPreset(preset)
    setTimeout(() => {
      setIsAnalyzing(false)
      toast.success(`Analysis completed for ${preset.crop} with ${preset.confidence}% confidence!`)
    }, 800)
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" size="sm">
              Computer Vision Diagnostic
            </Badge>
            <span className="text-xs text-muted-foreground">Model v2.4 (Phase 2 UI Demo)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <ScanLine className="h-7 w-7 text-primary" />
            Crop Disease Scanner
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Upload or select leaf photos to diagnose crop pathologies with hyper-local treatment
            recommendations.
          </p>
        </div>

        <Button
          variant="outline"
          leftIcon={<Camera className="h-4 w-4 text-primary" />}
          onClick={() => toast.info('Camera preview available on mobile field devices in Phase 3.')}
        >
          Open Field Camera
        </Button>
      </div>

      {/* Main Grid: Upload Area on Left, Diagnostic Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload / Preset Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Drag & Drop Simulation Card */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Drop Leaf Specimen Image Here
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mb-5 leading-relaxed">
                Supports JPG, PNG or WEBP formats up to 10MB. Ensure natural light without flash.
              </p>
              <Button
                size="sm"
                onClick={() => toast.info('Select one of the sample presets below to test the instant diagnostic.')}
              >
                Browse Image Files
              </Button>
            </CardContent>
          </Card>

          {/* Sample Demonstration Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Test With Sample Agricultural Presets
              </CardTitle>
              <CardDescription className="text-xs">
                Click any specimen below to simulate instant ML inferencing:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedPreset.id === p.id
                      ? 'border-primary bg-primary/5 shadow-subtle'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                        p.severity === 'healthy'
                          ? 'bg-success/15 text-success'
                          : p.severity === 'moderate'
                          ? 'bg-warning/15 text-warning'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {p.crop.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.disease}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis Results Display (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Diagnostic Report
                  </span>
                  <CardTitle className="text-xl mt-0.5">{selectedPreset.crop}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedPreset.severity === 'healthy'
                        ? 'success'
                        : selectedPreset.severity === 'moderate'
                        ? 'warning'
                        : 'destructive'
                    }
                    size="lg"
                    dot
                  >
                    {selectedPreset.disease}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 flex-1">
              {isAnalyzing ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-semibold">Running ML Segmentation & Pathology Analysis...</p>
                  <p className="text-xs text-muted-foreground">Comparing foliage against 38 plant disease models</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Confidence Bar */}
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Pathology Confidence Rating
                      </span>
                      <span className="font-extrabold text-primary text-sm">
                        {selectedPreset.confidence}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${selectedPreset.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Symptoms & Visual Markers */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-primary" />
                      Visual Symptom Markers
                    </h4>
                    <p className="text-xs text-foreground/90 leading-relaxed bg-card p-3.5 rounded-xl border border-border">
                      {selectedPreset.symptoms}
                    </p>
                  </div>

                  {/* Recommended Treatments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Chemical / Standard Action */}
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                      <span className="text-[11px] font-bold text-foreground uppercase tracking-wide flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        Chemical Intervention
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedPreset.treatment}
                      </p>
                    </div>

                    {/* Organic / Biological Alternative */}
                    <div className="p-4 rounded-2xl bg-success/5 border border-success/20 space-y-1.5">
                      <span className="text-[11px] font-bold text-success uppercase tracking-wide flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        Bio-Agronomic Alternative
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedPreset.organicTreatment}
                      </p>
                    </div>
                  </div>

                  {/* Spray Caution Disclaimer */}
                  <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      <strong>Agronomist Notice:</strong> Wear protective equipment when handling
                      plant chemicals. Always observe minimum harvest intervals (PHI) before marketing crops.
                    </p>
                  </div>
                </motion.div>
              )}
            </CardContent>

            <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Preserve record for field history audit
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info('Scan exported as PDF summary.')}
                >
                  Export PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast.success('Diagnosis and treatment plan logged to field records.')}
                >
                  Save to Field Log
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

