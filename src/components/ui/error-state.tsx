import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-red-200 bg-danger-bg px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="mb-3 h-10 w-10 text-danger" aria-hidden />
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  )
}
