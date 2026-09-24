import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-[var(--spacing-section)] border-b border-border/80 pb-4',
        className,
      )}
    >
      {breadcrumbs ? <div className="mb-2">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[var(--font-size-title)] font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto xl:justify-end [&_a]:inline-flex">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
