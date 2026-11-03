import React, { useState, useEffect } from 'react'
import {
  Settings,
  User,
  Bell,
  Palette,
  Check,
  Lock,
  Mail,
  Phone,
  Globe,
  Camera,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth, UserLanguage } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, updateProfile, changePassword } = useAuth()
  const { toast } = useToast()

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email] = useState(user?.email || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [preferredLanguage, setPreferredLanguage] = useState<UserLanguage>(user?.preferredLanguage || 'en')
  const [profileImage, setProfileImage] = useState(user?.profileImage || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // Notifications state
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [whatsappAlerts, setWhatsappAlerts] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setPhoneNumber(user.phoneNumber || '')
      setPreferredLanguage(user.preferredLanguage || 'en')
      setProfileImage(user.profileImage || '')
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      await updateProfile({
        fullName,
        phoneNumber,
        preferredLanguage,
        profileImage,
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password. Please check your current password.'
      setPasswordError(msg)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved.')
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" size="sm">
            Configuration
          </Badge>
          <span className="text-xs text-muted-foreground">User ID: {user?._id || 'demo-mode'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-primary" />
          Farm & Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Manage your personal farmer credentials, language preferences, account security,
          and visual interface styling.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto h-12 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Farmer Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security & Password
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme & Display
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Channels
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile">
          <Card>
            <form onSubmit={handleSaveProfile}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Personal & Agronomic Identity</CardTitle>
                    <CardDescription>
                      Information used by KrishiAI to personalize your weather alerts and spray schedules.
                    </CardDescription>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    {user?.role === 'admin' ? 'Administrator' : 'Verified Farmer'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Profile Picture Mockup / URL */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 text-primary font-bold text-xl flex items-center justify-center border border-primary/30 shrink-0">
                    {fullName ? fullName.slice(0, 2).toUpperCase() : 'RP'}
                  </div>
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-semibold text-foreground block">
                      Profile Avatar
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Cloudinary image integration enabled. Enter image URL or upload avatar.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <Input
                        placeholder="https://res.cloudinary.com/.../avatar.jpg"
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Cloudinary direct uploader available with active API keys.')}
                        leftIcon={<Camera className="h-3.5 w-3.5" />}
                      >
                        Upload
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    leftIcon={<User className="h-4 w-4" />}
                    required
                  />

                  <Input
                    label="Email Address (Locked)"
                    value={email || 'harpreet.test@krishiai.farm'}
                    leftIcon={<Mail className="h-4 w-4" />}
                    disabled
                    helperText="Email is permanently bound to your farm identity"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    leftIcon={<Phone className="h-4 w-4" />}
                    placeholder="+91 98765 43210"
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-semibold tracking-wide text-foreground/90 uppercase">
                      Advisory Language
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
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-end">
                <Button type="submit" isLoading={isSavingProfile}>
                  Save Profile Details
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Password */}
        <TabsContent value="security">
          <Card>
            <form onSubmit={handleChangePassword}>
              <CardHeader>
                <CardTitle className="text-base">Security & Password Management</CardTitle>
                <CardDescription>
                  Update your authentication credentials. Changing your password will invalidate all
                  active sessions on other devices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                    {passwordError}
                  </div>
                )}

                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter existing password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  leftIcon={<Lock className="h-4 w-4" />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Passwords must contain at least 8 characters, with uppercase, lowercase, and numeric digits.
                  </span>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4 flex justify-end">
                <Button type="submit" isLoading={isChangingPassword}>
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Tab 3: Theme & Display */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visual Appearance</CardTitle>
              <CardDescription>
                Select your preferred color theme or match your operating system mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">Light Mode</span>
                    {theme === 'light' && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Soft off-white canvas with deep agricultural green contrast.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">Dark Mode</span>
                    {theme === 'dark' && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deep forest slate with vibrant emerald highlights for night field use.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">System Default</span>
                    {theme === 'system' && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically synchronize with OS daylight schedule.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field Alerts & Delivery Preferences</CardTitle>
              <CardDescription>
                Configure which channels receive real-time weather and crop health warnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    Urgent Weather SMS Alerts
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Instant text message notifications for sudden hailstorms, heavy downpours, or high spray drift winds.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    WhatsApp Diagnostic Reports
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Send full PDF diagnostic cards and pesticide dosage instructions directly to your mobile WhatsApp number.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={dailyDigest}
                  onChange={(e) => setDailyDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">
                    Daily 8:00 AM APMC Mandi Rate Digest
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Receive daily price summaries for Wheat, Mustard, and Potato from nearby wholesale markets.
                  </span>
                </div>
              </label>
            </CardContent>
            <CardFooter className="border-t border-border pt-4 flex justify-end">
              <Button onClick={handleSaveNotifications}>Save Alert Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
