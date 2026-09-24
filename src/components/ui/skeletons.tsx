import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

/** Base shimmer block */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-muted dark:bg-surface-muted/80',
        className,
      )}
      aria-hidden
      {...props}
    />
  )
}

export interface TableSkeletonProps {
  rows?: number
  cols?: number
  className?: string
}

export function TableSkeleton({ rows = 6, cols = 5, className }: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading table"
      className={cn('overflow-hidden rounded-lg border border-border bg-surface-elevated', className)}
    >
      <div className="flex flex-wrap gap-2 border-b border-border p-3">
        <Skeleton className="h-9 w-48 max-w-full" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="ml-auto h-9 w-20" />
      </div>
      <div className="hidden border-b border-border bg-surface-muted/60 px-3 py-2 md:grid md:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 px-3 py-3"
            style={{ gridTemplateColumns: `repeat(${Math.min(cols, 3)}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: Math.min(cols, 3) }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-3/4' : 'w-full')} />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 4, className }: CardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading cards"
      className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-surface-elevated p-4 shadow-card">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export interface ChartSkeletonProps {
  className?: string
  height?: number
}

export function ChartSkeleton({ className, height = 220 }: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading chart"
      className={cn('rounded-lg border border-border bg-surface-elevated p-4 shadow-card', className)}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex items-end gap-2" style={{ height }}>
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 48, 68].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      <span className="sr-only">Loading chart…</span>
    </div>
  )
}

export interface DetailSkeletonProps {
  className?: string
}

export function DetailSkeleton({ className }: DetailSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading details" className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg border border-border bg-surface-elevated p-4 lg:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-surface-elevated p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export interface FormSkeletonProps {
  fields?: number
  className?: string
}

export function FormSkeleton({ fields = 6, className }: FormSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading form"
      className={cn('space-y-4 rounded-lg border border-border bg-surface-elevated p-4', className)}
    >
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-24" />
      </div>
      <span className="sr-only">Loading form…</span>
    </div>
  )
}

/** Combined page shell used by route Suspense */
export function PageSkeleton({ variant = 'table' }: { variant?: 'table' | 'dashboard' | 'detail' | 'form' }) {
  if (variant === 'dashboard') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton count={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton rows={4} cols={4} />
      </div>
    )
  }
  if (variant === 'detail') return <DetailSkeleton />
  if (variant === 'form') return <FormSkeleton />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <TableSkeleton />
    </div>
  )
}
