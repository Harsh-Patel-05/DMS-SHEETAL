import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  /** Primary action slot (legacy) */
  action?: ReactNode
  /** Multiple CTAs — preferred for advanced empty states */
  actions?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  actions,
  className,
}: EmptyStateProps) {
  const cta = actions ?? action

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-surface-elevated shadow-card">
        <Icon className="h-6 w-6 text-ink-subtle" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
      ) : null}
      {cta ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{cta}</div>
      ) : null}
    </div>
  )
}
