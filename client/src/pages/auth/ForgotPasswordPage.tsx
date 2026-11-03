import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sprout, Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [devToken, setDevToken] = useState('')

  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const token = await forgotPassword(email)
      setIsSent(true)
      if (token) setDevToken(token)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-foreground hover:opacity-90"
          >
            <div className="h-11 w-11 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-premium">
              <Sprout className="h-6 w-6" />
            </div>
            <span className="font-extrabold text-foreground">
              Krishi<span className="text-primary">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Recover Account Password
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter your registered email address and we will generate secure recovery instructions.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-premium border-border/80">
          <CardContent className="p-6 sm:p-8">
            {isSent ? (
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  Recovery Instructions Dispatched
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an active account is registered with <strong>{email}</strong>, a single-use
                  reset token valid for 1 hour has been processed.
                </p>

                {devToken && (
                  <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-left space-y-2 mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                      Local Development Token:
                    </span>
                    <Link
                      to={`/reset-password?token=${devToken}`}
                      className="text-xs font-semibold text-primary hover:underline break-all block"
                    >
                      Click here to simulate reset link →
                    </Link>
                  </div>
                )}

                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="farmer@krishiai.farm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold shadow-premium"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Send Recovery Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

