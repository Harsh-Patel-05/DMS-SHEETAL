import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface FormSectionProps {
  title: string
  description?: string
  step?: number
  icon?: LucideIcon
  children: ReactNode
  className?: string
  actions?: ReactNode
}

/** Card section for long forms — title, optional help text, body. */
export function FormSection({
  title,
  description,
  step,
  icon: Icon,
  children,
  className,
  actions,
}: FormSectionProps) {
  return (
    <section className={cn('erp-card space-y-4 p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-start gap-3">
          {step != null || Icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-50 text-sm font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
              {Icon ? <Icon className="h-4 w-4" aria-hidden /> : step}
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">
              {step != null ? (
                <span className="mr-2 text-ink-muted">{String(step).padStart(2, '0')}.</span>
              ) : null}
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export interface FormStep {
  id: string
  label: string
  description?: string
}

export interface FormStepperProps {
  steps: FormStep[]
  current: string
  onStepClick?: (id: string) => void
  className?: string
}

/** Horizontal step indicator for multi-section forms. */
export function FormStepper({ steps, current, onStepClick, className }: FormStepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === current),
  )

  return (
    <nav aria-label="Form steps" className={cn('w-full', className)}>
      <ol className="flex flex-wrap gap-2 sm:gap-0">
        {steps.map((step, index) => {
          const active = step.id === current
          const done = index < currentIndex
          const clickable = Boolean(onStepClick)
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left sm:px-3',
                  clickable && 'hover:bg-surface',
                  !clickable && 'cursor-default',
                )}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    active && 'bg-brand-600 text-white',
                    done && !active && 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
                    !active && !done && 'bg-surface-muted text-ink-muted',
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block truncate text-xs font-semibold sm:text-sm',
                      active ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description ? (
                    <span className="hidden truncate text-[11px] text-ink-subtle sm:block">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span className="mx-1 hidden h-px w-4 shrink-0 bg-border sm:block" aria-hidden />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
