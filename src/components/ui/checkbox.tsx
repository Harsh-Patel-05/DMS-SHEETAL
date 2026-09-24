import { Check, Minus } from 'lucide-react'
import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, disabled, indeterminate = false, checked, ...props }, ref) => {
    const inputId = id ?? props.name
    const innerRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
      const el = innerRef.current
      if (el) el.indeterminate = Boolean(indeterminate && !checked)
    }, [indeterminate, checked])

    return (
      <label
        htmlFor={inputId}
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 text-sm text-ink',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span className="relative inline-flex h-4 w-4 shrink-0">
          <input
            ref={(node) => {
              innerRef.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            id={inputId}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            aria-checked={indeterminate && !checked ? 'mixed' : checked}
            className="peer sr-only"
            {...props}
          />
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-[0.25rem] border border-border-strong bg-surface-elevated',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-1',
              'peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:shadow-none',
              'peer-disabled:opacity-50',
              indeterminate && !checked && 'border-brand-600 bg-brand-600 shadow-none',
              'peer-checked:[&_.check-icon]:opacity-100',
            )}
            aria-hidden
          >
            {indeterminate && !checked ? (
              <Minus className="h-3 w-3 text-white" />
            ) : (
              <Check className="check-icon h-3 w-3 text-white opacity-0" />
            )}
          </span>
        </span>
        {label ? <span>{label}</span> : null}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
