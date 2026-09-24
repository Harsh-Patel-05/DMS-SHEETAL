import { Search, X } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
  /** Decorative trailing shortcut hint (e.g. header search). Hidden while value is set. */
  shortcutHint?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, shortcutHint, id, ...props }, ref) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const hasValue = value !== undefined && value !== ''
    const showKbdHint = Boolean(shortcutHint) && !hasValue

    return (
      <div className={cn('relative w-full', className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden
        />
        <input
          ref={ref}
          id={inputId}
          type="search"
          value={value}
          className={cn(
            'flex h-9 w-full rounded-md border border-border bg-surface-elevated py-2 pl-9 text-sm text-ink shadow-card',
            showKbdHint ? 'pr-3 sm:pr-[4.25rem]' : onClear ? 'pr-9' : 'pr-3',
            'placeholder:text-ink-subtle',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
          )}
          {...props}
        />
        {showKbdHint ? (
          <span
            className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex"
            aria-hidden
          >
            <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle">
              {shortcutHint}
            </kbd>
          </span>
        ) : null}
        {hasValue && onClear ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-ink-subtle hover:text-ink"
            aria-label="Clear search"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'
