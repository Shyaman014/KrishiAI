import { Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingStateProps {
  message?: string
  subtext?: string
  className?: string
  fullScreen?: boolean
}

export function LoadingState({
  message = 'Loading KrishiAI...',
  subtext = 'Fetching the latest agronomic intelligence',
  className,
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className,
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center mb-4">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-60" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-premium">
          <Sprout className="h-7 w-7 animate-bounce" />
        </div>
      </div>
      <h4 className="text-base font-semibold text-foreground tracking-tight">{message}</h4>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{subtext}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

