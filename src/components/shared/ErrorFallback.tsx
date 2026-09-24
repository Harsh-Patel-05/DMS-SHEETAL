import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ErrorFallbackProps {
  onReload?: () => void
  onDashboard?: () => void
}

/**
 * User-facing crash screen. Never render stack traces or error messages here.
 */
export function ErrorFallback({
  onReload = () => window.location.reload(),
  onDashboard = () => {
    window.location.href = '/dashboard'
  },
}: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-8 text-center shadow-elevated">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger"
          aria-hidden
        >
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          Something went wrong.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          An unexpected error interrupted this screen. Your data in this browser is usually safe —
          reload the page or return to the dashboard to continue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" className="min-h-11 gap-2 touch-manipulation" onClick={onReload}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reload
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-2 touch-manipulation"
            onClick={onDashboard}
          >
            <Home className="h-4 w-4" aria-hidden />
            Go Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
