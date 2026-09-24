import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Card, CardContent } from '@/components/ui/card'

export type StatTrendDirection = 'up' | 'down' | 'flat'

export interface StatCardLegacyTrend {
  value: string
  positive?: boolean
}

export interface StatCardProps {
  label: string
  value: ReactNode
  icon?: LucideIcon
  /** Legacy text trend line (e.g. margin label) */
  trend?: StatCardLegacyTrend
  previousValue?: ReactNode
  changePercent?: number
  /** Direction for changePercent; inferred from sign when omitted */
  trendDirection?: StatTrendDirection
  className?: string
}

function formatChangePercent(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

function resolveTrendColor(direction: StatTrendDirection): string {
  if (direction === 'up') return 'text-success'
  if (direction === 'down') return 'text-danger'
  return 'text-ink-muted'
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  previousValue,
  changePercent,
  trendDirection,
  className,
}: StatCardProps) {
  const numericTrend =
    changePercent !== undefined
      ? (trendDirection ??
        (changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat'))
      : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">{value}</p>
          {numericTrend !== null && changePercent !== undefined ? (
            <p className={cn('mt-1 text-xs font-medium tabular-nums', resolveTrendColor(numericTrend))}>
              {formatChangePercent(changePercent)}
              {previousValue !== undefined ? (
                <span className="ml-1.5 font-normal text-ink-subtle">vs {previousValue}</span>
              ) : null}
            </p>
          ) : trend ? (
            <p
              className={cn(
                'mt-1 text-xs font-medium',
                trend.positive ? 'text-success' : 'text-danger',
              )}
            >
              {trend.value}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-brand-50 text-brand-700 dark:bg-brand-100/15 dark:text-brand-300">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
