import { Clock3, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export interface DraftBannerProps {
  /** e.g. "11:32 AM" */
  savedAtLabel?: string | null
  /** Offer restore when a previous session draft was found */
  showRestore?: boolean
  onRestore?: () => void
  onDelete: () => void
  className?: string
  /** Compact inline status (always-visible autosave hint) */
  variant?: 'status' | 'restore'
}

export function DraftBanner({
  savedAtLabel,
  showRestore = false,
  onRestore,
  onDelete,
  className,
  variant = 'restore',
}: DraftBannerProps) {
  if (variant === 'status' && savedAtLabel) {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-muted/80 px-3 py-2 text-sm',
          className,
        )}
      >
        <p className="flex items-center gap-1.5 text-ink-muted">
          <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Draft saved at <span className="font-medium text-ink">{savedAtLabel}</span>
        </p>
        <Button type="button" size="sm" variant="ghost" className="gap-1.5 text-danger" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete Draft
        </Button>
      </div>
    )
  }

  if (!showRestore) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning-border bg-warning-bg px-4 py-3 text-sm',
        className,
      )}
    >
      <p className="text-ink">
        {savedAtLabel ? (
          <>
            A draft was saved at <span className="font-semibold">{savedAtLabel}</span>.
          </>
        ) : (
          'A saved draft was found.'
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        {onRestore ? (
          <Button type="button" size="sm" className="min-h-10 gap-1.5 touch-manipulation" onClick={onRestore}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Draft
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-10 gap-1.5 touch-manipulation"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Draft
        </Button>
      </div>
    </div>
  )
}
