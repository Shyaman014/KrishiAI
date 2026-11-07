import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  ScanLine,
  Sprout,
  CloudSun,
  Compass,
  TrendingUp,
  Bot,
  History,
  Settings,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  Search,
  AlertTriangle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { useApiHealth } from '@/hooks/useApiHealth'
import { useNotifications, NotificationItem } from '@/hooks/useNotifications'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip'
import { Badge } from '@/components/ui/Badge'
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog'

interface NavItem {
  title: string
  to: string
  icon: React.ElementType
  badge?: string
}

const navItems: NavItem[] = [
  { title: 'Dashboard', to: '/app', icon: LayoutDashboard },
  { title: 'Crop Disease Scanner', to: '/app/scanner', icon: ScanLine, badge: 'AI' },
  { title: 'My Crops', to: '/app/crops', icon: Sprout },
  { title: 'Weather Advisory', to: '/app/weather', icon: CloudSun },
  { title: 'Crop Recommendations', to: '/app/recommendations', icon: Compass },
  { title: 'Market Prices', to: '/app/market', icon: TrendingUp },
  { title: 'AI Assistant', to: '/app/assistant', icon: Bot, badge: 'Smart' },
  { title: 'Scan History', to: '/app/history', icon: History },
  { title: 'Notifications', to: '/app/notifications', icon: Bell },
  { title: 'Settings', to: '/app/settings', icon: Settings },
]

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false)

  const { theme, toggleTheme, isDark } = useTheme()
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const { data: health } = useApiHealth()
  const location = useLocation()
  const navigate = useNavigate()

  // Real-time notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ limit: 5 })

  const displayName = user?.fullName || 'Ramesh Patel'
  const displayEmail = user?.email || 'ramesh@krishiai.farm'
  const initials =
    displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'RP'
  const displayRole = user?.role === 'admin' ? 'Administrator' : 'Lead Farmer'

  // Close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  const currentPage =
    navItems.find(
      (item) =>
        item.to === location.pathname ||
        (item.to !== '/app' && location.pathname.startsWith(item.to)),
    ) || navItems[0]

  const handleLogout = async () => {
    setShowLogoutDialog(false)
    await logout()
    navigate('/login')
  }

  const handleClearNotifications = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast.info('All notifications marked as read')
      },
    })
  }

  const handleNotificationClick = (n: NotificationItem) => {
    if (!n.isRead) {
      markAsRead(n.id)
    }
    if (n.resourceType === 'scan' && n.relatedResourceId) {
      navigate(`/app/history/${n.relatedResourceId}`)
    } else if (n.resourceType === 'market') {
      navigate('/app/market')
    } else if (n.resourceType === 'weather') {
      navigate('/app/weather')
    } else if (n.resourceType === 'crop_recommendation') {
      navigate('/app/recommendations')
    } else {
      navigate('/app/notifications')
    }
  }

  const formatNotifTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime()
      const mins = Math.floor(diffMs / 60000)
      if (mins < 1) return 'Just now'
      if (mins < 60) return `${mins}m ago`
      const hrs = Math.floor(diffMs / 3600000)
      if (hrs < 24) return `${hrs}h ago`
      return `${Math.floor(diffMs / 86400000)}d ago`
    } catch {
      return 'Recent'
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      {/* ===================== Top Navigation Bar ===================== */}
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors">
        {/* Left Section: Branding & Toggle */}
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5 text-primary" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {/* Logo / Brand */}
          <Link
            to="/app"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-foreground hover:opacity-90 transition-opacity"
          >
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
              <Sprout className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-foreground font-extrabold flex items-center gap-1.5">
                Krishi<span className="text-primary">AI</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary hidden sm:inline-block">
                  SaaS
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground font-normal leading-tight hidden sm:block">
                Agricultural Intelligence
              </span>
            </div>
          </Link>

          {/* Breadcrumb (desktop) */}
          <div className="hidden lg:flex items-center gap-2 pl-4 ml-4 border-l border-border text-xs text-muted-foreground">
            <Link to="/app" className="hover:text-foreground transition-colors">
              KrishiAI
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{currentPage.title}</span>
          </div>
        </div>

        {/* Right Section: Status, Search, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Phase 1 Backend Health Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-[11px] font-medium text-muted-foreground border border-border">
            <span
              className={`h-2 w-2 rounded-full ${
                health?.status === 'ok'
                  ? 'bg-success'
                  : health
                  ? 'bg-warning'
                  : 'bg-muted-foreground/50 animate-pulse'
              }`}
            />
            <span>API: {health?.status ?? 'Connecting...'}</span>
          </div>

          {/* Search Trigger Simulation */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-input bg-background text-xs text-muted-foreground w-44 lg:w-56">
            <Search className="h-3.5 w-3.5" />
            <span className="truncate">Search crops, pests, logs...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              ⌘K
            </kbd>
          </div>

          {/* Notification Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card animate-pulse" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-88 p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0 text-sm font-semibold flex items-center gap-1.5">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="h-4 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    onClick={handleClearNotifications}
                    className="text-xs text-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="space-y-1 py-1 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 p-2.5 cursor-pointer rounded-lg ${
                        n.isRead ? 'opacity-80' : 'bg-primary/5 font-medium'
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          n.type === 'scan_completed'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : n.type === 'scan_failed'
                            ? 'bg-rose-500/15 text-rose-600'
                            : n.type === 'weather_alert'
                            ? 'bg-amber-500/15 text-amber-600'
                            : n.type === 'price_target_reached'
                            ? 'bg-indigo-500/15 text-indigo-600'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {n.type === 'scan_completed' ? (
                          <ScanLine className="h-3.5 w-3.5" />
                        ) : n.type === 'scan_failed' ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : n.type === 'weather_alert' ? (
                          <CloudSun className="h-3.5 w-3.5" />
                        ) : n.type === 'price_target_reached' ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <Sprout className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-foreground truncate">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatNotifTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-snug line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-1 text-center">
                <Link
                  to="/app/notifications"
                  className="text-xs font-medium text-primary hover:underline block py-1"
                >
                  Open Notification Center
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-warning transition-transform duration-200 rotate-0 hover:rotate-45" />
                ) : (
                  <Moon className="h-5 w-5 text-muted-foreground transition-transform duration-200 hover:-rotate-12" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Current: {theme} mode</span>
            </TooltipContent>
          </Tooltip>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 p-1.5 pl-2 rounded-full hover:bg-muted border border-transparent hover:border-border transition-all cursor-pointer"
                aria-label="User profile menu"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center border border-primary/30">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {displayRole}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <div className="px-2.5 py-2">
                <p className="text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="success" size="sm" dot>
                    Verified Farm (24.5 Ac)
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Farmer Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/settings" className="flex items-center gap-2 cursor-pointer">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Farm & Field Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ===================== Main Body Layout ===================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ===================== Desktop Sidebar ===================== */}
        <aside
          className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0 select-none ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Farm Info Card */}
          <div className="p-4 border-b border-border/60">
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs">
                  PA
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Patel Agri Fields</p>
                  <p className="text-[11px] text-muted-foreground">Punjab, India • 24.5 Ac</p>
                </div>
                <Badge variant="success" size="sm" dot>
                  Rabi
                </Badge>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.to === '/app'
                  ? location.pathname === '/app' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to)

              const linkContent = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span
                          className={`ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <span>{item.title}</span>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return linkContent
            })}
          </nav>

          {/* Sidebar Bottom Banner / Quick Info */}
          {!isCollapsed && (
            <div className="p-4 border-t border-border/60">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                  <Bot className="h-4 w-4" />
                  <span>KrishiAI Advisor</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed mb-2">
                  Need instant crop advice or spray dosage calculations?
                </p>
                <Link
                  to="/app/assistant"
                  className="inline-block text-[11px] font-semibold text-primary hover:underline"
                >
                  Ask AI Advisor →
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* ===================== Mobile Drawer ===================== */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              />

              {/* Drawer Content */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border p-4 flex flex-col md:hidden shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <Sprout className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-base">KrishiAI</span>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Farm Info */}
                <div className="my-3 p-3 rounded-xl bg-muted/60 text-xs">
                  <p className="font-semibold text-foreground">Patel Agri Fields</p>
                  <p className="text-[11px] text-muted-foreground">24.5 Acres • Rabi Season</p>
                </div>

                {/* Mobile Nav Links */}
                <nav className="flex-1 space-y-1 overflow-y-auto py-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      item.to === '/app'
                        ? location.pathname === '/app' || location.pathname === '/dashboard'
                        : location.pathname.startsWith(item.to)

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span
                            className={`ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    )
                  })}
                </nav>

                {/* Mobile Drawer Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground">{displayRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileOpen(false)
                      setShowLogoutDialog(true)
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ===================== Main Page Content Area ===================== */}
        <main className="flex-1 overflow-y-auto">
          {/* Demo Static Mode Notice Banner */}
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-xs font-medium text-primary flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>
              <strong>Demonstration Mode:</strong> Displaying static UI/UX prototype data for KrishiAI Phase 2 design system.
            </span>
          </div>

          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Confirmation Dialog for Logout */}
      <ConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Sign Out of KrishiAI"
        description="Are you sure you want to sign out? Any unsaved scanner inputs will be cleared."
        confirmText="Sign Out"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  )
}

