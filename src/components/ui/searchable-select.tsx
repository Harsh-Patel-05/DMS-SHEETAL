import {
  Check,
  ChevronDown,
  Plus,
  Search,
  X,
} from 'lucide-react'
import {
  forwardRef,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { pushRecentId, readRecentIds } from '@/utils/recent-select'

export interface SearchableSelectOption {
  value: string
  label: string
  /** Secondary line (SKU, city, phone, etc.) */
  description?: string
  group?: string
  disabled?: boolean
  keywords?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  invalid?: boolean
  clearable?: boolean
  /** Persist recent picks under this key */
  recentScope?: string
  recentLimit?: number
  /** Allow creating a free-text option when no match */
  creatable?: boolean
  createLabel?: (query: string) => string
  onCreate?: (query: string) => void
  emptyMessage?: string
  className?: string
  id?: string
  name?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
}

export interface SearchableSelectHandle {
  focus: () => void
}

type FlatRow =
  | { kind: 'heading'; key: string; label: string }
  | { kind: 'option'; key: string; option: SearchableSelectOption; recent?: boolean }

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function matches(opt: SearchableSelectOption, q: string) {
  if (!q) return true
  const hay = normalize(`${opt.label} ${opt.description ?? ''} ${opt.keywords ?? ''} ${opt.value}`)
  return hay.includes(q)
}

export const SearchableSelect = forwardRef<SearchableSelectHandle, SearchableSelectProps>(
  function SearchableSelect(
    {
      options,
      value = '',
      onChange,
      onBlur,
      placeholder = 'Select…',
      searchPlaceholder = 'Search…',
      disabled,
      invalid,
      clearable = true,
      recentScope,
      recentLimit = 6,
      creatable = false,
      createLabel = (q) => `Create “${q}”`,
      onCreate,
      emptyMessage = 'No matches',
      className,
      id,
      name,
      'aria-invalid': ariaInvalid,
      'aria-required': ariaRequired,
      'aria-describedby': ariaDescribedBy,
    },
    ref,
  ) {
    const listboxId = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const [recentIds, setRecentIds] = useState<string[]>(() =>
      recentScope ? readRecentIds(recentScope, recentLimit) : [],
    )
    const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

    useImperativeHandle(ref, () => ({
      focus: () => triggerRef.current?.focus(),
    }))

    const selected = useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value],
    )

    const deferredQuery = useDeferredValue(query)
    const q = normalize(deferredQuery)

    const flatRows = useMemo((): FlatRow[] => {
      const rows: FlatRow[] = []
      const filtered = options.filter((o) => matches(o, q))

      if (!q && recentScope && recentIds.length) {
        const recentOpts = recentIds
          .map((id) => options.find((o) => o.value === id))
          .filter((o): o is SearchableSelectOption => Boolean(o))
        if (recentOpts.length) {
          rows.push({ kind: 'heading', key: 'recent', label: 'Recent' })
          for (const opt of recentOpts) {
            rows.push({ kind: 'option', key: `recent-${opt.value}`, option: opt, recent: true })
          }
        }
      }

      const byGroup = new Map<string, SearchableSelectOption[]>()
      const ungrouped: SearchableSelectOption[] = []
      for (const opt of filtered) {
        if (opt.group) {
          const list = byGroup.get(opt.group) ?? []
          list.push(opt)
          byGroup.set(opt.group, list)
        } else {
          ungrouped.push(opt)
        }
      }

      if (byGroup.size > 0) {
        for (const [group, list] of byGroup) {
          rows.push({ kind: 'heading', key: `g-${group}`, label: group })
          for (const opt of list) {
            rows.push({ kind: 'option', key: opt.value, option: opt })
          }
        }
        for (const opt of ungrouped) {
          rows.push({ kind: 'option', key: opt.value, option: opt })
        }
      } else {
        for (const opt of filtered) {
          // skip duplicates already shown in recent when browsing
          if (!q && recentScope && recentIds.includes(opt.value) && rows.some((r) => r.kind === 'option' && r.option.value === opt.value)) {
            continue
          }
          rows.push({ kind: 'option', key: opt.value, option: opt })
        }
      }

      return rows
    }, [options, q, recentIds, recentScope])

    const optionRows = useMemo(
      () => flatRows.filter((r): r is Extract<FlatRow, { kind: 'option' }> => r.kind === 'option'),
      [flatRows],
    )

    const showCreate =
      creatable &&
      Boolean(q) &&
      !options.some((o) => normalize(o.label) === q || o.value === query.trim())

    const selectableCount = optionRows.length + (showCreate ? 1 : 0)

    const positionPanel = useCallback(() => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const openUp = spaceBelow < 280 && rect.top > spaceBelow
      setPanelStyle({
        position: 'fixed',
        left: rect.left,
        width: Math.max(rect.width, 240),
        zIndex: 80,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4, maxHeight: Math.min(320, rect.top - 12) }
          : { top: rect.bottom + 4, maxHeight: Math.min(320, spaceBelow - 12) }),
      })
    }, [])

    const close = useCallback(() => {
      setOpen(false)
      setQuery('')
      setActiveIndex(0)
      onBlur?.()
    }, [onBlur])

    const openMenu = useCallback(() => {
      if (disabled) return
      setOpen(true)
      positionPanel()
      window.setTimeout(() => searchRef.current?.focus(), 0)
    }, [disabled, positionPanel])

    useEffect(() => {
      if (!open) return
      positionPanel()
      const onScroll = () => positionPanel()
      const onResize = () => positionPanel()
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('scroll', onScroll, true)
        window.removeEventListener('resize', onResize)
      }
    }, [open, positionPanel])

    useEffect(() => {
      if (!open) return
      const onDoc = (e: MouseEvent) => {
        const t = e.target as Node
        if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return
        close()
      }
      document.addEventListener('mousedown', onDoc)
      return () => document.removeEventListener('mousedown', onDoc)
    }, [open, close])

    useEffect(() => {
      setActiveIndex(0)
    }, [query, open])

    const commit = (opt: SearchableSelectOption) => {
      if (opt.disabled) return
      onChange?.(opt.value)
      if (recentScope) {
        setRecentIds(pushRecentId(recentScope, opt.value, recentLimit))
      }
      close()
      triggerRef.current?.focus()
    }

    const commitCreate = () => {
      const label = query.trim()
      if (!label) return
      onCreate?.(label)
      close()
      triggerRef.current?.focus()
    }

    const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openMenu()
      }
    }

    const onSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        triggerRef.current?.focus()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, selectableCount - 1)))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (showCreate && activeIndex === optionRows.length) {
          commitCreate()
          return
        }
        const row = optionRows[activeIndex]
        if (row) commit(row.option)
      }
    }

    let optionCursor = -1

    const panel: ReactNode = open
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            role="listbox"
            className="overflow-hidden rounded-md border border-border bg-surface-elevated shadow-elevated"
            style={panelStyle}
          >
            <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
              <Search className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              <input
                ref={searchRef}
                type="search"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                aria-autocomplete="list"
                aria-controls={listboxId}
              />
              {query ? (
                <button
                  type="button"
                  className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <ul className="scrollbar-thin overflow-y-auto py-1" style={{ maxHeight: 'inherit' }}>
              {flatRows.length === 0 && !showCreate ? (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">{emptyMessage}</li>
              ) : null}
              {flatRows.map((row) => {
                if (row.kind === 'heading') {
                  return (
                    <li
                      key={row.key}
                      className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-subtle"
                      role="presentation"
                    >
                      {row.label}
                    </li>
                  )
                }
                optionCursor += 1
                const idx = optionCursor
                const active = idx === activeIndex
                const isSelected = row.option.value === value
                return (
                  <li key={row.key} role="option" aria-selected={isSelected} aria-disabled={row.option.disabled}>
                    <button
                      type="button"
                      disabled={row.option.disabled}
                      className={cn(
                        'flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                        active && 'bg-brand-50 dark:bg-brand-900/30',
                        !active && 'hover:bg-surface',
                        row.option.disabled && 'opacity-50',
                      )}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => commit(row.option)}
                    >
                      <span className="mt-0.5 w-4 shrink-0">
                        {isSelected ? <Check className="h-4 w-4 text-brand-700" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-ink">{row.option.label}</span>
                        {row.option.description ? (
                          <span className="block text-xs text-ink-muted">{row.option.description}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                )
              })}
              {showCreate ? (
                <li role="option" aria-selected={activeIndex === optionRows.length}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-800 dark:text-brand-200',
                      activeIndex === optionRows.length && 'bg-brand-50 dark:bg-brand-900/30',
                    )}
                    onMouseEnter={() => setActiveIndex(optionRows.length)}
                    onClick={commitCreate}
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    {createLabel(query.trim())}
                  </button>
                </li>
              ) : null}
            </ul>
          </div>,
          document.body,
        )
      : null

    return (
      <div className={cn('relative w-full', className)}>
        {name ? <input type="hidden" name={name} value={value} readOnly /> : null}
        <button
          ref={triggerRef}
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-invalid={invalid || ariaInvalid ? true : undefined}
          aria-required={ariaRequired}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'erp-control flex w-full items-center gap-2 pl-3 pr-2 text-left',
            'focus-visible:ring-offset-1',
            (invalid || ariaInvalid) && 'border-danger focus-visible:ring-danger',
            disabled && 'cursor-not-allowed opacity-60',
          )}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-ink-subtle')}>
            {selected ? (
              <>
                <span className="font-medium text-ink">{selected.label}</span>
                {selected.description ? (
                  <span className="ml-2 text-xs text-ink-muted">{selected.description}</span>
                ) : null}
              </>
            ) : (
              placeholder
            )}
          </span>
          {clearable && value && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              className="rounded p-1 text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation()
                onChange?.('')
                triggerRef.current?.focus()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange?.('')
                }
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
        </button>
        {panel}
      </div>
    )
  },
)

SearchableSelect.displayName = 'SearchableSelect'
