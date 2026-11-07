import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  History,
  Search,
  ScanLine,
  Eye,
  Trash2,
  Clock,
  Sprout,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react'
import apiClient from '@/lib/api'
import { DiseaseAdvisoryReport, ExplanationPayload } from '@/components/scans/DiseaseAdvisoryReport'
import {
  TreatmentRecommendationPanel,
  RecommendationPayload,
  RecommendationFeedbackSubmit,
} from '@/components/scans/TreatmentRecommendationPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog'
import { useToast } from '@/contexts/ToastContext'

interface ScanItem {
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
  createdAt: string
  predictedCrop?: string
  predictedDisease?: string
  isHealthy?: boolean
  modelVersion?: string
  inferenceDurationMs?: number
  topPredictions?: Array<{
    classId: number
    rawClass: string
    crop: string
    disease: string
    isHealthy: boolean
    severity: string
    confidence: number
  }>
  explanation?: ExplanationPayload
}

interface ScansResponse {
  scans: ScanItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ScanHistoryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedScan, setSelectedScan] = useState<ScanItem | null>(null)
  const [page, setPage] = useState(1)
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [showFullAdvisory, setShowFullAdvisory] = useState(false)

  // Phase 8: Recommendations state
  const [recommendation, setRecommendation] = useState<RecommendationPayload | null>(null)
  const [hasRecommendation, setHasRecommendation] = useState(false)
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [recommendationLanguage, setRecommendationLanguage] = useState<'en' | 'hi' | 'as'>('en')

  const fetchScanRecommendation = async (scanId: string) => {
    try {
      const res = await apiClient.get(`/api/scans/${scanId}/recommendations`)
      if (res.data?.data?.hasRecommendation) {
        setRecommendation(res.data.data.recommendation)
        setHasRecommendation(true)
      } else {
        setRecommendation(null)
        setHasRecommendation(false)
      }
    } catch {
      setRecommendation(null)
      setHasRecommendation(false)
    }
  }

  const handleSelectScan = (scan: ScanItem) => {
    setSelectedScan(scan)
    if (scan.status === 'completed') {
      void fetchScanRecommendation(scan.id)
    } else {
      setRecommendation(null)
      setHasRecommendation(false)
    }
  }

  const handleGenerateRecommendationsForScan = async (language: 'en' | 'hi' | 'as') => {
    if (!selectedScan?.id) return
    setIsGeneratingRecommendation(true)
    setRecommendationError(null)
    try {
      const res = await apiClient.post(
        `/api/scans/${selectedScan.id}/recommendations/generate`,
        { language, regenerate: hasRecommendation },
      )
      const rec: RecommendationPayload = res.data?.data?.recommendation
      setRecommendation(rec)
      setHasRecommendation(true)
      setRecommendationLanguage(language)
      toast.success('Treatment recommendations generated successfully!')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message || 'Failed to generate recommendations.'
      setRecommendationError(msg)
      toast.error(msg)
    } finally {
      setIsGeneratingRecommendation(false)
    }
  }

  const handleFeedbackSubmit = async (
    recommendationId: string,
    feedbackData: RecommendationFeedbackSubmit,
  ) => {
    setIsFeedbackSubmitting(true)
    try {
      const res = await apiClient.post(
        `/api/recommendations/${recommendationId}/feedback`,
        feedbackData,
      )
      const updated: RecommendationPayload = res.data?.data?.recommendation
      setRecommendation(updated)
      toast.success('Feedback submitted. Thank you!')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(e?.response?.data?.message || 'Failed to submit feedback.')
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }

  const handleGenerateExplanationForScan = async (language: 'en' | 'hi' | 'as') => {
    if (!selectedScan?.id) return
    setIsGeneratingExplanation(true)
    try {
      const res = await apiClient.post(`/api/scans/${selectedScan.id}/generate-explanation`, {
        language,
        regenerate: true,
      })
      const explanationData = res.data?.data?.explanation
      setSelectedScan((prev) =>
        prev ? { ...prev, explanation: explanationData } : prev,
      )
      void queryClient.invalidateQueries({ queryKey: ['scans-history'] })
      toast.success(
        `Advisory generated in ${language === 'hi' ? 'Hindi' : language === 'as' ? 'Assamese' : 'English'}!`,
      )
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message || 'Failed to generate advisory explanation.'
      toast.error(msg)
    } finally {
      setIsGeneratingExplanation(false)
    }
  }

  // Fetch scans from real API
  const {
    data: scansData,
    isLoading,
    refetch,
  } = useQuery<ScansResponse>({
    queryKey: ['scans-history', page, statusFilter, searchTerm],
    queryFn: async () => {
      let url = `/api/scans?page=${page}&limit=10`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`
      }
      const res = await apiClient.get(url)
      return res.data.data
    },
  })

  // Delete scan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/scans/${id}`)
    },
    onSuccess: () => {
      toast.success('Scan record removed.')
      setSelectedScan(null)
      queryClient.invalidateQueries({ queryKey: ['scans-history'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-scans'] })
    },
    onError: () => {
      toast.error('Failed to delete scan record.')
    },
  })

  const scans = scansData?.scans ?? []
  const pagination = scansData?.pagination

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="default" size="sm">
              Audit & Records
            </Badge>
            <span className="text-xs text-muted-foreground">Historical Farm Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <History className="h-7 w-7 text-primary" />
            Scan History
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Browse and review past crop foliage submissions, AI diagnosis statuses, and historical treatment notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/scanner')}
            leftIcon={<ScanLine className="h-4 w-4" />}
          >
            New Crop Scan
          </Button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="shadow-subtle">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by crop, plot, disease..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => {
                setStatusFilter('pending')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-3 w-3" />
              Pending Analysis
            </button>
            <button
              onClick={() => {
                setStatusFilter('completed')
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Scans List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : scans.length > 0 ? (
        <div className="space-y-3">
          {scans.map((scan) => (
            <motion.div
              key={scan.id}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="hover:border-primary/40 transition-all shadow-subtle hover:shadow-card">
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="h-16 w-16 rounded-2xl bg-black/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {scan.imageUrl ? (
                        <img
                          src={scan.imageUrl}
                          alt={scan.cropName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Sprout className="h-8 w-8 text-primary" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {scan.cropName}
                        </h3>
                        {scan.fieldLocation && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {scan.fieldLocation}
                          </span>
                        )}
                        <Badge
                          variant={scan.status === 'pending' ? 'warning' : 'outline'}
                          size="sm"
                          className="capitalize"
                        >
                          {scan.status === 'pending' ? 'Pending AI Analysis' : scan.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {scan.diseaseName}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {scan.cropCategory && (
                          <span>Category: <strong>{scan.cropCategory}</strong></span>
                        )}
                        {scan.growthStage && (
                          <span className="capitalize">Stage: <strong>{scan.growthStage}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectScan(scan)}
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (window.confirm(`Delete scan record for ${scan.cropName}?`)) {
                          deleteMutation.mutate(scan.id)
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total scans)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={ScanLine}
          title={searchTerm ? 'No matching scans found' : 'No Scans in History'}
          description={
            searchTerm
              ? `No crop scan records match "${searchTerm}". Try adjusting your search query.`
              : 'You have not uploaded any crop photographs yet. Capture or upload a leaf photo to get started.'
          }
          actionLabel="Scan a Crop Now"
          onAction={() => navigate('/app/scanner')}
          actionIcon={<ScanLine className="h-4 w-4" />}
          className="py-12"
        />
      )}

      {/* ===================== Scan Inspection Modal ===================== */}
      {selectedScan && (
        <Dialog
          open={!!selectedScan}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedScan(null)
              setShowFullAdvisory(false)
              setRecommendation(null)
              setHasRecommendation(false)
            }
          }}
        >
          <DialogContent className={showFullAdvisory ? 'max-w-3xl max-h-[90vh] overflow-y-auto' : 'max-w-lg'}>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={selectedScan.status === 'pending' ? 'warning' : 'outline'}
                  size="sm"
                >
                  {selectedScan.status === 'pending'
                    ? 'Pending AI Analysis'
                    : selectedScan.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Ref: {selectedScan.id.substring(0, 8)}
                </span>
              </div>
              <DialogTitle className="text-xl">
                {selectedScan.cropName} • {selectedScan.diseaseName}
              </DialogTitle>
              <DialogDescription>
                Uploaded on{' '}
                {new Date(selectedScan.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DialogDescription>
            </DialogHeader>

            {showFullAdvisory ? (
              <div className="py-2 space-y-6">
                <DiseaseAdvisoryReport
                  cropName={selectedScan.predictedCrop || selectedScan.cropName}
                  diseaseName={selectedScan.predictedDisease || selectedScan.diseaseName}
                  confidence={selectedScan.confidence}
                  isHealthy={selectedScan.isHealthy}
                  status={selectedScan.status}
                  imageUrl={selectedScan.imageUrl}
                  modelVersion={selectedScan.modelVersion}
                  inferenceDurationMs={selectedScan.inferenceDurationMs}
                  explanation={selectedScan.explanation}
                  onGenerateExplanation={handleGenerateExplanationForScan}
                  isGenerating={isGeneratingExplanation}
                />

                {/* Phase 8: Treatment Recommendations in History Modal */}
                <TreatmentRecommendationPanel
                  recommendation={recommendation}
                  hasRecommendation={hasRecommendation}
                  isGenerating={isGeneratingRecommendation}
                  isGeneratingError={recommendationError}
                  onGenerate={handleGenerateRecommendationsForScan}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  isFeedbackSubmitting={isFeedbackSubmitting}
                  scanStatus={selectedScan.status}
                  confidence={selectedScan.confidence}
                  isHealthy={selectedScan.isHealthy}
                  language={recommendationLanguage}
                  onLanguageChange={setRecommendationLanguage}
                />
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Photo preview */}
                {selectedScan.imageUrl && (
                  <div className="h-48 w-full rounded-2xl overflow-hidden border border-border">
                    <img
                      src={selectedScan.imageUrl}
                      alt={selectedScan.cropName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                {/* Grid Metadata */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-card border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block">Plot Location:</span>
                    <strong className="text-foreground">
                      {selectedScan.fieldLocation || 'General Farm Plot'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Growth Stage:</span>
                    <strong className="text-foreground capitalize">
                      {selectedScan.growthStage || 'Vegetative'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Crop Category:</span>
                    <strong className="text-foreground">
                      {selectedScan.cropCategory || 'Other'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">AI Pipeline:</span>
                    <strong className="text-primary capitalize">
                      {selectedScan.status === 'pending'
                        ? 'Queued for Vision ML'
                        : selectedScan.status === 'processing'
                        ? 'Analyzing...'
                        : selectedScan.status}
                    </strong>
                  </div>
                </div>

                {/* AI Diagnostic Output */}
                {selectedScan.status === 'completed' && selectedScan.predictedDisease && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <ScanLine className="h-4 w-4 text-primary" />
                        AI Diagnosis:
                      </span>
                      <Badge variant={selectedScan.isHealthy ? 'default' : 'warning'} size="sm">
                        {selectedScan.isHealthy ? 'Healthy Foliage' : selectedScan.predictedDisease}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                      <div>
                        <span className="text-muted-foreground block">Predicted Crop:</span>
                        <strong className="text-foreground">{selectedScan.predictedCrop || selectedScan.cropName}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Model Confidence:</span>
                        <strong className="text-primary">{selectedScan.confidence.toFixed(1)}%</strong>
                      </div>
                    </div>
                    {selectedScan.modelVersion && (
                      <div className="text-[11px] text-muted-foreground pt-1 flex justify-between">
                        <span>Model: {selectedScan.modelVersion}</span>
                        {selectedScan.inferenceDurationMs && (
                          <span>Latency: {selectedScan.inferenceDurationMs.toFixed(0)}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Processing Spinner State */}
                {selectedScan.status === 'processing' && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                    <RefreshCw className="h-4 w-4 text-primary animate-spin" />
                    <span className="text-muted-foreground font-medium">
                      AI Vision Model is analyzing this leaf specimen...
                    </span>
                  </div>
                )}

                {/* Observations */}
                {selectedScan.additionalObservations && (
                  <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 text-xs">
                    <span className="text-muted-foreground font-semibold block mb-0.5">
                      Farmer Notes:
                    </span>
                    <p className="text-foreground">{selectedScan.additionalObservations}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-wrap gap-2 justify-between">
              <div>
                {selectedScan.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullAdvisory(!showFullAdvisory)}
                    leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
                  >
                    {showFullAdvisory ? 'Summary View' : 'Full Agronomic Advisory'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedScan(null)
                    setShowFullAdvisory(false)
                    setRecommendation(null)
                    setHasRecommendation(false)
                  }}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedScan(null)
                    setShowFullAdvisory(false)
                    setRecommendation(null)
                    setHasRecommendation(false)
                    navigate('/app/scanner')
                  }}
                  leftIcon={<ScanLine className="h-4 w-4" />}
                >
                  New Scan
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
