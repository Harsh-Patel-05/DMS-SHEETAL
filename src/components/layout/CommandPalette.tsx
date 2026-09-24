import {
  ArrowRight,
  FileText,
  LayoutGrid,
  Package,
  Receipt,
  Search,
  Truck,
  UserRound,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { navGroups } from '@/config/navigation'
import { Modal } from '@/components/ui/modal'
import { searchService } from '@/services'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import { canAccess, filterNavGroups, resolveModuleForPath } from '@/utils/permissions'
import type { PermissionAction } from '@/utils/permissions'

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

type PaletteCategory =
  | 'Navigation'
  | 'Quick Actions'
  | 'Products'
  | 'Customers'
  | 'Distributors'
  | 'Suppliers'
  | 'Sales'
  | 'Purchases'
  | 'Invoices'
  | 'Payments'
  | 'Reports'
  | 'Settings'

interface PaletteItem {
  id: string
  category: PaletteCategory
  label: string
  hint?: string
  to: string
}

const QUICK_ACTIONS: (Omit<PaletteItem, 'category'> & {
  action?: PermissionAction
})[] = [
  { id: 'qa-sale', label: 'Create Sale', hint: 'New sales invoice', to: '/transactions/sales/new', action: 'create' },
  { id: 'qa-purchase', label: 'Create Purchase', hint: 'New purchase bill', to: '/transactions/purchases/new', action: 'create' },
  { id: 'qa-product', label: 'Add Product', hint: 'Master products', to: '/master/products', action: 'create' },
  { id: 'qa-customer', label: 'Add Customer', hint: 'Party master', to: '/parties/customers', action: 'create' },
  { id: 'qa-payment', label: 'Receive Payment', hint: 'Record payment', to: '/transactions/payments/new', action: 'create' },
  { id: 'qa-adjust', label: 'Stock Adjustment', hint: 'Inventory', to: '/inventory/adjustment', action: 'create' },
]

const categoryIcon: Record<PaletteCategory, typeof Search> = {
  Navigation: LayoutGrid,
  'Quick Actions': Zap,
  Products: Package,
  Customers: UserRound,
  Distributors: Truck,
  Suppliers: Truck,
  Sales: Receipt,
  Purchases: Package,
  Invoices: Receipt,
  Payments: Truck,
  Reports: LayoutGrid,
  Settings: LayoutGrid,
}

function navItems(
  query: string,
  groups: typeof navGroups,
): PaletteItem[] {
  const q = query.trim().toLowerCase()
  const items: PaletteItem[] = []
  for (const group of groups) {
    for (const item of group.items) {
      const hay = `${group.label} ${item.label} ${item.to}`.toLowerCase()
      if (!q || hay.includes(q)) {
        const category: PaletteCategory =
          group.id === 'reports'
            ? 'Reports'
            : group.id === 'admin' && item.to === '/admin/settings'
              ? 'Settings'
              : group.id === 'parties' && item.label === 'Distributors'
                ? 'Distributors'
                : group.id === 'transactions' && item.label === 'Sales'
                  ? 'Sales'
                  : group.id === 'transactions' && item.label === 'Purchases'
                    ? 'Purchases'
                    : group.id === 'transactions' && item.label === 'Payments'
                      ? 'Payments'
                      : 'Navigation'
        items.push({
          id: `nav-${item.to}`,
          category,
          label: item.label,
          hint: group.label,
          to: item.to,
        })
      }
    }
  }
  return items
}

function quickActionItems(
  query: string,
  session: ReturnType<typeof useDmsStore.getState>['session'],
  roles: ReturnType<typeof useDmsStore.getState>['roles'],
): PaletteItem[] {
  const q = query.trim().toLowerCase()
  return QUICK_ACTIONS.filter((a) => {
    const mod = resolveModuleForPath(a.to)
    const action = a.action ?? 'view'
    if (!canAccess(session, roles, mod, action)) return false
    return !q || `${a.label} ${a.hint ?? ''} ${a.to}`.toLowerCase().includes(q)
  }).map(({ action: _action, ...a }) => ({ ...a, category: 'Quick Actions' as const }))
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const session = useDmsStore((s) => s.session)
  const roles = useDmsStore((s) => s.roles)
  const visibleGroups = useMemo(
    () => filterNavGroups(navGroups, session, roles),
    [session, roles],
  )
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchService.global>> | null>(
    null,
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
      setSearchResults(null)
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (!q) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }
    let cancelled = false
    setSearchLoading(true)
    const timer = window.setTimeout(() => {
      void searchService.global(q).then((data) => {
        if (!cancelled) {
          setSearchResults(data)
          setSearchLoading(false)
        }
      })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, open])

  const entityItems = useMemo((): PaletteItem[] => {
    if (!searchResults || !query.trim()) return []
    const rows: PaletteItem[] = []
    for (const p of searchResults.products) {
      rows.push({
        id: `prod-${p.id}`,
        category: 'Products',
        label: p.name,
        hint: p.sku,
        to: `/master/products/${p.id}`,
      })
    }
    for (const c of searchResults.customers) {
      rows.push({
        id: `cust-${c.id}`,
        category: 'Customers',
        label: c.name,
        hint: c.mobile,
        to: `/parties/customers/${c.id}`,
      })
    }
    for (const d of searchResults.distributors) {
      rows.push({
        id: `dis-${d.id}`,
        category: 'Distributors',
        label: d.companyName,
        hint: d.mobile,
        to: `/parties/distributors/${d.id}`,
      })
    }
    for (const sale of searchResults.sales) {
      rows.push({
        id: `sale-${sale.id}`,
        category: 'Sales',
        label: sale.invoiceNo,
        hint: sale.customerName,
        to: `/transactions/sales/${sale.id}/edit`,
      })
    }
    for (const purchase of searchResults.purchases) {
      rows.push({
        id: `pur-${purchase.id}`,
        category: 'Purchases',
        label: purchase.purchaseNo,
        hint: purchase.supplierName,
        to: `/transactions/purchases/${purchase.id}/edit`,
      })
    }
    for (const pay of searchResults.payments) {
      rows.push({
        id: `pay-${pay.id}`,
        category: 'Payments',
        label: pay.paymentNo,
        hint: `${pay.partyName} · ${pay.method}`,
        to: '/transactions/payments',
      })
    }
    for (const s of searchResults.suppliers) {
      rows.push({
        id: `sup-${s.id}`,
        category: 'Suppliers',
        label: s.name,
        to: `/parties/suppliers/${s.id}`,
      })
    }
    for (const i of searchResults.invoices) {
      rows.push({
        id: `inv-${i.id}`,
        category: 'Invoices',
        label: i.invoiceNo,
        hint: i.customerName,
        to: `/transactions/invoices/${i.id}`,
      })
    }
    return rows
  }, [searchResults, query])

  const staticItems = useMemo(() => {
    const nav = navItems(query, visibleGroups)
    const actions = quickActionItems(query, session, roles).filter((a) =>
      visibleGroups.some((g) => g.items.some((i) => a.to === i.to || a.to.startsWith(`${i.to}/`))),
    )
    return [...actions, ...nav]
  }, [query, visibleGroups, session, roles])

  const flatItems = useMemo(() => [...staticItems, ...entityItems], [staticItems, entityItems])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, flatItems.length])

  const goTo = useCallback(
    (item: PaletteItem) => {
      navigate(item.to)
      onClose()
    },
    [navigate, onClose],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (flatItems.length ? (i + 1) % flatItems.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (flatItems.length ? (i - 1 + flatItems.length) % flatItems.length : 0))
    } else if (e.key === 'Enter' && flatItems[activeIndex]) {
      e.preventDefault()
      goTo(flatItems[activeIndex])
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const grouped = useMemo(() => {
    const order: PaletteCategory[] = [
      'Quick Actions',
      'Products',
      'Customers',
      'Distributors',
      'Suppliers',
      'Sales',
      'Purchases',
      'Invoices',
      'Payments',
      'Reports',
      'Settings',
      'Navigation',
    ]
    const map = new Map<PaletteCategory, PaletteItem[]>()
    for (const item of flatItems) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return order
      .map((cat) => ({ category: cat, items: map.get(cat) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [flatItems])

  let runningIndex = -1

  return (
    <Modal open={open} onClose={onClose} title="Command palette" size="lg" className="max-w-xl">
      <div className="space-y-3" onKeyDown={onKeyDown}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, customers, distributors, suppliers, sales, purchases, invoices, payments, reports, settings…"
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none ring-brand-500/30 placeholder:text-ink-subtle focus-visible:border-brand-500 focus-visible:ring-2"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search commands and records"
            aria-controls="command-palette-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              flatItems[activeIndex] ? `command-option-${flatItems[activeIndex].id}` : undefined
            }
            data-autofocus="true"
          />
        </div>
        <p className="text-xs text-ink-muted" id="command-palette-hint">
          <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>{' '}
          navigate ·{' '}
          <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>{' '}
          open ·{' '}
          <kbd className="rounded border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>{' '}
          close
        </p>
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {searchLoading && query.trim()
            ? 'Searching records…'
            : !searchLoading && flatItems.length === 0
              ? 'No matching commands or records'
              : `${flatItems.length} result${flatItems.length === 1 ? '' : 's'} available`}
        </div>
        <div
          ref={listRef}
          id="command-palette-listbox"
          role="listbox"
          aria-label="Command results"
          className="max-h-[min(50vh,360px)] overflow-y-auto scrollbar-thin"
        >
          {searchLoading && query.trim() ? (
            <p className="px-2 py-3 text-sm text-ink-muted">Searching records…</p>
          ) : null}
          {!searchLoading && flatItems.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-muted">No matching commands or records</p>
          ) : (
            grouped.map(({ category, items }) => {
              const CatIcon = categoryIcon[category]
              return (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <CatIcon className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{category}</span>
                  </div>
                  <ul className="space-y-0.5" role="presentation">
                    {items.map((item) => {
                      runningIndex += 1
                      const idx = runningIndex
                      const active = idx === activeIndex
                      return (
                        <li key={item.id} role="presentation">
                          <button
                            type="button"
                            id={`command-option-${item.id}`}
                            role="option"
                            aria-selected={active}
                            data-index={idx}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                              active ? 'bg-brand-600 text-white' : 'text-ink hover:bg-surface',
                            )}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => goTo(item)}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{item.label}</span>
                              {item.hint ? (
                                <span
                                  className={cn(
                                    'block truncate text-xs',
                                    active ? 'text-brand-100' : 'text-ink-muted',
                                  )}
                                >
                                  {item.hint}
                                </span>
                              ) : null}
                            </span>
                            <ArrowRight
                              className={cn('h-4 w-4 shrink-0 opacity-60', active ? 'text-white' : 'text-ink-subtle')}
                              aria-hidden
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          )}
        </div>
        {query.trim() && entityItems.length === 0 && !searchLoading && staticItems.length > 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <FileText className="h-3.5 w-3.5" />
            No matching records found for this query. Showing commands instead.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
