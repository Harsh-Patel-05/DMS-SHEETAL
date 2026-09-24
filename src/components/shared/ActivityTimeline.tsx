import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  Undo2,
  Wallet,
} from 'lucide-react'
import type { ActivityEvent, ActivityKind } from '@/types/activity'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate } from '@/utils/format'

const KIND_STYLES: Record<
  ActivityKind,
  { dot: string; Icon: typeof ShoppingCart }
> = {
  sale: { dot: 'bg-brand-500', Icon: ShoppingCart },
  payment: { dot: 'bg-success', Icon: Wallet },
  purchase: { dot: 'bg-info', Icon: Truck },
  stock: { dot: 'bg-warning', Icon: Package },
  adjustment: { dot: 'bg-warning', Icon: Package },
  transfer: { dot: 'bg-brand-400', Icon: ArrowLeftRight },
  invoice: { dot: 'bg-brand-600', Icon: FileText },
  return: { dot: 'bg-danger', Icon: Undo2 },
  note: { dot: 'bg-ink-subtle', Icon: ClipboardList },
}

function formatActivityTime(at: string) {
  try {
    const d = new Date(at)
    if (Number.isNaN(d.getTime())) return { time: '—', dateLabel: at }
    const time = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d)
    const dateLabel = formatDate(at.includes('T') ? at.slice(0, 10) : at)
    return { time, dateLabel }
  } catch {
    return { time: '—', dateLabel: at }
  }
}

export interface ActivityTimelineProps {
  events: ActivityEvent[]
  title?: string
  emptyMessage?: string
  className?: string
  /** Compact mode for side panels */
  compact?: boolean
  maxHeightClassName?: string
}

export function ActivityTimeline({
  events,
  title = 'Activity timeline',
  emptyMessage = 'No activity yet',
  className,
  compact = false,
  maxHeightClassName,
}: ActivityTimelineProps) {
  return (
    <section className={cn('erp-card', className)}>
      {title ? (
        <div className={cn('border-b border-border px-4 py-3', compact && 'px-3 py-2.5')}>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
      ) : null}

      <div
        className={cn(
          'px-4 py-3',
          compact && 'px-3 py-2.5',
          maxHeightClassName && 'overflow-y-auto scrollbar-thin',
          maxHeightClassName,
        )}
      >
        {events.length === 0 ? (
          <p className="text-sm text-ink-muted">{emptyMessage}</p>
        ) : (
          <ol className="relative space-y-0 border-l border-border pl-5">
            {events.map((event) => {
              const { time, dateLabel } = formatActivityTime(event.at)
              const style = KIND_STYLES[event.kind]
              const Icon = style.Icon
              return (
                <li key={event.id} className="relative pb-5 last:pb-0">
                  <span
                    className={cn(
                      'absolute -left-[23px] top-1 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface-elevated',
                      style.dot,
                    )}
                  >
                    <Icon className="h-3 w-3 text-white" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <time className="text-xs font-semibold tabular-nums text-ink" dateTime={event.at}>
                        {time}
                      </time>
                      <span className="text-[11px] text-ink-muted">{dateLabel}</span>
                    </div>
                    <p className={cn('mt-0.5 font-medium text-ink', compact ? 'text-sm' : 'text-sm')}>
                      {event.href ? (
                        <Link to={event.href} className="hover:text-brand-700 hover:underline dark:hover:text-brand-300">
                          {event.title}
                        </Link>
                      ) : (
                        event.title
                      )}
                    </p>
                    {event.description ? (
                      <p className="mt-0.5 text-xs text-ink-muted">{event.description}</p>
                    ) : null}
                    {typeof event.amount === 'number' && event.amount > 0 && !event.title.includes('₹') ? (
                      <p className="mt-0.5 text-xs font-medium tabular-nums text-ink-muted">
                        {formatCurrency(event.amount)}
                      </p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
