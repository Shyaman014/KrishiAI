import { Link } from 'react-router-dom'
import {
  Sprout,
  ScanLine,
  CloudSun,
  Bot,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useApiHealth } from '@/hooks/useApiHealth'
import { useTheme } from '@/contexts/ThemeContext'

const features = [
  {
    icon: ScanLine,
    title: 'Computer Vision Disease Scanner',
    description:
      'Detect foliage diseases, rusts, blights, and pests within seconds using our deep learning agricultural vision models.',
    tag: 'Instant Diagnostic',
  },
  {
    icon: CloudSun,
    title: 'Hyper-Local Weather Telemetry',
    description:
      'Farm-level micro-weather forecasts with computed evapotranspiration rates and spray efficacy windows.',
    tag: 'Spray Advisory',
  },
  {
    icon: Bot,
    title: 'Expert Agronomic AI Advisor',
    description:
      'Bilingual conversational intelligence trained on agronomic research packages, pesticide safety, and regional crop cycles.',
    tag: '24/7 Guidance',
  },
  {
    icon: Sprout,
    title: 'Soil-to-Crop Planning',
    description:
      'Data-driven crop recommendations matched to your soil chemistry, irrigation capacity, and seasonal market profit.',
    tag: 'Max Profitability',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Mandi Price Benchmarks',
    description:
      'Live wholesale rates from APMC markets across India compared against official MSP benchmarks.',
    tag: 'Market Intelligence',
  },
  {
    icon: ShieldCheck,
    title: 'Field Audit & Treatment Logbook',
    description:
      'Keep a verifiable record of all applied biological and chemical interventions for quality certification.',
    tag: 'Field Compliance',
  },
]

const steps = [
  {
    step: '01',
    title: 'Capture Crop Foliage',
    description: 'Take a clear photograph of affected leaves or stems with any mobile smartphone camera.',
  },
  {
    step: '02',
    title: 'Instant AI Diagnosis',
    description: 'Our neural vision pipeline segments pathology markers and scores disease confidence in under 2 seconds.',
  },
  {
    step: '03',
    title: 'Execute Targeted Action',
    description: 'Receive precise chemical and organic dosage plans timed with your local weather spray window.',
  },
]

const placeholderTestimonials = [
  {
    quote:
      'Detecting yellow rust early on my wheat plot saved at least 15% of our seasonal harvest before the infection could spread.',
    name: 'Rajesh Sharma',
    role: 'Wheat Farmer (18 Acres)',
    location: 'Ludhiana, Punjab',
    badge: 'Demonstration Persona',
  },
  {
    quote:
      'The micro-weather spray window guidance prevented me from wasting expensive foliar nutrients right before unexpected rains.',
    name: 'Anita Deshmukh',
    role: 'Mustard & Soybean Cultivator',
    location: 'Nashik, Maharashtra',
    badge: 'Demonstration Persona',
  },
  {
    quote:
      'Having mandi rates and customized crop recommendations in one app made planting decisions much simpler this Rabi season.',
    name: 'Venkatesh Rao',
    role: 'Cotton & Pulses Grower',
    location: 'Guntur, Andhra Pradesh',
    badge: 'Demonstration Persona',
  },
]

export default function HomePage() {
  const { data: health, isLoading: isHealthLoading, isError: isHealthError } = useApiHealth()
  const { toggleTheme, isDark } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* ===================== Public Top Navbar ===================== */}
      <header className="sticky top-0 z-50 h-16 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/25">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="leading-none text-foreground font-extrabold flex items-center gap-1">
            Krishi<span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#diagnostics" className="hover:text-foreground transition-colors">
            AI Scanner
          </a>
          <a href="#testimonials" className="hover:text-foreground transition-colors">
            Farmer Feedback
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle dark/light theme"
          >
            {isDark ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5" />}
          </button>

          <Link to="/app">
            <Button size="sm" className="shadow-premium">
              Launch Platform →
            </Button>
          </Link>
        </div>
      </header>

      {/* ===================== Hero Section ===================== */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 text-center border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Agricultural Intelligence Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
            Smart Farming, <br />
            <span className="text-primary bg-clip-text">Powered by Artificial Intelligence.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Diagnose crop pathologies in seconds, receive hyper-local spray windows, and access
            market intelligence to protect your yields and maximize farm profitability.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/app">
              <Button
                size="lg"
                className="w-full sm:w-auto shadow-premium text-base px-8 h-12"
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Get Started
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8 h-12"
              >
                Explore Platform Features
              </Button>
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" /> 98% Disease Detection Accuracy
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Hyper-Local Weather Telemetry
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Free for Smallholder Farmers
            </span>
          </div>
        </div>
      </section>

      {/* ===================== Live API Status Banner ===================== */}
      <section className="border-b border-border bg-card/60 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Core Services Status:</span>
            {isHealthLoading && (
              <span className="text-muted-foreground flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                Connecting to backend...
              </span>
            )}
            {isHealthError && (
              <span className="text-destructive flex items-center gap-1 font-medium">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Backend offline (Demo UI operating)
              </span>
            )}
            {health && (
              <span className="text-primary flex items-center gap-1 font-medium">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Server Online ({health.service} • {health.status})
              </span>
            )}
          </div>

          <Link
            to="/app"
            className="text-primary hover:underline font-semibold flex items-center gap-1 text-[11px]"
          >
            Open Dashboard <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* ===================== Key Features Grid ===================== */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <Badge variant="default" size="sm">
            Core Modules
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Complete Agronomic Intelligence Stack
          </h2>
          <p className="text-sm text-muted-foreground">
            Built from the ground up for modern agriculture, precision farming, and sustainable yields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <Card key={idx} hover className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" size="sm">
                      {feat.tag}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feat.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed mt-2">
                    {feat.description}
                  </CardDescription>
                </CardHeader>
                <div className="p-6 pt-0">
                  <Link
                    to="/app"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    Explore module <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ===================== How KrishiAI Works ===================== */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/40 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="secondary" size="sm">
              Simple 3-Step Workflow
            </Badge>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              From Diagnosis to Field Action
            </h2>
            <p className="text-sm text-muted-foreground">
              Empowering farmers with instant guidance right in the field without waiting for soil lab appointments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-card border border-border space-y-3 relative shadow-subtle"
              >
                <span className="text-4xl font-black text-primary/30 block font-mono">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== AI Crop Scanning Preview ===================== */}
      <section id="diagnostics" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-4">
            <Badge variant="default" size="sm">
              Interactive Diagnostic Preview
            </Badge>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Early Detection Stops Crop Failure
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fungal rusts, blights, and leaf miners can devastate up to 40% of crop yield within 72 hours of visual emergence. KrishiAI identifies early micro-pustules before symptoms become widespread.
            </p>
            <div className="pt-2">
              <Link to="/app/scanner">
                <Button size="lg" leftIcon={<ScanLine className="h-5 w-5" />}>
                  Test Disease Scanner Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Card className="border-primary/25 shadow-premium overflow-hidden">
              <div className="bg-primary/10 p-4 border-b border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono font-semibold ml-2 text-foreground">
                    KrishiAI Vision Engine • Live Specimen
                  </span>
                </div>
                <Badge variant="success" size="sm">96.4% Match</Badge>
              </div>

              <CardContent className="p-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">Wheat Specimen (North Plot #4)</p>
                    <p className="text-[11px] text-muted-foreground">Pathology: Puccinia triticina (Brown Rust)</p>
                  </div>
                  <Badge variant="warning" dot>Action Required</Badge>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Immediate Remediation:</span>
                  <p className="text-muted-foreground leading-relaxed">
                    Apply Propiconazole 25% EC @ 1ml/liter during evening calm hours. Expected recovery time: 5 to 7 days.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===================== Testimonials (Placeholder Clearly Marked) ===================== */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="outline" size="sm">
              Demonstration Content
            </Badge>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
              Designed With Real Farmer Workflows in Mind
            </h2>
            <p className="text-xs text-muted-foreground">
              <em>Note: The following profiles illustrate planned user stories and target farming personas.</em>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {placeholderTestimonials.map((t, idx) => (
              <Card key={idx} className="flex flex-col justify-between p-6">
                <p className="text-xs text-foreground/90 italic leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.name}</p>
                      <p className="text-[11px] text-muted-foreground">{t.role}</p>
                      <span className="text-[10px] text-muted-foreground/80 block">{t.location}</span>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {t.badge}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Pre-Footer CTA ===================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/15 via-background to-background text-center border-t border-border">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Ready to Experience Modern Agricultural Intelligence?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Explore our complete UI/UX design system with live interactive mockups across disease scanning,
            micro-weather, and market pricing.
          </p>
          <div className="pt-2">
            <Link to="/app">
              <Button size="lg" className="shadow-premium px-8">
                Launch KrishiAI Dashboard →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== Public Footer ===================== */}
      <footer className="border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-base text-foreground">
              <div className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <Sprout className="h-4 w-4" />
              </div>
              <span>KrishiAI</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              AI-powered agricultural assistance platform helping farmers detect crop diseases, receive agronomic advisories, and track market rates.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider mb-3 text-[11px]">
              Platform Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/app/scanner" className="hover:text-foreground transition-colors">
                  Crop Disease Scanner
                </Link>
              </li>
              <li>
                <Link to="/app/weather" className="hover:text-foreground transition-colors">
                  Weather & Spray Advisory
                </Link>
              </li>
              <li>
                <Link to="/app/crops" className="hover:text-foreground transition-colors">
                  My Crop Management
                </Link>
              </li>
              <li>
                <Link to="/app/market" className="hover:text-foreground transition-colors">
                  Mandi APMC Rates
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider mb-3 text-[11px]">
              Agronomic Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/app/assistant" className="hover:text-foreground transition-colors">
                  Ask AI Advisor
                </Link>
              </li>
              <li>
                <Link to="/app/recommendations" className="hover:text-foreground transition-colors">
                  Soil-to-Crop Planning
                </Link>
              </li>
              <li>
                <Link to="/app/history" className="hover:text-foreground transition-colors">
                  Diagnostic History Audit
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground uppercase tracking-wider mb-3 text-[11px]">
              Project Status
            </h4>
            <p className="text-[11px] leading-relaxed mb-2">
              Phase 2: Premium UI/UX Design System Prototype. All components, navigation links, and views are static demonstration mockups.
            </p>
            <span className="text-[10px] text-muted-foreground/75 block">
              © {new Date().getFullYear()} KrishiAI. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
