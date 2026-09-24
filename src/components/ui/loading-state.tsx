import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { PageSkeleton } from '@/components/ui/skeletons'

export interface LoadingStateProps {
  label?: string
  className?: string
  fullPage?: boolean
  /** Prefer skeleton layout over spinner */
  variant?: 'spinner' | 'table' | 'dashboard' | 'detail' | 'form'
}

export function LoadingState({
  label = 'Loading…',
  className,
  fullPage,
  variant = 'spinner',
}: LoadingStateProps) {
  if (variant !== 'spinner') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        className={cn(fullPage && 'min-h-[40vh]', className)}
      >
        <PageSkeleton variant={variant === 'table' ? 'table' : variant} />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-ink-muted',
        fullPage && 'min-h-[40vh]',
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  )
}
