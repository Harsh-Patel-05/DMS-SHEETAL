import { Check, ChevronDown } from 'lucide-react'
import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { cn } from '@/utils/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
  /** Classes for the outer relative wrapper (default: w-full). Use w-auto in toolbars. */
  containerClassName?: string
}

interface ParsedOption {
  value: string
  label: string
  disabled?: boolean
}

interface ParsedGroup {
  label: string
  options: ParsedOption[]
}

type ParsedItem = { type: 'option'; option: ParsedOption } | { type: 'group'; group: ParsedGroup }

function labelFromChildren(children: ReactNode): string {
  if (children == null || children === false) return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(labelFromChildren).join('')
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return labelFromChildren(children.props.children)
  }
  return ''
}

function parseSelectChildren(children: ReactNode): ParsedItem[] {
  const items: ParsedItem[] = []
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return
    const typeName =
      typeof child.type === 'string'
        ? child.type
        : ((child.type as { displayName?: string }).displayName ?? '')

    if (typeName === 'option' || child.type === 'option') {
      const props = child.props as {
        value?: string | number
        disabled?: boolean
        children?: ReactNode
      }
      const value = props.value != null ? String(props.value) : labelFromChildren(props.children)
      items.push({
        type: 'option',
        option: {
          value,
          label: labelFromChildren(props.children) || value,
          disabled: Boolean(props.disabled),
        },
      })
      return
    }

    if (typeName === 'optgroup' || child.type === 'optgroup') {
      const props = child.props as { label?: string; children?: ReactNode }
      const options: ParsedOption[] = []
      Children.forEach(props.children, (opt) => {
        if (!isValidElement(opt)) return
        if (opt.type !== 'option' && (opt.type as { displayName?: string }).displayName !== 'option') {
          return
        }
        const op = opt.props as {
          value?: string | number
          disabled?: boolean
          children?: ReactNode
        }
        const value = op.value != null ? String(op.value) : labelFromChildren(op.children)
        options.push({
          value,
          label: labelFromChildren(op.children) || value,
          disabled: Boolean(op.disabled),
        })
      })
      items.push({ type: 'group', group: { label: props.label ?? '', options } })
    }
  })
  return items
}

function flattenOptions(items: ParsedItem[]): ParsedOption[] {
  const out: ParsedOption[] = []
  for (const item of items) {
    if (item.type === 'option') out.push(item.option)
    else out.push(...item.group.options)
  }
  return out
}

/**
 * Themed select — same API as a native &lt;select&gt; (including &lt;option&gt; children
 * and react-hook-form register), but the open menu uses project brand styling
 * instead of the browser default list.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      children,
      invalid,
      containerClassName,
      disabled,
      value,
      defaultValue,
      onChange,
      onBlur,
      id,
      name,
      required,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref,
  ) => {
    const uid = useId()
    const listboxId = `${uid}-listbox`
    const triggerId = id ?? `${uid}-trigger`
    const rootRef = useRef<HTMLDivElement>(null)
    const nativeRef = useRef<HTMLSelectElement | null>(null)
    const [open, setOpen] = useState(false)
    const [uncontrolled, setUncontrolled] = useState(() =>
      defaultValue != null ? String(defaultValue) : '',
    )

    const isControlled = value !== undefined
    const currentValue = isControlled ? String(value ?? '') : uncontrolled

    const items = useMemo(() => parseSelectChildren(children), [children])
    const flat = useMemo(() => flattenOptions(items), [items])
    const selected = flat.find((o) => o.value === currentValue)
    const displayLabel = selected?.label ?? (currentValue || 'Select…')

    const setNativeRef = useCallback(
      (node: HTMLSelectElement | null) => {
        nativeRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const commit = useCallback(
      (next: string) => {
        if (!isControlled) setUncontrolled(next)
        const el = nativeRef.current
        if (el) el.value = next
        onChange?.({
          target: el ?? ({ value: next, name: name ?? '' } as HTMLSelectElement),
          currentTarget: el ?? ({ value: next, name: name ?? '' } as HTMLSelectElement),
        } as ChangeEvent<HTMLSelectElement>)
        setOpen(false)
      },
      [isControlled, name, onChange],
    )

    useEffect(() => {
      if (!open) return
      const onDoc = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('mousedown', onDoc)
      document.addEventListener('keydown', onKey)
      return () => {
        document.removeEventListener('mousedown', onDoc)
        document.removeEventListener('keydown', onKey)
      }
    }, [open])

    const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
    }

    const onListKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const enabled = flat.filter((o) => !o.disabled)
      if (enabled.length === 0) return
      const active = document.activeElement as HTMLElement | null
      const idx = enabled.findIndex((o) => active?.dataset?.value === o.value)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = enabled[(idx + 1 + enabled.length) % enabled.length]
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)
          ?.focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = enabled[(idx - 1 + enabled.length) % enabled.length]
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(next.value)}"]`)
          ?.focus()
      } else if (e.key === 'Home') {
        e.preventDefault()
        rootRef.current
          ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(enabled[0].value)}"]`)
          ?.focus()
      } else if (e.key === 'End') {
        e.preventDefault()
        rootRef.current
          ?.querySelector<HTMLElement>(
            `[data-value="${CSS.escape(enabled[enabled.length - 1].value)}"]`,
          )
          ?.focus()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }

    useEffect(() => {
      if (!open) return
      const preferred =
        rootRef.current?.querySelector<HTMLElement>(
          `[data-value="${CSS.escape(currentValue)}"]:not([disabled])`,
        ) ?? rootRef.current?.querySelector<HTMLElement>('[role="option"]:not([disabled])')
      preferred?.focus()
    }, [open, currentValue])

    return (
      <div ref={rootRef} className={cn('relative w-full', containerClassName)}>
        <select
          ref={setNativeRef}
          id={id ? `${id}-native` : undefined}
          name={name}
          required={required}
          disabled={disabled}
          value={currentValue}
          onChange={onChange}
          onBlur={onBlur}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute h-px w-px opacity-0"
          {...rest}
        >
          {children}
        </select>

        <button
          id={triggerId}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={invalid || undefined}
          className={cn(
            'erp-control flex w-full appearance-none items-center justify-between gap-2 pl-3 pr-3 text-left',
            'focus-visible:ring-offset-1',
            'border-border/90 bg-surface-elevated shadow-none',
            'hover:border-brand-300',
            open && 'border-brand-300 ring-2 ring-brand-400',
            invalid && 'border-danger focus-visible:ring-danger',
            disabled && 'cursor-not-allowed opacity-50',
            !selected && !currentValue && 'text-ink-subtle',
            className,
          )}
          onClick={() => !disabled && setOpen((v) => !v)}
          onKeyDown={onTriggerKeyDown}
          onBlur={onBlur as unknown as React.FocusEventHandler<HTMLButtonElement>}
        >
          <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={triggerId}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            className="absolute z-50 mt-1.5 max-h-60 w-full min-w-[11rem] overflow-auto rounded-xl border border-border bg-surface-elevated py-1 shadow-elevated"
          >
            {items.map((item, i) => {
              if (item.type === 'group') {
                return (
                  <div key={`g-${item.group.label}-${i}`} className="py-1">
                    {item.group.label ? (
                      <p className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                        {item.group.label}
                      </p>
                    ) : null}
                    {item.group.options.map((opt) => (
                      <OptionButton
                        key={opt.value}
                        option={opt}
                        selected={opt.value === currentValue}
                        onPick={commit}
                      />
                    ))}
                  </div>
                )
              }
              return (
                <OptionButton
                  key={item.option.value || `o-${i}`}
                  option={item.option}
                  selected={item.option.value === currentValue}
                  onPick={commit}
                />
              )
            })}
          </div>
        ) : null}
      </div>
    )
  },
)
Select.displayName = 'Select'

function OptionButton({
  option,
  selected,
  onPick,
}: {
  option: ParsedOption
  selected: boolean
  onPick: (value: string) => void
}) {
  return (
    <button
      type="button"
      role="option"
      data-value={option.value}
      aria-selected={selected}
      disabled={option.disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink',
        'hover:bg-brand-50/80 focus-visible:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400',
        'dark:hover:bg-brand-100/10 dark:focus-visible:bg-brand-100/15',
        selected && 'bg-brand-50 font-medium text-brand-800 dark:bg-brand-100/15 dark:text-brand-200',
        option.disabled && 'pointer-events-none opacity-50',
      )}
      onClick={() => onPick(option.value)}
    >
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden /> : null}
    </button>
  )
}

/** Optional typed helper if a page prefers explicit options over &lt;option&gt; children */
export type { ParsedOption as SelectOption }
