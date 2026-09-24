import { ChevronDown } from 'lucide-react'
import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  /** Classes for the outer relative wrapper (default: w-full). Use w-auto in toolbars. */
  containerClassName?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, invalid, containerClassName, ...props }, ref) => (
    <div className={cn('relative w-full', containerClassName)}>
      <select
        ref={ref}
        className={cn(
          'erp-control flex appearance-none pl-3 pr-9',
          'focus-visible:ring-offset-1',
          'border-border/90 bg-surface-elevated shadow-none',
          'hover:border-brand-300',
          invalid && 'border-danger focus-visible:ring-danger',
          className,
        )}
        aria-invalid={invalid}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
    </div>
  ),
)
Select.displayName = 'Select'
