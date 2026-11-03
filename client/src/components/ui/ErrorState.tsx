import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
  details?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this data. Please try again.',
  onRetry,
  isRetrying = false,
  className,
  details,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border border-destructive/20 bg-destructive/5',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-4 shadow-sm">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">
        {message}
      </p>

      {details && (
        <pre className="text-xs font-mono bg-background/80 border border-border p-3 rounded-lg max-w-md text-left overflow-x-auto text-destructive mb-5">
          {details}
        </pre>
      )}

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  )
}
