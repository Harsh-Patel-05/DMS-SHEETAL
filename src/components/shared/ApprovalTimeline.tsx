import { Check, CircleDot, ClipboardList, MessageSquare, Send, X } from 'lucide-react'
import type { ApprovalEventAction, ApprovalTimelineEvent } from '@/types/approval'
import { APPROVAL_STATUS_LABELS } from '@/types/approval'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'

const ACTION_STYLES: Record<
  ApprovalEventAction,
  { dot: string; Icon: typeof Send }
> = {
  created: { dot: 'bg-ink-subtle', Icon: ClipboardList },
  submitted: { dot: 'bg-info', Icon: Send },
  approved: { dot: 'bg-success', Icon: Check },
  rejected: { dot: 'bg-danger', Icon: X },
  completed: { dot: 'bg-brand-600', Icon: CircleDot },
  comment: { dot: 'bg-warning', Icon: MessageSquare },
}

function formatEventTime(at: string) {
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

export interface ApprovalTimelineProps {
  events: ApprovalTimelineEvent[]
  title?: string
  emptyMessage?: string
  className?: string
  compact?: boolean
  maxHeightClassName?: string
}

export function ApprovalTimeline({
  events,
  title = 'Approval timeline',
  emptyMessage = 'No approval events yet',
  className,
  compact = false,
  maxHeightClassName,
}: ApprovalTimelineProps) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at))

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
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-muted">{emptyMessage}</p>
        ) : (
          <ol className="relative space-y-0 border-l border-border pl-5">
            {sorted.map((event) => {
              const { time, dateLabel } = formatEventTime(event.at)
              const style = ACTION_STYLES[event.action]
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
                    <p className={cn('mt-0.5 font-medium text-ink', 'text-sm')}>
                      {APPROVAL_STATUS_LABELS[event.status]}
                      <span className="font-normal text-ink-muted"> · {event.userName}</span>
                    </p>
                    {event.note ? <p className="mt-0.5 text-xs text-ink-muted">{event.note}</p> : null}
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
