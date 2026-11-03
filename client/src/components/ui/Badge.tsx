import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20',
        secondary:
          'bg-secondary/15 text-secondary border border-secondary/25',
        success:
          'bg-success/15 text-success border border-success/30 dark:bg-success/20',
        warning:
          'bg-warning/15 text-warning border border-warning/30 dark:bg-warning/20',
        destructive:
          'bg-destructive/15 text-destructive border border-destructive/30 dark:bg-destructive/20',
        info:
          'bg-info/15 text-info border border-info/30 dark:bg-info/20',
        outline:
          'text-foreground border border-border bg-background',
      },
      size: {
        default: 'text-xs px-2.5 py-0.5',
        sm: 'text-[11px] px-2 py-0.2',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  const dotColorMap: Record<string, string> = {
    default: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    info: 'bg-info',
    outline: 'bg-muted-foreground',
  }

  const dotColor = dotColorMap[variant || 'default'] || 'bg-primary'

  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor)} />}
      {children}
    </div>
  )
}

