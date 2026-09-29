import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'erp-btn-press inline-flex items-center justify-center gap-2 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ring-offset-theme disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-card dark:bg-brand-600 dark:hover:bg-brand-500 dark:shadow-[0_4px_16px_rgb(18_147_189/0.32),inset_0_1px_0_rgb(255_255_255/0.12)]',
        secondary:
          'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 dark:border-brand-400/35 dark:bg-brand-100 dark:text-brand-300 dark:hover:bg-brand-200',
        outline:
          'border border-border bg-surface-elevated text-ink hover:bg-surface-muted shadow-card dark:border-border-strong/70 dark:bg-surface-muted/60 dark:hover:border-brand-400/50 dark:hover:bg-surface-muted',
        ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink dark:hover:bg-surface-muted',
        danger:
          'bg-danger text-white hover:opacity-90 active:opacity-80 shadow-card dark:bg-[#dc2626] dark:shadow-[0_4px_14px_rgb(220_38_38/0.3)]',
      },
      size: {
        sm: 'h-[var(--size-control-sm)] px-3 text-xs',
        md: 'h-[var(--size-control-md)] px-4 text-sm',
        lg: 'h-[var(--size-control-lg)] px-5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'opacity-90')}>
        {children}
      </span>
      {loading ? <span className="sr-only">Loading</span> : null}
    </button>
  ),
)
Button.displayName = 'Button'

export { buttonVariants }
