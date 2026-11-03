import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sprout, Mail, Lock, User, Phone, Globe, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { useAuth, UserLanguage } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState<UserLanguage>('en')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { register } = useAuth()
  const navigate = useNavigate()

  const passwordMeetsReqs = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    if (!passwordMeetsReqs.length || !passwordMeetsReqs.hasUpper || !passwordMeetsReqs.hasLower || !passwordMeetsReqs.hasNumber) {
      setErrorMessage('Please ensure your password meets all strength criteria.')
      return
    }

    setIsSubmitting(true)
    try {
      await register({
        fullName,
        email,
        phoneNumber,
        password,
        confirmPassword,
        preferredLanguage,
      })
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
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
            Create Your Farmer Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Join thousands of growers leveraging artificial intelligence to maximize crop yields.
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-premium border-border/80">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Patel"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
                autoComplete="name"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="farmer@krishiai.farm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                  autoComplete="email"
                />

                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  autoComplete="tel"
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold tracking-wide text-foreground/90 uppercase">
                  Preferred Advisory Language
                </label>
                <Select
                  value={preferredLanguage}
                  onValueChange={(val) => setPreferredLanguage(val as UserLanguage)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select Language" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (India)</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                    <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                    <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
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
                  autoComplete="new-password"
                />

                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Password Requirements Checklist */}
              {password && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border text-[11px] space-y-1 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        passwordMeetsReqs.length ? 'text-success' : 'text-muted-foreground/50'
                      }`}
                    />
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        passwordMeetsReqs.hasUpper && passwordMeetsReqs.hasLower
                          ? 'text-success'
                          : 'text-muted-foreground/50'
                      }`}
                    />
                    <span>Uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        passwordMeetsReqs.hasNumber ? 'text-success' : 'text-muted-foreground/50'
                      }`}
                    />
                    <span>At least one number</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`h-3.5 w-3.5 ${
                        passwordMeetsReqs.matches ? 'text-success' : 'text-muted-foreground/50'
                      }`}
                    />
                    <span>Passwords match</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold shadow-premium mt-2"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Create KrishiAI Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  )
}

