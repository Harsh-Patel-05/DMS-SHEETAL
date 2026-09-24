import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
  siblingCount?: number
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)

  const start = Math.max(1, current - siblingCount)
  const end = Math.min(totalPages, current + siblingCount)
  const pages = range(start, end)

  const from = total === 0 ? 0 : (current - 1) * pageSize + 1
  const to = Math.min(current * pageSize, total)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-ink-muted">
        Showing <span className="font-medium text-ink">{from}</span>–
        <span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={current <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(current - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {start > 1 ? (
          <>
            <PageButton page={1} current={current} onPageChange={onPageChange} />
            {start > 2 ? <span className="px-1 text-ink-subtle">…</span> : null}
          </>
        ) : null}
        {pages.map((p) => (
          <PageButton key={p} page={p} current={current} onPageChange={onPageChange} />
        ))}
        {end < totalPages ? (
          <>
            {end < totalPages - 1 ? <span className="px-1 text-ink-subtle">…</span> : null}
            <PageButton page={totalPages} current={current} onPageChange={onPageChange} />
          </>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={current >= totalPages}
          aria-label="Next page"
          onClick={() => onPageChange(current + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  )
}

function PageButton({
  page,
  current,
  onPageChange,
}: {
  page: number
  current: number
  onPageChange: (p: number) => void
}) {
  const active = page === current
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 min-w-8 px-2"
      aria-current={active ? 'page' : undefined}
      onClick={() => onPageChange(page)}
    >
      {page}
    </Button>
  )
}
