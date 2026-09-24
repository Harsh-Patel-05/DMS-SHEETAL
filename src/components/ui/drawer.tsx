import { X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/use-focus-trap'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  side?: 'left' | 'right'
  className?: string
  widthClassName?: string
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  side = 'right',
  className,
  widthClassName = 'w-full max-w-md',
}: DrawerProps) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [open, handleKeyDown])

  useFocusTrap(open, panelRef)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      <div
        className="erp-overlay erp-anim-overlay absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex h-full flex-col border-border bg-surface-elevated shadow-elevated outline-none',
          side === 'right' && 'erp-anim-drawer-right ml-auto border-l',
          side === 'left' && 'erp-anim-drawer-left mr-auto border-r',
          widthClassName,
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p id={descId} className="mt-0.5 text-sm text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
