import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-muted text-ink',
        brand: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-100/15 dark:text-brand-200',
        success: 'border-[var(--color-success-border)] bg-success-bg text-success',
        warning: 'border-[var(--color-warning-border)] bg-warning-bg text-warning',
        danger: 'border-[var(--color-danger-border)] bg-danger-bg text-danger',
        info: 'border-brand-200 bg-brand-50/80 text-brand-700 dark:border-brand-700 dark:bg-brand-100/10 dark:text-brand-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
