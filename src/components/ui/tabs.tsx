import {
  createContext,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within Tabs')
  return ctx
}

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({
  defaultValue = '',
  value: controlled,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const value = controlled ?? internal
  const setValue = (v: string) => {
    if (controlled === undefined) setInternal(v)
    onValueChange?.(v)
  }
  const baseId = useId()

  return (
    <TabsContext.Provider value={{ value, setValue, baseId }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex h-auto w-full max-w-full flex-wrap items-center gap-1 rounded-md border border-border bg-surface p-1 sm:inline-flex sm:h-9 sm:w-auto sm:flex-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: active, setValue, baseId } = useTabs()
  const selected = active === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(
        'inline-flex min-h-9 touch-manipulation items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors sm:h-7 sm:min-h-0',
        selected
          ? 'bg-surface-elevated text-ink shadow-card'
          : 'text-ink-muted hover:text-ink',
        className,
      )}
      onClick={() => setValue(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const { value: active, baseId } = useTabs()
  if (active !== value) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      className={cn('mt-3 focus-visible:outline-none', className)}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  )
}
