import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  CloudSun,
  TrendingUp,
  ScanLine,
  Sprout,
  CheckCheck,
  Trash2,
  ArrowRight,
  Filter,
  RefreshCw,
} from 'lucide-react'
import { useNotifications, NotificationItem } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/contexts/ToastContext'

export default function NotificationCenterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [page, setPage] = useState<number>(1)

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllRead,
  } = useNotifications({ page, limit: 15, unreadOnly })

  const filteredNotifications = notifications.filter((n) => {
    if (selectedType === 'all') return true
    if (selectedType === 'scans') return n.type === 'scan_completed' || n.type === 'scan_failed'
    if (selectedType === 'weather') return n.type === 'weather_alert'
    if (selectedType === 'market') return n.type === 'price_target_reached'
    if (selectedType === 'advisory') return n.type === 'farming_advisory'
    return true
  })

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'scan_completed':
        return <ScanLine className="h-5 w-5 text-emerald-500" />
      case 'scan_failed':
        return <AlertTriangle className="h-5 w-5 text-rose-500" />
      case 'weather_alert':
        return <CloudSun className="h-5 w-5 text-amber-500" />
      case 'price_target_reached':
        return <TrendingUp className="h-5 w-5 text-indigo-500" />
      case 'farming_advisory':
        return <Sprout className="h-5 w-5 text-primary" />
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const handleActionClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    if (notification.resourceType === 'scan' && notification.relatedResourceId) {
      navigate(`/app/history/${notification.relatedResourceId}`)
    } else if (notification.resourceType === 'market') {
      navigate('/app/market')
    } else if (notification.resourceType === 'weather') {
      navigate('/app/weather')
    } else if (notification.resourceType === 'crop_recommendation') {
      navigate('/app/recommendations')
    } else {
      navigate('/app')
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead(undefined, {
      onSuccess: () => {
        toast.success('All notifications marked as read.')
      },
      onError: () => {
        toast.error('Failed to mark all notifications as read.')
      },
    })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(id, {
      onSuccess: () => {
        toast.success('Notification deleted.')
      },
      onError: () => {
        toast.error('Failed to delete notification.')
      },
    })
  }

  const formatRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      const diffMs = Date.now() - d.getTime()
      const diffMins = Math.floor(diffMs / (60 * 1000))
      const diffHours = Math.floor(diffMs / (3600 * 1000))
      const diffDays = Math.floor(diffMs / (24 * 3600 * 1000))

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      return `${diffDays}d ago`
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Notification Center
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs bg-primary text-primary-foreground font-semibold">
                    {unreadCount} new
                  </Badge>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Real-time agricultural updates, AI scan completions, mandi price alerts & weather advisories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Category Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Unread vs All */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
          <button
            onClick={() => {
              setUnreadOnly(false)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !unreadOnly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => {
              setUnreadOnly(true)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              unreadOnly
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="h-4 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5 shrink-0" />
          {[
            { id: 'all', label: 'All Types' },
            { id: 'scans', label: 'AI Scans' },
            { id: 'weather', label: 'Weather' },
            { id: 'market', label: 'Market Prices' },
            { id: 'advisory', label: 'Advisories' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                selectedType === cat.id
                  ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                  : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
            description={
              unreadOnly
                ? 'All agricultural notifications have been reviewed. Check back when new scan or weather alerts occur.'
                : 'You have no notifications yet. Real events such as AI scan completions, mandi price targets, and weather advisories will appear here.'
            }
          />
        ) : (
          <AnimatePresence initial={false}>
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
              >
                <Card
                  onClick={() => handleActionClick(notification)}
                  className={`border transition-all cursor-pointer hover:shadow-md ${
                    notification.isRead
                      ? 'border-border bg-card/60 hover:bg-card'
                      : 'border-primary/30 bg-primary/5 shadow-sm'
                  }`}
                >
                  <CardContent className="p-4 flex items-start gap-3.5 sm:gap-4">
                    {/* Icon container */}
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                        notification.isRead
                          ? 'bg-muted/70 border-border text-muted-foreground'
                          : 'bg-card border-primary/20 shadow-xs'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <h3
                            className={`text-sm truncate ${
                              notification.isRead
                                ? 'font-medium text-foreground'
                                : 'font-semibold text-foreground'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
                          )}
                        </div>

                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
                        <div className="flex items-center gap-2 text-[11px] text-primary font-medium hover:underline">
                          <span>View Details</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded hover:bg-muted transition-colors"
                            >
                              Mark read
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} notifications)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
