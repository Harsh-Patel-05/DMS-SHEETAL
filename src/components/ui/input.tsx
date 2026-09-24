import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', invalid, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'erp-control flex',
        'focus-visible:ring-offset-1',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      aria-invalid={invalid}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
