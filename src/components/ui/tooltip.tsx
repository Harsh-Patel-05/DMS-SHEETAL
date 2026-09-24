import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface TooltipProps {
  content: ReactNode
  children: ReactNode
  side?: 'top' | 'bottom'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const tipId = useId()

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={visible ? tipId : undefined}>{children}</span>
      {visible ? (
        <span
          id={tipId}
          role="tooltip"
          className={cn(
            'absolute z-50 max-w-xs rounded-md border border-border bg-ink px-2 py-1 text-xs text-white shadow-elevated',
            side === 'top' && 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
            side === 'bottom' && 'left-1/2 top-full mt-1.5 -translate-x-1/2',
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  )
}
