import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Sprout,
  Activity,
  Layers,
  Thermometer,
  CloudRain,
  Eye,
  RefreshCw,
  HelpCircle,
  FileCheck2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'

export interface ExplanationPayload {
  scientificName?: string
  overview: string
  symptoms: string[]
  causes: string[]
  environmentalConditions: string[]
  impactOnGrowth: string
  earlyWarningSigns: string[]
  severityExplanation: string
  prevention: string[]
  sanitation: string[]
  treatment: {
    generalApproaches: string[]
    chemicalGuidance: string[]
    organicTreatments: string[]
    whenToSeekHelp: string
  }
  disclaimer: string
  language: 'en' | 'hi' | 'as'
  referenceSources: string[]
  modelIdentifier: string
  generatedAt: string
  status?: string
}

interface DiseaseAdvisoryReportProps {
  cropName: string
  diseaseName: string
  confidence: number
  isHealthy?: boolean
  status: string
  imageUrl?: string
  modelVersion?: string
  inferenceDurationMs?: number
  explanation?: ExplanationPayload | null
  onGenerateExplanation: (language: 'en' | 'hi' | 'as') => void
  isGenerating?: boolean
}

export function DiseaseAdvisoryReport({
  cropName,
  diseaseName,
  confidence,
  isHealthy,
  status,
  imageUrl,
  modelVersion = 'EfficientNet-B0-PlantVillage-v1.0',
  inferenceDurationMs,
  explanation,
  onGenerateExplanation,
  isGenerating = false,
}: DiseaseAdvisoryReportProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'as'>(
    (explanation?.language as 'en' | 'hi' | 'as') || 'en',
  )

  const handleLanguageChange = (lang: 'en' | 'hi' | 'as') => {
    setSelectedLanguage(lang)
    onGenerateExplanation(lang)
  }

  const isLowConfidence = status === 'inconclusive' || confidence < 50

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SECTION 1: Machine Learning Model Detection (PyTorch / EfficientNet-B0)   */}
      {/* ========================================================================= */}
      <Card className="border-2 border-primary/20 bg-card overflow-hidden shadow-subtle">
        <div className="bg-primary/10 px-4 py-2.5 border-b border-primary/15 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Layer 1 • Machine Learning Vision Model
            </span>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {modelVersion} {inferenceDurationMs ? `• ${inferenceDurationMs.toFixed(0)}ms` : ''}
          </span>
        </div>

        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {imageUrl && (
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-border shrink-0">
                  <img src={imageUrl} alt={cropName} className="h-full w-full object-cover" />
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Target Specimen: {cropName}
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                  {diseaseName}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={isHealthy ? 'default' : 'destructive'} size="sm">
                    {isHealthy ? 'Healthy Foliage' : 'Disease Detected'}
                  </Badge>
                  {isLowConfidence && (
                    <Badge variant="warning" size="sm">
                      Low Confidence / Inconclusive
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Confidence Score Pill */}
            <div className="w-full sm:w-auto p-3.5 rounded-2xl bg-muted/40 border border-border text-center sm:text-right shrink-0">
              <span className="text-xs text-muted-foreground block">Softmax Confidence</span>
              <span className="text-2xl font-black text-foreground">
                {confidence.toFixed(1)}%
              </span>
              <div className="w-full sm:w-32 h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    confidence >= 80 ? 'bg-green-500' : confidence >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 2 & 3: Gemini AI Explanation & Verified Agricultural Guidance     */}
      {/* ========================================================================= */}
      {!explanation && !isGenerating && (
        <Card className="border border-border bg-card shadow-subtle p-6 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              Generate AI Disease Explanation & Treatment Advisory
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Synthesize institutional research from ICAR, TNAU, and Google Gemini into an actionable
              explanation, symptoms breakdown, prevention checklist, and safe management protocols.
            </p>
          </div>

          {/* Language Selection */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant={selectedLanguage === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('en')}
            >
              English
            </Button>
            <Button
              variant={selectedLanguage === 'hi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('hi')}
            >
              हिन्दी (Hindi)
            </Button>
            <Button
              variant={selectedLanguage === 'as' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLanguage('as')}
            >
              অসমীয়া (Assamese)
            </Button>
          </div>

          <div className="pt-2">
            <Button
              onClick={() => onGenerateExplanation(selectedLanguage)}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Generate Agronomic Advisory
            </Button>
          </div>
        </Card>
      )}

      {isGenerating && (
        <Card className="border border-primary/30 bg-primary/5 p-8 text-center space-y-3">
          <div className="relative mx-auto w-12 h-12">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Consulting Agricultural Knowledge Base & Gemini AI...
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Generating grounded botanical explanation, symptom markers, and authorized extension guidance in{' '}
            <strong className="text-foreground">
              {selectedLanguage === 'hi' ? 'Hindi' : selectedLanguage === 'as' ? 'Assamese' : 'English'}
            </strong>
            ...
          </p>
        </Card>
      )}

      {explanation && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Language Switcher Bar & Metadata Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Advisory Language:</span>
              <div className="flex gap-1.5">
                <Button
                  variant={selectedLanguage === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => handleLanguageChange('en')}
                >
                  English
                </Button>
                <Button
                  variant={selectedLanguage === 'hi' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => handleLanguageChange('hi')}
                >
                  हिन्दी
                </Button>
                <Button
                  variant={selectedLanguage === 'as' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => handleLanguageChange('as')}
                >
                  অসমীয়া
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-muted-foreground">
                Engine: {explanation.modelIdentifier}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onGenerateExplanation(selectedLanguage)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: AI Disease Explanation (Biology, Symptoms, Causes)            */}
          {/* ========================================================================= */}
          <Card className="border border-border bg-card shadow-subtle overflow-hidden">
            <div className="bg-secondary/10 px-4 py-2.5 border-b border-secondary/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-secondary-foreground" />
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                  Layer 2 • AI Disease Explanation & Biology
                </span>
              </div>
              {explanation.scientificName && (
                <span className="text-xs italic text-muted-foreground font-serif">
                  {explanation.scientificName}
                </span>
              )}
            </div>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  Condition Overview
                </h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {explanation.overview}
                </p>
              </div>

              {/* Symptoms & Causes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symptoms */}
                {explanation.symptoms && explanation.symptoms.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-primary" />
                      Key Foliar & Plant Symptoms
                    </h5>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {explanation.symptoms.map((symptom, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Causes & Vectors */}
                {explanation.causes && explanation.causes.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-orange-500" />
                      Pathogen & Primary Causes
                    </h5>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {explanation.causes.map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Environmental Triggers & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explanation.environmentalConditions && explanation.environmentalConditions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CloudRain className="h-4 w-4 text-blue-500" />
                      Conducive Weather & Environment
                    </h5>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {explanation.environmentalConditions.map((env, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Thermometer className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <span>{env}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.impactOnGrowth && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sprout className="h-4 w-4 text-emerald-500" />
                      Impact on Crop Growth & Yield
                    </h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {explanation.impactOnGrowth}
                    </p>
                    {explanation.severityExplanation && (
                      <p className="text-xs font-semibold text-foreground pt-1 border-t border-border/50">
                        Severity Rating: {explanation.severityExplanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* SECTION 3: Grounded Treatment & Prevention (Agricultural Extensions)      */}
          {/* ========================================================================= */}
          <Card className="border border-border bg-card shadow-subtle overflow-hidden">
            <div className="bg-emerald-500/10 px-4 py-2.5 border-b border-emerald-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Layer 3 • Grounded Agronomic & Treatment Advisory
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium">
                Standard ICAR / Extension Protocols
              </span>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Prevention & Sanitation Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explanation.prevention && explanation.prevention.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Preventive Agronomic Measures
                    </h5>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {explanation.prevention.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {explanation.sanitation && explanation.sanitation.length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                    <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-primary" />
                      Hygiene & Residue Sanitation
                    </h5>
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {explanation.sanitation.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Treatment Approaches */}
              {explanation.treatment && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Recommended Treatment Approaches
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* General / Cultural */}
                    <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-bold text-foreground block">
                        Cultural / Field Management
                      </span>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {explanation.treatment.generalApproaches.map((app, idx) => (
                          <li key={idx}>• {app}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Organic / Bio-control */}
                    <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                        Organic & Bio-Control Options
                      </span>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {explanation.treatment.organicTreatments.map((org, idx) => (
                          <li key={idx}>• {org}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Chemical Principles */}
                    <div className="p-3.5 rounded-xl bg-card border border-border space-y-1.5">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                        Approved Chemical Principles
                      </span>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {explanation.treatment.chemicalGuidance.map((chem, idx) => (
                          <li key={idx}>• {chem}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* When to Seek Help Box */}
                  {explanation.treatment.whenToSeekHelp && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
                      <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h6 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          When to Seek In-Person Agricultural Assistance
                        </h6>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          {explanation.treatment.whenToSeekHelp}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Authoritative References */}
              {explanation.referenceSources && explanation.referenceSources.length > 0 && (
                <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground font-semibold">Institutional References:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {explanation.referenceSources.map((ref, idx) => (
                      <Badge key={idx} variant="outline" size="sm" className="text-[11px]">
                        {ref}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* SECTION 4: Mandatory Safety & Professional Diagnosis Disclaimer           */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-start gap-3 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-foreground block">
                Official Agricultural Advisory Disclaimer
              </strong>
              <p>{explanation.disclaimer}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
