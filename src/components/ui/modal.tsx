import { X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { useFocusTrap } from '@/hooks/use-focus-trap'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
  /** Full-height bottom sheet on small screens */
  mobileSheet?: boolean
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  showClose = true,
  mobileSheet = false,
}: ModalProps) {
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
    <div
      className={cn(
        'fixed inset-0 z-50 flex p-4',
        mobileSheet
          ? 'items-end justify-center sm:items-center'
          : 'items-center justify-center',
      )}
    >
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
          'erp-dialog relative z-10 flex w-full flex-col outline-none',
          mobileSheet ? 'erp-anim-sheet sm:erp-anim-dialog' : 'erp-anim-dialog',
          mobileSheet
            ? 'max-h-[min(94vh,900px)] rounded-b-none sm:max-h-[min(90vh,800px)] sm:rounded-b-[var(--radius-xl)]'
            : 'max-h-[min(90vh,800px)]',
          sizeClasses[size],
          className,
        )}
      >
        {(title || showClose) && (
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
            {showClose ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 shrink-0 p-0 touch-manipulation sm:h-8 sm:w-8"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
