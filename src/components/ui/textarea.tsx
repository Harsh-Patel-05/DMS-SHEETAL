import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'erp-control flex min-h-[90px] resize-y',
        'focus-visible:ring-offset-1',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      aria-invalid={invalid}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
