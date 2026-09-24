import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { generateId } from '@/utils/cn'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-border bg-surface-elevated text-ink shadow-elevated',
  success: 'border-[var(--color-success-border)] bg-success-bg text-ink shadow-elevated',
  error: 'border-[var(--color-danger-border)] bg-danger-bg text-ink shadow-elevated',
  warning: 'border-[var(--color-warning-border)] bg-warning-bg text-ink shadow-elevated',
  info: 'border-[var(--color-info-border)] bg-info-bg text-ink shadow-elevated',
}

const iconColors: Record<ToastVariant, string> = {
  default: 'text-ink-muted',
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (items.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 md:bottom-4 md:right-4 md:w-full"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Notifications"
    >
      {items.map((item) => {
        const Icon = icons[item.variant ?? 'default']
        const isAlert = item.variant === 'error' || item.variant === 'warning'
        return (
          <div
            key={item.id}
            role={isAlert ? 'alert' : 'status'}
            className={cn(
              'erp-anim-toast pointer-events-auto flex gap-3 rounded-md border p-3 shadow-elevated',
              variantStyles[item.variant ?? 'default'],
            )}
          >
            <Icon
              className={cn('mt-0.5 h-4 w-4 shrink-0', iconColors[item.variant ?? 'default'])}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-sm p-0.5 text-ink-subtle hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(item.id)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'>) => {
      const id = generateId('toast')
      const duration = item.duration ?? 4000
      setItems((prev) => [...prev, { ...item, id }])
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
