import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertTriangle,
  Trash2,
  Share2,
  Layers,
} from 'lucide-react'
import apiClient from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { DiseaseAdvisoryReport, ExplanationPayload } from '@/components/scans/DiseaseAdvisoryReport'
import {
  TreatmentRecommendationPanel,
  RecommendationPayload,
  RecommendationFeedbackSubmit,
} from '@/components/scans/TreatmentRecommendationPanel'
import { useToast } from '@/contexts/ToastContext'

interface ScanDetailData {
  id: string
  cropName: string
  cropCategory?: string
  growthStage?: string
  fieldLocation?: string
  imageUrl: string
  diseaseName: string
  severity: 'healthy' | 'moderate' | 'high'
  confidence: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  remediation?: string
  additionalObservations?: string
  predictedCrop?: string
  predictedDisease?: string
  isHealthy?: boolean
  topPredictions?: Array<{
    classId: number
    rawClass: string
    crop: string
    disease: string
    isHealthy: boolean
    severity: string
    confidence: number
  }>
  modelVersion?: string
  inferenceDurationMs?: number
  analyzedAt?: string
  createdAt: string
  explanation?: ExplanationPayload
}

export default function ScanDetailPage() {
  const { scanId } = useParams<{ scanId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [explanationData, setExplanationData] = useState<ExplanationPayload | null>(null)

  // Treatment recommendation state
  const [recommendation, setRecommendation] = useState<RecommendationPayload | null>(null)
  const [hasRecommendation, setHasRecommendation] = useState(false)
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [recommendationLanguage, setRecommendationLanguage] = useState<'en' | 'hi' | 'as'>('en')

  // Fetch scan details
  const {
    data: scan,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ScanDetailData>({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/scans/${scanId}`)
      const s = res.data.data.scan
      // Load explanation if present
      if (s.explanation) {
        setExplanationData(s.explanation)
      }
      return s
    },
    enabled: Boolean(scanId),
  })

  // Fetch treatment recommendations for completed scans
  useQuery({
    queryKey: ['scan-recommendations', scanId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/api/scans/${scanId}/recommendations`)
        if (res.data?.success && res.data?.data) {
          setHasRecommendation(res.data.data.hasRecommendation)
          setRecommendation(res.data.data.recommendation)
        }
        return res.data
      } catch {
        return null
      }
    },
    enabled: Boolean(scanId && scan?.status === 'completed'),
  })

  // Delete scan mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/api/scans/${scanId}`)
    },
    onSuccess: () => {
      toast.success('Scan record deleted successfully.')
      void queryClient.invalidateQueries({ queryKey: ['scans'] })
      navigate('/app/history')
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      toast.error(axiosErr.response?.data?.message || 'Failed to delete scan.')
    },
  })

  // Generate explanation handler
  const handleGenerateExplanation = async (language: 'en' | 'hi' | 'as') => {
    if (!scanId) return
    setIsGeneratingExplanation(true)
    try {
      const res = await apiClient.post(`/api/scans/${scanId}/generate-explanation`, {
        language,
        regenerate: true,
      })
      if (res.data.success && res.data.data.explanation) {
        setExplanationData(res.data.data.explanation)
        toast.success('AI agronomic advisory generated.')
        void refetch()
      }
    } catch {
      toast.error('Failed to generate AI advisory. Please try again.')
    } finally {
      setIsGeneratingExplanation(false)
    }
  }

  // Generate treatment recommendation handler
  const handleGenerateRecommendation = async (language: 'en' | 'hi' | 'as') => {
    if (!scanId) return
    setIsGeneratingRecommendation(true)
    setRecommendationError(null)
    try {
      const res = await apiClient.post(`/api/scans/${scanId}/recommendations/generate`, {
        language,
        regenerate: hasRecommendation,
      })
      if (res.data.success && res.data.data.recommendation) {
        setRecommendation(res.data.data.recommendation)
        setHasRecommendation(true)
        setRecommendationLanguage(language)
        toast.success(
          hasRecommendation
            ? 'Fresh treatment recommendation generated.'
            : 'Treatment recommendation ready.',
        )
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      const msg =
        axiosErr.response?.data?.message || 'Failed to generate treatment recommendations.'
      setRecommendationError(msg)
      toast.error(msg)
    } finally {
      setIsGeneratingRecommendation(false)
    }
  }

  // Handle recommendation feedback
  const handleFeedbackSubmit = async (
    recommendationId: string,
    feedback: RecommendationFeedbackSubmit,
  ) => {
    setIsFeedbackSubmitting(true)
    try {
      await apiClient.post(`/api/recommendations/${recommendationId}/feedback`, feedback)
      toast.success('Thank you! Your feedback helps calibrate agricultural guidance.')
      setRecommendation((prev) =>
        prev ? { ...prev, feedback: { ...feedback, submittedAt: new Date().toISOString() } } : null,
      )
    } catch {
      toast.error('Could not save feedback. Please try again.')
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-72 rounded-2xl md:col-span-1" />
          <Skeleton className="h-72 rounded-2xl md:col-span-2" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (isError || !scan) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Scan Record Not Found</h2>
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message || 'The requested scan record does not exist or has been removed.'}
        </p>
        <Button onClick={() => navigate('/app/history')} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Scan History
        </Button>
      </div>
    )
  }

  const confidencePct = Math.round(scan.confidence * 100)
  const isInconclusive = scan.status === 'completed' && scan.confidence > 0 && scan.confidence < 0.6

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/history')}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground pl-0 pr-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Scan History
            </Button>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-xs font-mono text-muted-foreground">#{scan.id.slice(-8)}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{scan.cropName}</h1>
            {scan.status === 'completed' ? (
              isInconclusive ? (
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs">
                  Inconclusive Confidence
                </Badge>
              ) : (
                <Badge variant="default" className="bg-emerald-500 text-white text-xs">
                  Analysis Completed
                </Badge>
              )
            ) : scan.status === 'pending' ? (
              <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs">
                Pending Analysis
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Analysis Failed
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Report URL copied to clipboard.')
            }}
            className="gap-1.5 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Scan
          </Button>
        </div>
      </div>

      {/* Main Grid: Photograph & Diagnosis Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Leaf Photograph */}
        <Card className="md:col-span-1 border-border overflow-hidden">
          <div className="aspect-square w-full relative bg-muted/40">
            <img
              src={scan.imageUrl}
              alt={scan.cropName}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(scan.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {scan.fieldLocation && (
                <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {scan.fieldLocation}
                </span>
              )}
            </div>

            {scan.growthStage && (
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Growth Stage</span>
                <span className="font-medium text-foreground capitalize">{scan.growthStage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Columns: Diagnosis & AI Confidence */}
        <Card className="md:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold text-primary">
              AI Vision Model Evaluation
            </CardDescription>
            <CardTitle className="text-xl font-bold text-foreground">
              {scan.diseaseName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Confidence & Severity Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Confidence Score</span>
                  <span className="font-bold text-foreground">{confidencePct}%</span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      confidencePct >= 80
                        ? 'bg-emerald-500'
                        : confidencePct >= 60
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(5, confidencePct)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {confidencePct >= 80
                    ? 'High model certainty based on leaf pattern match.'
                    : confidencePct >= 60
                    ? 'Moderate certainty. Review symptom details carefully.'
                    : 'Inconclusive confidence. Consider re-scanning with focused lighting.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Severity Classification</span>
                  <span
                    className={`font-bold capitalize ${
                      scan.severity === 'healthy'
                        ? 'text-emerald-500'
                        : scan.severity === 'moderate'
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {scan.severity}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {['healthy', 'moderate', 'high'].map((sev) => (
                    <div
                      key={sev}
                      className={`h-2 flex-1 rounded-full ${
                        scan.severity === sev
                          ? sev === 'healthy'
                            ? 'bg-emerald-500'
                            : sev === 'moderate'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {scan.severity === 'healthy'
                    ? 'No pathogen symptoms detected.'
                    : scan.severity === 'moderate'
                    ? 'Foliar lesions present. Prompt remedy recommended.'
                    : 'Advanced symptoms. Requires immediate intervention.'}
                </p>
              </div>
            </div>

            {/* Top Predictions Breakdown */}
            {scan.topPredictions && scan.topPredictions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Candidate Predictions
                </h4>
                <div className="space-y-2">
                  {scan.topPredictions.slice(0, 3).map((pred, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono">#{i + 1}</span>
                        <span className="font-medium text-foreground">{pred.disease}</span>
                        <span className="text-[11px] text-muted-foreground">({pred.crop})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">
                          {Math.round(pred.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Metadata */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border">
              <span>Model: {scan.modelVersion || 'KrishiAI EfficientNet-B4 v2.1'}</span>
              {scan.inferenceDurationMs && <span>Processing time: {scan.inferenceDurationMs}ms</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Explanation Advisory Component */}
      <DiseaseAdvisoryReport
        cropName={scan.cropName}
        diseaseName={scan.diseaseName}
        confidence={scan.confidence}
        isHealthy={scan.isHealthy}
        status={scan.status}
        imageUrl={scan.imageUrl}
        modelVersion={scan.modelVersion}
        inferenceDurationMs={scan.inferenceDurationMs}
        explanation={explanationData || scan.explanation || null}
        onGenerateExplanation={handleGenerateExplanation}
        isGenerating={isGeneratingExplanation}
      />

      {/* Treatment Recommendation Panel */}
      <TreatmentRecommendationPanel
        recommendation={recommendation}
        hasRecommendation={hasRecommendation}
        isGenerating={isGeneratingRecommendation}
        isGeneratingError={recommendationError}
        onGenerate={handleGenerateRecommendation}
        onFeedbackSubmit={handleFeedbackSubmit}
        isFeedbackSubmitting={isFeedbackSubmitting}
        scanStatus={scan.status}
        confidence={scan.confidence}
        isHealthy={scan.isHealthy}
        language={recommendationLanguage}
        onLanguageChange={setRecommendationLanguage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Scan Record?</DialogTitle>
            <DialogDescription>
              This will permanently delete this scan for{' '}
              <strong className="text-foreground">{scan.cropName}</strong> and any associated AI
              reports. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
