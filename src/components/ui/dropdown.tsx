import { ChevronDown } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerId: string
  menuId: string
}

const DropdownContext = createContext<DropdownContextValue | null>(null)

function useDropdown() {
  const ctx = useContext(DropdownContext)
  if (!ctx) throw new Error('Dropdown components must be used within Dropdown')
  return ctx
}

export interface DropdownProps {
  children: ReactNode
  className?: string
}

export function Dropdown({ children, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const uid = useId()
  const triggerId = `${uid}-trigger`
  const menuId = `${uid}-menu`
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        const trigger = document.getElementById(triggerId) as HTMLElement | null
        trigger?.focus()
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, triggerId])

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerId, menuId }}>
      <div ref={rootRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

export interface DropdownTriggerProps {
  children: ReactNode
  className?: string
  /** Show chevron (default true) */
  chevron?: boolean
  'aria-label'?: string
}

export function DropdownTrigger({
  children,
  className,
  chevron = true,
  'aria-label': ariaLabel,
}: DropdownTriggerProps) {
  const { open, setOpen, triggerId, menuId } = useDropdown()

  return (
    <Button
      id={triggerId}
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'gap-1.5 border-border/90 bg-surface-elevated text-ink shadow-none',
        'hover:border-brand-300 hover:bg-brand-50/60 hover:text-ink',
        open && 'border-brand-300 bg-brand-50/80 text-ink',
        className,
      )}
      aria-label={ariaLabel}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={() => setOpen(!open)}
    >
      {children}
      {chevron ? (
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-ink-muted transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      ) : null}
    </Button>
  )
}

export interface DropdownMenuProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'end'
}

export function DropdownMenu({ children, className, align = 'end' }: DropdownMenuProps) {
  const { open, menuId, triggerId, setOpen } = useDropdown()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')
    items?.[0]?.focus()
  }, [open])

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    )
    if (items.length === 0) return
    const current = document.activeElement as HTMLElement | null
    const index = items.findIndex((el) => el === current)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = index < 0 ? 0 : (index + 1) % items.length
      items[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length
      items[next]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-labelledby={triggerId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        'absolute z-50 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-surface-elevated py-1 shadow-elevated',
        align === 'end' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export interface DropdownItemProps {
  children: ReactNode
  onSelect?: () => void
  className?: string
  disabled?: boolean
  destructive?: boolean
}

export function DropdownItem({
  children,
  onSelect,
  className,
  disabled,
  destructive,
}: DropdownItemProps) {
  const { setOpen } = useDropdown()

  const handle = useCallback(() => {
    if (disabled) return
    onSelect?.()
    setOpen(false)
  }, [disabled, onSelect, setOpen])

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={cn(
        'flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-ink',
        'hover:bg-brand-50/80 focus-visible:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400',
        'dark:hover:bg-brand-100/10 dark:focus-visible:bg-brand-100/15',
        destructive &&
          'text-danger hover:bg-danger-bg focus-visible:bg-danger-bg dark:hover:bg-danger-bg',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
      onClick={handle}
    >
      {children}
    </button>
  )
}
