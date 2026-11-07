import { useState, useRef, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanLine,
  Camera,
  UploadCloud,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  FlipHorizontal,
  ChevronRight,
} from 'lucide-react'
import apiClient from '@/lib/api'
import { useCamera } from '@/hooks/useCamera'
import { validateCropImage, ImageValidationResult } from '@/lib/imageValidation'
import { DiseaseAdvisoryReport, ExplanationPayload } from '@/components/scans/DiseaseAdvisoryReport'
import {
  TreatmentRecommendationPanel,
  RecommendationPayload,
  RecommendationFeedbackSubmit,
} from '@/components/scans/TreatmentRecommendationPanel'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { useToast } from '@/contexts/ToastContext'

const POPULAR_CROPS = [
  'Wheat',
  'Rice (Paddy)',
  'Mustard',
  'Potato',
  'Tomato',
  'Cotton',
  'Maize',
  'Chickpea (Gram)',
  'Sugarcane',
  'Chili',
  'Onion',
  'Soybean',
  'Other',
]

interface SubmittedScanResult {
  id: string
  cropName: string
  cropCategory: string
  growthStage: string
  fieldLocation?: string
  imageUrl: string
  status: string
  diseaseName: string
  confidence?: number
  createdAt: string
  additionalObservations?: string
  // AI Analysis fields (populated after /analyze call)
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
  isConfident?: boolean
  message?: string
  explanation?: ExplanationPayload
}

export default function CropDiseaseScannerPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Camera hook
  const {
    videoRef,
    isStreaming,
    isLoading: isCameraLoading,
    error: cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
    capturePhoto,
  } = useCamera()

  // File selection state
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationInfo, setValidationInfo] = useState<ImageValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Crop Information Form State
  const [cropName, setCropName] = useState<string>('Wheat')
  const [customCropName, setCustomCropName] = useState<string>('')
  const [cropCategory, setCropCategory] = useState<string>('Cereals')
  const [growthStage, setGrowthStage] = useState<string>('vegetative')
  const [fieldLocation, setFieldLocation] = useState<string>('')
  const [additionalObservations, setAdditionalObservations] = useState<string>('')

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submittedScan, setSubmittedScan] = useState<SubmittedScanResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Phase 8: Recommendation state
  const [recommendation, setRecommendation] = useState<RecommendationPayload | null>(null)
  const [hasRecommendation, setHasRecommendation] = useState(false)
  const [isGeneratingRecommendation, setIsGeneratingRecommendation] = useState(false)
  const [recommendationError, setRecommendationError] = useState<string | null>(null)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [recommendationLanguage, setRecommendationLanguage] = useState<'en' | 'hi' | 'as'>('en')

  // Trigger Phase 6 PyTorch AI Analysis
  const triggerAnalysis = async (scanId: string) => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await apiClient.post(`/api/scans/${scanId}/analyze`)
      const analyzed = res.data?.data?.scan
      setSubmittedScan((prev) => (prev ? { ...prev, ...analyzed } : analyzed))
      if (analyzed?.isHealthy) {
        toast.success('AI Analysis Complete: Crop foliage appears healthy!')
      } else {
        toast.warning(`AI Detected: ${analyzed?.diseaseName || 'Crop Disease'}`)
      }
      // After analysis, check for existing recommendations
      void fetchRecommendation(scanId)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message || 'AI vision analysis failed. Please try again.'
      setAnalysisError(msg)
      toast.error(msg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Trigger Phase 7 Gemini & Knowledge Base Advisory Explanation
  const triggerExplanation = async (language: 'en' | 'hi' | 'as') => {
    if (!submittedScan?.id) return
    setIsGeneratingExplanation(true)
    try {
      const res = await apiClient.post(`/api/scans/${submittedScan.id}/generate-explanation`, {
        language,
        regenerate: true,
      })
      const explanationData = res.data?.data?.explanation
      setSubmittedScan((prev) =>
        prev ? { ...prev, explanation: explanationData } : prev,
      )
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

  // Trigger Phase 8 Recommendation Generation
  const triggerRecommendations = async (language: 'en' | 'hi' | 'as') => {
    if (!submittedScan?.id) return
    setIsGeneratingRecommendation(true)
    setRecommendationError(null)
    try {
      const res = await apiClient.post(
        `/api/scans/${submittedScan.id}/recommendations/generate`,
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

  // Fetch existing recommendation for a scan (after analysis)
  const fetchRecommendation = async (scanId: string) => {
    try {
      const res = await apiClient.get(`/api/scans/${scanId}/recommendations`)
      if (res.data?.data?.hasRecommendation) {
        setRecommendation(res.data.data.recommendation)
        setHasRecommendation(true)
      } else {
        setHasRecommendation(false)
      }
    } catch {
      // Non-critical; panel will show generate button
    }
  }

  // Submit farmer feedback on recommendation
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

  // Handle live photo capture
  const handleCapture = async () => {
    const result = await capturePhoto()
    if (!result) {
      toast.error('Failed to capture frame. Please try again.')
      return
    }

    stopCamera()
    setIsValidating(true)
    const validation = await validateCropImage(result.file)
    setIsValidating(false)

    if (!validation.isValid) {
      toast.error(validation.error || 'Captured image does not meet quality requirements.')
      return
    }

    setSelectedFile(result.file)
    setPreviewUrl(result.previewUrl)
    setValidationInfo(validation)
    toast.success('Leaf photo captured successfully!')
  }

  // Handle gallery file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    stopCamera()
    setIsValidating(true)
    const validation = await validateCropImage(file)
    setIsValidating(false)

    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid image file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setValidationInfo(validation)
    toast.success(`Loaded ${file.name} (${validation.fileSizeFormatted})`)
  }

  // Reset selection
  const handleReset = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setValidationInfo(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    stopCamera()
  }

  // Submit scan for upload
  const handleSubmitScan = async () => {
    if (!selectedFile) {
      toast.error('Please capture or select a leaf photo before submitting.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const formData = new FormData()
    formData.append('image', selectedFile)

    const finalCropName = cropName === 'Other' && customCropName.trim() ? customCropName.trim() : cropName
    formData.append('cropName', finalCropName)
    formData.append('cropCategory', cropCategory)
    formData.append('growthStage', growthStage)
    if (fieldLocation.trim()) formData.append('fieldLocation', fieldLocation.trim())
    if (additionalObservations.trim()) formData.append('additionalObservations', additionalObservations.trim())

    try {
      const res = await apiClient.post('/api/scans/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortController.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        },
      })

      const scanData = res.data?.data?.scan
      setSubmittedScan(scanData)
      toast.success('Crop photo uploaded. Initiating AI vision diagnosis...')
      if (scanData?.id) {
        void triggerAnalysis(scanData.id)
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string; response?: { data?: { message?: string } }; message?: string }
      if (errorObj.name === 'CanceledError' || errorObj.message === 'canceled') {
        toast.info('Upload canceled.')
      } else {
        const errorMsg = errorObj.response?.data?.message || 'Upload failed. Please check your network and try again.'
        toast.error(errorMsg)
      }
    } finally {
      setIsUploading(false)
      abortControllerRef.current = null
    }
  }

  // Cancel in-flight upload
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* ===================== Header & Instructions ===================== */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Badge variant="default" size="sm">
            Foliage Disease Diagnostics
          </Badge>
          <span className="text-xs text-muted-foreground">Supported: JPEG, PNG, WebP • Max 10 MB</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <ScanLine className="h-7 w-7 text-primary" />
          Scan Your Crop
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Capture high-clarity photographs of affected crop leaves, stems, or fruits to initiate AI diagnostic screening.
        </p>
      </div>

      {/* Instructions Guidance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-card border border-border shadow-subtle">
        <div className="flex items-start gap-3 p-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold">1</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Close-Up Focus</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Center the camera on symptomatic leaf lesions or discolored margins.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold">2</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Optimal Daylight</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use natural daylight without harsh shadows or intense backlighting.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold">3</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Steady & Sharp</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hold the camera steady to ensure veins and spots remain crisp.
            </p>
          </div>
        </div>
      </div>

      {/* ===================== Main Capture / Confirmation Area ===================== */}
      <AnimatePresence mode="wait">
        {submittedScan ? (
          <motion.div
            key="results-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {isAnalyzing && (
              <Card className="border-primary/30 bg-primary/5 shadow-premium">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-foreground">Analyzing Crop Foliage</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      EfficientNet-B0 vision classifier is screening your leaf photograph against 19 agricultural disease profiles...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isAnalyzing && analysisError && (
              <Card className="border-destructive/30 bg-destructive/5 shadow-premium">
                <CardContent className="flex flex-col items-center py-10 gap-4 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <div>
                    <h3 className="font-bold text-base text-foreground">Analysis Screening Interrupted</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">{analysisError}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => submittedScan?.id && void triggerAnalysis(submittedScan.id)}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Retry Vision Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isAnalyzing && !analysisError && (
              <>
                <DiseaseAdvisoryReport
                  cropName={submittedScan.predictedCrop || submittedScan.cropName}
                  diseaseName={submittedScan.predictedDisease || submittedScan.diseaseName}
                  confidence={submittedScan.confidence ?? 0}
                  isHealthy={submittedScan.isHealthy}
                  status={submittedScan.status}
                  imageUrl={submittedScan.imageUrl}
                  modelVersion={submittedScan.modelVersion}
                  inferenceDurationMs={submittedScan.inferenceDurationMs}
                  explanation={submittedScan.explanation}
                  onGenerateExplanation={triggerExplanation}
                  isGenerating={isGeneratingExplanation}
                />

                {/* Phase 8: Treatment Recommendations */}
                <TreatmentRecommendationPanel
                  recommendation={recommendation}
                  hasRecommendation={hasRecommendation}
                  isGenerating={isGeneratingRecommendation}
                  isGeneratingError={recommendationError}
                  onGenerate={triggerRecommendations}
                  onFeedbackSubmit={handleFeedbackSubmit}
                  isFeedbackSubmitting={isFeedbackSubmitting}
                  scanStatus={submittedScan.status}
                  confidence={submittedScan.confidence ?? 0}
                  isHealthy={submittedScan.isHealthy}
                  language={recommendationLanguage}
                  onLanguageChange={setRecommendationLanguage}
                />

                {/* Bottom Navigation Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmittedScan(null)
                      setRecommendation(null)
                      setHasRecommendation(false)
                      setRecommendationError(null)
                      handleReset()
                    }}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Scan Another Crop
                  </Button>
                  <Button
                    onClick={() => navigate('/app/history')}
                    rightIcon={<ChevronRight className="h-4 w-4" />}
                  >
                    View in Scan History
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          /* ===================== Capture & Upload Interface ===================== */
          <div key="scanner-main" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Camera Viewport or Image Preview */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="overflow-hidden shadow-subtle border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      Live Viewfinder & Photo Review
                    </CardTitle>
                    {isStreaming && (
                      <Badge variant="success" size="sm" className="animate-pulse">
                        Camera Active
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  {/* Camera Error Message */}
                  {cameraError && (
                    <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{cameraError}</p>
                        <p className="mt-1 text-muted-foreground">
                          You can still upload pictures directly from your device gallery.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 1. Live Camera Stream */}
                  {isStreaming ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Alignment Target Reticle */}
                      <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="text-[11px] text-white/90 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                          Align leaf inside box
                        </span>
                      </div>

                      {/* Top Stream Toolbar */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          onClick={toggleFacingMode}
                          className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md backdrop-blur-sm"
                          title="Switch Camera"
                        >
                          <FlipHorizontal className="h-4 w-4" />
                        </button>
                        <button
                          onClick={stopCamera}
                          className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md backdrop-blur-sm"
                          title="Close Camera"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Bottom Capture Action */}
                      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                        <button
                          onClick={handleCapture}
                          className="h-16 w-16 rounded-full bg-white border-4 border-primary shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                          title="Capture Photograph"
                        >
                          <div className="h-12 w-12 rounded-full bg-primary" />
                        </button>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    /* 2. Photo Review Preview */
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 aspect-[4/3] flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt="Captured crop"
                          className="w-full h-full object-contain"
                        />
                        <button
                          onClick={handleReset}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
                          title="Remove Photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quality Checklist */}
                      {validationInfo && (
                        <div className="p-3 rounded-xl bg-card border border-border text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-foreground">Image Quality Passed</span>
                          </div>
                          <span className="text-muted-foreground">
                            {validationInfo.width}x{validationInfo.height}px • {validationInfo.fileSizeFormatted}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 3. Empty State with Camera & Gallery Selection */
                    <div className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                      <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                        <Camera className="h-8 w-8" />
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">
                        Select Photo Source
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mb-6">
                        Take a photo using your device camera or upload an existing image from your gallery.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                          onClick={() => startCamera(facingMode)}
                          isLoading={isCameraLoading}
                          leftIcon={<Camera className="h-4 w-4" />}
                        >
                          Open Camera
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          leftIcon={<UploadCloud className="h-4 w-4" />}
                        >
                          Upload from Gallery
                        </Button>
                      </div>

                      {/* Hidden File Input fallback */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}

                  {/* Actions when photo is selected */}
                  {previewUrl && !isStreaming && (
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Retake / Choose Another
                      </Button>
                      <span className="text-[11px] text-muted-foreground">
                        Ready for diagnostic submission
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Columns: Optional Crop Details Form & Submit */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="shadow-subtle border-border">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Crop Details</CardTitle>
                      <CardDescription>Optional field and crop context</CardDescription>
                    </div>
                    <Badge variant="outline" size="sm">
                      Optional
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-4">
                  {/* Crop Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Crop Name</label>
                    <Select value={cropName} onValueChange={(val) => setCropName(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Crop" />
                      </SelectTrigger>
                      <SelectContent>
                        {POPULAR_CROPS.map((crop) => (
                          <SelectItem key={crop} value={crop}>
                            {crop}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Crop Name if 'Other' selected */}
                  {cropName === 'Other' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Specify Crop Name</label>
                      <Input
                        placeholder="e.g. Barley, Groundnut, Apple"
                        value={customCropName}
                        onChange={(e) => setCustomCropName(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Category & Growth Stage Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Category</label>
                      <Select value={cropCategory} onValueChange={(val) => setCropCategory(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cereals">Cereals</SelectItem>
                          <SelectItem value="Vegetables">Vegetables</SelectItem>
                          <SelectItem value="Fruits">Fruits</SelectItem>
                          <SelectItem value="Oilseeds">Oilseeds</SelectItem>
                          <SelectItem value="Pulses">Pulses</SelectItem>
                          <SelectItem value="Cash Crops">Cash Crops</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Growth Stage</label>
                      <Select value={growthStage} onValueChange={(val) => setGrowthStage(val)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sowing">Sowing / Seedling</SelectItem>
                          <SelectItem value="vegetative">Vegetative</SelectItem>
                          <SelectItem value="flowering">Flowering</SelectItem>
                          <SelectItem value="fruiting">Fruiting</SelectItem>
                          <SelectItem value="harvesting">Harvesting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Field Plot Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Field / Plot Identifier</label>
                    <Input
                      placeholder="e.g. North Plot #4, Sector 2"
                      value={fieldLocation}
                      onChange={(e) => setFieldLocation(e.target.value)}
                    />
                  </div>

                  {/* Additional Observations */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Observations & Symptoms
                    </label>
                    <Textarea
                      placeholder="Describe leaf yellowing, wilting, curling, or recent weather..."
                      rows={3}
                      value={additionalObservations}
                      onChange={(e) => setAdditionalObservations(e.target.value)}
                    />
                  </div>

                  {/* Upload Progress Bar if Uploading */}
                  {isUploading && (
                    <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-primary">
                        <span>Uploading Crop Image...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 sm:p-6 bg-card border-t border-border flex flex-col gap-2">
                  <Button
                    className="w-full"
                    disabled={!selectedFile || isUploading || isValidating}
                    isLoading={isUploading || isValidating}
                    onClick={handleSubmitScan}
                    leftIcon={<ScanLine className="h-4 w-4" />}
                  >
                    Submit for AI Analysis
                  </Button>

                  {isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive"
                      onClick={handleCancelUpload}
                    >
                      Cancel Upload
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
