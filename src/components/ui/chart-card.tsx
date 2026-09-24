import { Suspense, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  height?: number | string
}

function ChartFallback({ height }: { height: number | string }) {
  return (
    <div
      className="h-full w-full animate-pulse rounded-md bg-surface-muted"
      style={{ minHeight: typeof height === 'number' ? height : undefined }}
      aria-hidden
    />
  )
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  height = 280,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
          <Suspense fallback={<ChartFallback height={height} />}>{children}</Suspense>
        </div>
      </CardContent>
    </Card>
  )
}
