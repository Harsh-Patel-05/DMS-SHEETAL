import { cn } from '@/utils/cn'
import type { DatePreset } from '@/utils/date-range'

export type DatePresetOrCustom = DatePreset | 'custom'

export const DATE_PRESET_OPTIONS: { id: DatePreset; label: string; short?: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday', short: 'Yday' },
  { id: 'this_week', label: 'This Week', short: 'Week' },
  { id: 'this_month', label: 'This Month', short: 'Month' },
  { id: 'last_month', label: 'Last Month', short: 'Last' },
  { id: 'this_year', label: 'This Year', short: 'Year' },
]

export function parseDatePreset(value: string | undefined | null): DatePreset {
  const ids = DATE_PRESET_OPTIONS.map((p) => p.id)
  return ids.includes(value as DatePreset) ? (value as DatePreset) : 'this_month'
}

type BaseProps = {
  className?: string
  /** Use shorter labels on very small screens via CSS */
  compact?: boolean
}

export type DatePresetToggleProps =
  | (BaseProps & {
      includeCustom?: false
      value: DatePreset
      onChange: (preset: DatePreset) => void
    })
  | (BaseProps & {
      includeCustom: true
      value: DatePresetOrCustom
      onChange: (preset: DatePresetOrCustom) => void
    })

/** Segmented date-range control used across Dashboard, Reports, Finance. */
export function DatePresetToggle(props: DatePresetToggleProps) {
  const { value, onChange, className, compact, includeCustom } = props
  const options: { id: DatePresetOrCustom; label: string; short?: string }[] = includeCustom
    ? [...DATE_PRESET_OPTIONS, { id: 'custom', label: 'Custom' }]
    : DATE_PRESET_OPTIONS

  return (
    <div
      className={cn(
        'erp-segmented inline-flex max-w-full items-stretch overflow-x-auto rounded-lg border border-border bg-surface-elevated p-0.5 shadow-card scrollbar-thin',
        className,
      )}
      role="group"
      aria-label="Date range"
    >
      {options.map((p) => {
        const active = value === p.id
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (includeCustom) {
                ;(onChange as (preset: DatePresetOrCustom) => void)(p.id)
              } else if (p.id !== 'custom') {
                ;(onChange as (preset: DatePreset) => void)(p.id)
              }
            }}
            className={cn(
              'shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors touch-manipulation',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
            )}
          >
            {compact && p.short ? (
              <>
                <span className="sm:hidden">{p.short}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </>
            ) : (
              p.label
            )}
          </button>
        )
      })}
    </div>
  )
}
