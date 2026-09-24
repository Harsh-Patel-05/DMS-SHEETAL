import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
  showHome?: boolean
  homeHref?: string
}

export function Breadcrumb({
  items,
  className,
  showHome = true,
  homeHref = '/',
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-ink-muted">
        {showHome ? (
          <li className="flex items-center gap-1">
            <Link
              to={homeHref}
              className="inline-flex items-center gap-1 rounded-sm hover:text-brand-700"
            >
              <Home className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Home</span>
            </Link>
            {items.length > 0 ? (
              <ChevronRight className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />
            ) : null}
          </li>
        ) : null}
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link to={item.href} className="rounded-sm hover:text-brand-700">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(isLast && 'font-medium text-ink')}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="h-3.5 w-3.5 text-ink-subtle" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
