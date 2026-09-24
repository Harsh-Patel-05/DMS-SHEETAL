import { Filter, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface FilterPanelProps {
  children: ReactNode
  title?: string
  onReset?: () => void
  onApply?: () => void
  applyLabel?: string
  resetLabel?: string
  className?: string
  collapsible?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FilterPanel({
  children,
  title = 'Filters',
  onReset,
  onApply,
  applyLabel = 'Apply',
  resetLabel = 'Reset',
  className,
  collapsible,
  open = true,
  onOpenChange,
}: FilterPanelProps) {
  if (collapsible && !open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={() => onOpenChange?.(true)}
      >
        <Filter className="h-4 w-4" />
        {title}
      </Button>
    )
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-ink-muted" aria-hidden />
          {title}
        </CardTitle>
        {collapsible ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label="Close filters"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {children}
        {(onReset || onApply) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
            {onReset ? (
              <Button type="button" variant="ghost" size="sm" onClick={onReset}>
                {resetLabel}
              </Button>
            ) : null}
            {onApply ? (
              <Button type="button" variant="primary" size="sm" onClick={onApply}>
                {applyLabel}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
