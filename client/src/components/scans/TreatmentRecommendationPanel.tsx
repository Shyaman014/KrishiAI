import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Leaf,
  Bug,
  FlaskConical,
  ShieldAlert,
  BookMarked,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  Star,
  RefreshCw,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
  Beaker,
  MessageSquare,
  Sprout,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImmediateAction {
  action: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  instructions: string
}

export interface CulturalPractice {
  practice: string
  details: string
  stageApplicability?: string
}

export interface BiologicalControl {
  agentName: string
  targetPathogen: string
  applicationMethod: string
  limitations: string
}

export interface ChemicalTreatment {
  activeIngredient: string
  registeredProductExample?: string
  cibrcApproved: boolean
  labelPrecautions: string[]
  ppeRequired: string[]
  withholdingPeriodDays?: number
  expertConsultationNote: string
}

export interface RecommendationFeedbackSubmit {
  wasHelpful: boolean
  followedPractices: boolean
  rating: number
  observations?: string
  comments?: string
}

export interface RecommendationPayload {
  _id: string
  scanId: string
  userId: string
  cropName: string
  diseaseName: string
  isHealthy: boolean
  confidence: number
  growthStage?: string
  fieldLocation?: string
  farmerObservations?: string
  immediateActions: ImmediateAction[]
  culturalPractices: CulturalPractice[]
  biologicalControls: BiologicalControl[]
  chemicalTreatments: ChemicalTreatment[]
  safetyPrecautions: string[]
  stageSpecificAdvice: string
  expertConsultationGuidance: string
  referenceSources: string[]
  language: 'en' | 'hi' | 'as'
  modelIdentifier: string
  status: string
  feedback?: {
    wasHelpful: boolean
    followedPractices: boolean
    rating: number
    observations?: string
    comments?: string
    submittedAt: string
  }
  createdAt: string
}

// ─── Helper: urgency color/label ─────────────────────────────────────────────

function urgencyMeta(urgency: string) {
  switch (urgency) {
    case 'critical':
      return { label: 'Critical', cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' }
    case 'high':
      return { label: 'High', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800' }
    case 'medium':
      return { label: 'Medium', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
    default:
      return { label: 'Low', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' }
  }
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Feedback Form ────────────────────────────────────────────────────────────

interface FeedbackFormProps {
  onSubmit: (data: RecommendationFeedbackSubmit) => void
  isSubmitting: boolean
  alreadySubmitted: boolean
}

function FeedbackForm({ onSubmit, isSubmitting, alreadySubmitted }: FeedbackFormProps) {
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null)
  const [followedPractices, setFollowedPractices] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [observations, setObservations] = useState('')

  const canSubmit = wasHelpful !== null && followedPractices !== null && rating > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      wasHelpful: wasHelpful!,
      followedPractices: followedPractices!,
      rating,
      observations: observations.trim() || undefined,
      comments: comments.trim() || undefined,
    })
  }

  if (alreadySubmitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-emerald-800 dark:text-emerald-300 font-medium">
          Thank you — your feedback has been recorded and will help improve future recommendations.
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Helpfulness */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Was this recommendation helpful?</p>
        <div className="flex gap-2">
          <button
            id="feedback-helpful-yes"
            type="button"
            onClick={() => setWasHelpful(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              wasHelpful === true
                ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                : 'border-border text-muted-foreground hover:border-emerald-400'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Yes, helpful
          </button>
          <button
            id="feedback-helpful-no"
            type="button"
            onClick={() => setWasHelpful(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              wasHelpful === false
                ? 'bg-red-100 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-400'
                : 'border-border text-muted-foreground hover:border-red-400'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            Not helpful
          </button>
        </div>
      </div>

      {/* Followed practices */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Did you follow the suggested practices?</p>
        <div className="flex gap-2">
          <button
            id="feedback-followed-yes"
            type="button"
            onClick={() => setFollowedPractices(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              followedPractices === true
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary'
            }`}
          >
            Yes, I did
          </button>
          <button
            id="feedback-followed-no"
            type="button"
            onClick={() => setFollowedPractices(false)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              followedPractices === false
                ? 'bg-muted border-border text-foreground'
                : 'border-border text-muted-foreground hover:border-muted-foreground'
            }`}
          >
            Not yet
          </button>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-foreground">Overall rating</p>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Additional Observations */}
      <div className="space-y-1.5">
        <label htmlFor="feedback-observations" className="text-xs font-semibold text-foreground block">
          Additional observations <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="feedback-observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="e.g. Lesions spread to upper leaves after 3 days..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      {/* Comments */}
      <div className="space-y-1.5">
        <label htmlFor="feedback-comments" className="text-xs font-semibold text-foreground block">
          Comments <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="feedback-comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Any suggestions to improve this recommendation..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          id="feedback-submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          isLoading={isSubmitting}
          size="sm"
          leftIcon={<MessageSquare className="h-3.5 w-3.5" />}
        >
          Submit Feedback
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Feedback is not used as scientific validation.
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TreatmentRecommendationPanelProps {
  recommendation: RecommendationPayload | null
  hasRecommendation: boolean
  isGenerating: boolean
  isGeneratingError?: string | null
  onGenerate: (language: 'en' | 'hi' | 'as') => void
  onFeedbackSubmit: (recommendationId: string, data: RecommendationFeedbackSubmit) => void
  isFeedbackSubmitting: boolean
  scanStatus: string
  confidence: number
  isHealthy?: boolean
  language: 'en' | 'hi' | 'as'
  onLanguageChange: (lang: 'en' | 'hi' | 'as') => void
}

export function TreatmentRecommendationPanel({
  recommendation,
  hasRecommendation,
  isGenerating,
  isGeneratingError,
  onGenerate,
  onFeedbackSubmit,
  isFeedbackSubmitting,
  scanStatus,
  confidence,
  language,
  onLanguageChange,
}: TreatmentRecommendationPanelProps) {
  const [showChemical, setShowChemical] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const alreadyFeedback = Boolean(recommendation?.feedback)

  const isEligible = scanStatus === 'completed' && confidence >= 50

  // ── Empty / ineligible state ──
  if (!isEligible) {
    return (
      <Card className="border border-border bg-card shadow-subtle overflow-hidden">
        <div className="bg-amber-500/10 px-4 py-2.5 border-b border-amber-500/15 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Layer 4 • Smart Treatment Recommendations
          </span>
        </div>
        <CardContent className="p-6 text-center space-y-2">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-foreground">Recommendations Unavailable</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Treatment recommendations require a completed AI analysis with at least 50% confidence.
            {scanStatus !== 'completed' && ' Please run the AI analysis first.'}
            {scanStatus === 'completed' && confidence < 50 && ' Low confidence — please rescan with a clearer photo.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Not generated yet ──
  if (!hasRecommendation && !isGenerating) {
    return (
      <Card className="border border-border bg-card shadow-subtle overflow-hidden">
        <div className="bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-500/15 flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Layer 4 • Smart Treatment Recommendations
          </span>
        </div>
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Generate Treatment Recommendations
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Evidence-based, structured guidance from ICAR, TNAU, and KVK sources — covering immediate
              actions, cultural practices, biological control, and verified chemical options.
            </p>
          </div>

          {/* Language selection */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {(['en', 'hi', 'as'] as const).map((l) => (
              <Button
                key={l}
                id={`rec-lang-${l}`}
                variant={language === l ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange(l)}
              >
                {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'অসমীয়া'}
              </Button>
            ))}
          </div>

          <Button
            id="generate-recommendations-btn"
            onClick={() => onGenerate(language)}
            leftIcon={<Zap className="h-4 w-4" />}
          >
            Generate Agricultural Recommendations
          </Button>

          {isGeneratingError && (
            <p className="text-xs text-destructive">{isGeneratingError}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Generating ──
  if (isGenerating) {
    return (
      <Card className="border border-primary/30 bg-primary/5 shadow-subtle overflow-hidden">
        <CardContent className="p-8 text-center space-y-3">
          <div className="relative mx-auto w-12 h-12">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Building Treatment Recommendations...
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Querying ICAR knowledge base and agricultural guidance engine for verified, evidence-based
            management strategies.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!recommendation) return null

  const data = recommendation

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-0"
    >
      <Card className="border border-border bg-card shadow-subtle overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-500/15 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Layer 4 • Smart Treatment Recommendations
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" size="sm" className="text-[11px]">
              KB-Verified
            </Badge>
            <span className="text-[11px] font-mono text-muted-foreground">
              {data.modelIdentifier}
            </span>
            <Button
              id="regenerate-recommendations-btn"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onGenerate(data.language || language)}
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate
            </Button>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Stage-specific context */}
          {data.stageSpecificAdvice && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
              <Sprout className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block mb-0.5">Growth Stage Advisory</span>
                <span className="text-muted-foreground">{data.stageSpecificAdvice}</span>
              </div>
            </div>
          )}

          {/* ── A: Immediate Actions ─────────────────────────────────────────── */}
          {data.immediateActions.length > 0 && (
            <section aria-label="Immediate Actions">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-red-500" />
                A — Immediate Actions
              </h4>
              <div className="space-y-2.5">
                {data.immediateActions.map((action, idx) => {
                  const meta = urgencyMeta(action.urgency)
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${meta.cls} space-y-1`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">{action.action}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed">{action.instructions}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── B: Cultural Practices ────────────────────────────────────────── */}
          {data.culturalPractices.length > 0 && (
            <section aria-label="Cultural Practices">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                B — Cultural Practices
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {data.culturalPractices.map((cp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-foreground">{cp.practice}</span>
                      {cp.stageApplicability && (
                        <span className="text-[10px] text-muted-foreground shrink-0 italic">
                          {cp.stageApplicability}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cp.details}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── C: Biological Control ───────────────────────────────────────── */}
          {data.biologicalControls.length > 0 && (
            <section aria-label="Biological Control">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4 text-lime-600 dark:text-lime-400" />
                C — Biological Control
              </h4>
              <div className="space-y-2.5">
                {data.biologicalControls.map((bc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-lime-50/50 dark:bg-lime-950/20 border border-lime-200 dark:border-lime-800 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Beaker className="h-3.5 w-3.5 text-lime-700 dark:text-lime-400 shrink-0" />
                      <span className="text-xs font-bold text-lime-800 dark:text-lime-300 italic">
                        {bc.agentName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Target: </span>
                      {bc.targetPathogen}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Method: </span>
                      {bc.applicationMethod}
                    </p>
                    <div className="flex items-start gap-1.5 pt-0.5">
                      <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                        {bc.limitations}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── D: Chemical Treatment (collapsible, only when available) ────── */}
          {data.chemicalTreatments.length > 0 && (
            <section aria-label="Chemical Treatment">
              <button
                id="toggle-chemical-section"
                type="button"
                onClick={() => setShowChemical(!showChemical)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100/40 dark:hover:bg-amber-950/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    D — Verified Chemical Treatment Options
                  </span>
                  <Badge variant="warning" size="sm" className="text-[10px]">
                    CIBRC-Registered
                  </Badge>
                </div>
                {showChemical ? (
                  <ChevronUp className="h-4 w-4 text-amber-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-amber-600" />
                )}
              </button>

              <AnimatePresence>
                {showChemical && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 space-y-2.5"
                  >
                    {/* Safety warning banner */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="text-red-800 dark:text-red-300 space-y-0.5">
                        <strong className="block">Chemical Safety Notice</strong>
                        <span>
                          Only use CIBRC-registered formulations. Strictly follow label
                          instructions and pre-harvest intervals. Consult your local KVK or
                          district agricultural extension officer before any chemical application.
                        </span>
                      </div>
                    </div>

                    {data.chemicalTreatments.map((ct, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-foreground block italic">
                              {ct.activeIngredient}
                            </span>
                            {ct.registeredProductExample && (
                              <span className="text-[11px] text-muted-foreground">
                                Example: {ct.registeredProductExample}
                              </span>
                            )}
                          </div>
                          {ct.cibrcApproved && (
                            <Badge variant="outline" size="sm" className="shrink-0 text-[10px] border-amber-400 text-amber-700 dark:text-amber-400">
                              CIBRC ✓
                            </Badge>
                          )}
                        </div>

                        {ct.withholdingPeriodDays !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="h-3 w-3 text-red-500 shrink-0" />
                            <span className="font-semibold text-foreground">Pre-Harvest Interval:</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              {ct.withholdingPeriodDays} days
                            </span>
                          </div>
                        )}

                        {ct.labelPrecautions.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-foreground block mb-1">
                              Label Precautions:
                            </span>
                            <ul className="space-y-0.5">
                              {ct.labelPrecautions.map((p, i) => (
                                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ct.ppeRequired.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="text-[11px] text-muted-foreground">
                              <strong className="text-foreground">PPE Required:</strong>{' '}
                              {ct.ppeRequired.join(', ')}
                            </span>
                          </div>
                        )}

                        <div className="mt-1 p-2 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground italic">
                          {ct.expertConsultationNote}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}

          {/* ── Safety Precautions ───────────────────────────────────────────── */}
          {data.safetyPrecautions.length > 0 && (
            <section aria-label="Safety Precautions">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2.5 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Safety Precautions
              </h4>
              <ul className="space-y-1.5">
                {data.safetyPrecautions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── Expert Consultation Guidance ─────────────────────────────────── */}
          {data.expertConsultationGuidance && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs">
              <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  Expert Consultation Guidance
                </span>
                <span className="text-amber-700 dark:text-amber-400">{data.expertConsultationGuidance}</span>
              </div>
            </div>
          )}

          {/* ── Reference Sources ────────────────────────────────────────────── */}
          {data.referenceSources.length > 0 && (
            <div className="pt-3 border-t border-border flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 shrink-0">
                <BookMarked className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Sources:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.referenceSources.map((src, i) => (
                  <Badge key={i} variant="outline" size="sm" className="text-[11px]">
                    {src}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ── Feedback Section ─────────────────────────────────────────────── */}
          <div className="pt-3 border-t border-border">
            <button
              id="toggle-feedback-section"
              type="button"
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {alreadyFeedback ? 'Feedback Submitted' : 'Share Feedback on this Recommendation'}
              {showFeedback ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4"
                >
                  <FeedbackForm
                    onSubmit={(feedbackData) => onFeedbackSubmit(data._id, feedbackData)}
                    isSubmitting={isFeedbackSubmitting}
                    alreadySubmitted={alreadyFeedback}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
