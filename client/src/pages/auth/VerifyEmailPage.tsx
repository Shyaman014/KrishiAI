import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sprout, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')

  const { verifyEmail } = useAuth()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token was not found in the link.')
      return
    }

    verifyEmail(token)
      .then(() => {
        setStatus('success')
        setMessage('Your email address has been verified. Your farmer account is now active.')
      })
      .catch((err: unknown) => {
        setStatus('error')
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Email verification token is invalid or has expired.'
        setMessage(msg)
      })
  }, [token, verifyEmail])

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
            Account Email Verification
          </h1>
        </div>

        {/* Card */}
        <Card className="shadow-premium border-border/80">
          <CardContent className="p-8 text-center space-y-4">
            {status === 'verifying' && (
              <div className="py-6 space-y-3">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-foreground">Verifying security token...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Verification Confirmed</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button className="w-full shadow-premium" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Proceed to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="h-14 w-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center mx-auto">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Verification Failed</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

