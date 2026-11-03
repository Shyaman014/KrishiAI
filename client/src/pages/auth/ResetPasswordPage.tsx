import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sprout, Lock, Key, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''

  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const { resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!token) {
      setErrorMessage('Reset token is missing. Please use the link provided in your recovery email.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, password, confirmPassword)
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Password reset link is invalid or expired.'
      setErrorMessage(msg)
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
            Set New Account Password
          </h1>
          <p className="text-xs text-muted-foreground">
            Create a strong, new password to regain access to your farm dashboard.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-premium border-border/80">
          <CardContent className="p-6 sm:p-8">
            {isSuccess ? (
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-foreground">Password Successfully Reset!</h3>
                <p className="text-xs text-muted-foreground">
                  Your credentials have been updated and previous sessions invalidated. Redirecting to
                  Sign In...
                </p>
                <Link to="/login">
                  <Button className="w-full mt-2">Sign In Now</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                {!tokenFromUrl && (
                  <Input
                    label="Reset Token"
                    placeholder="Paste single-use token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    leftIcon={<Key className="h-4 w-4" />}
                    required
                  />
                )}

                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  required
                />

                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold shadow-premium"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

