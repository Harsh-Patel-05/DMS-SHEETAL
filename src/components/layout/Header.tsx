import { Bell, ChevronDown, Keyboard, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Palette, Search, Settings2, Sun, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NetworkStatusIndicator } from '@/components/layout/NetworkStatusIndicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SearchInput } from '@/components/ui/search-input'
import { useToast } from '@/components/ui/toast'
import { applyThemeClass } from '@/hooks/use-theme-sync'
import { searchService } from '@/services'
import { useDmsStore } from '@/store/dms-store'
import { usePrefsStore } from '@/store/prefs-store'
import { cn } from '@/utils/cn'
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
  formatNotificationTime,
  normalizeNotification,
  unreadCount,
} from '@/utils/notifications'

export interface HeaderProps {
  onMenuToggle?: () => void
  onOpenShortcuts?: () => void
  onOpenCommandPalette?: () => void
}

function severityDot(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-danger'
    case 'warning':
      return 'bg-warning'
    case 'success':
      return 'bg-success'
    default:
      return 'bg-info'
  }
}

export function Header({ onMenuToggle, onOpenShortcuts, onOpenCommandPalette }: HeaderProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const session = useDmsStore((s) => s.session)
  const rawNotifications = useDmsStore((s) => s.notifications)
  const markNotificationRead = useDmsStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useDmsStore((s) => s.markAllNotificationsRead)
  const clearNotifications = useDmsStore((s) => s.clearNotifications)
  const logout = useDmsStore((s) => s.logout)
  const themePref = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const sidebarCollapsed = usePrefsStore((s) => s.sidebarCollapsed)
  const toggleSidebarCollapsed = usePrefsStore((s) => s.toggleSidebarCollapsed)

  const notifications = useMemo(
    () =>
      rawNotifications
        .map((n) => normalizeNotification(n))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [rawNotifications],
  )
  const unread = unreadCount(notifications)

  const isDarkUi =
    themePref === 'dark' ||
    (themePref === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => {
    const next = isDarkUi ? 'light' : 'dark'
    setTheme(next)
    applyThemeClass(next)
  }

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<Awaited<ReturnType<typeof searchService.global>> | null>(null)
  const [bellOpen, setBellOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null)
      return
    }
    setSearchLoading(true)
    try {
      const data = await searchService.global(q)
      setResults(data)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchOpen) void runSearch(query)
    }, 250)
    return () => window.clearTimeout(t)
  }, [query, searchOpen, runSearch])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setSearchOpen(false)
      setBellOpen(false)
      setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const searchResultCount = useMemo(() => {
    if (!results) return 0
    return (
      results.products.length +
      results.customers.length +
      results.distributors.length +
      results.suppliers.length +
      results.invoices.length +
      results.sales.length +
      results.purchases.length
    )
  }, [results])

  const searchStatusText = !query.trim()
    ? ''
    : searchLoading
      ? 'Searching…'
      : results
        ? searchResultCount === 0
          ? 'No results'
          : `${searchResultCount} result${searchResultCount === 1 ? '' : 's'} found`
        : ''

  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setLogoutOpen(false)
    navigate('/login', { replace: true })
    toast({ title: 'Signed out', variant: 'info' })
  }

  const resultSections: {
    key: keyof NonNullable<typeof results>
    label: string
    path: (id: string) => string
  }[] = [
    { key: 'products', label: 'Products', path: (id) => `/master/products/${id}` },
    { key: 'customers', label: 'Customers', path: (id) => `/parties/customers/${id}` },
    { key: 'distributors', label: 'Distributors', path: (id) => `/parties/distributors/${id}` },
    { key: 'suppliers', label: 'Suppliers', path: (id) => `/parties/suppliers/${id}` },
    { key: 'invoices', label: 'Invoices', path: (id) => `/transactions/invoices/${id}` },
    { key: 'sales', label: 'Sales', path: (id) => `/transactions/sales/${id}/edit` },
    { key: 'purchases', label: 'Purchases', path: (id) => `/transactions/purchases/${id}/edit` },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-surface-elevated/90 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-surface-elevated/75">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 text-ink-muted hover:text-ink lg:hidden"
          onClick={onMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden h-9 w-9 shrink-0 p-0 text-ink-muted hover:text-ink lg:inline-flex"
          onClick={() => toggleSidebarCollapsed()}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </Button>

        <div ref={searchRef} className="relative min-w-0 flex-1">
          <SearchInput
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onClear={() => {
              setQuery('')
              setResults(null)
            }}
            placeholder="Search products, parties, invoices…"
            className="w-full max-w-2xl [&_input]:border-border/80 [&_input]:bg-surface-sunken/60 [&_input]:shadow-none"
            aria-label="Search products, parties, and invoices"
            aria-expanded={searchOpen && Boolean(query.trim())}
            aria-controls="header-search-results"
            aria-autocomplete="list"
          />
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {searchStatusText}
          </div>
          {searchOpen && query.trim() ? (
            <div
              id="header-search-results"
              className="absolute left-0 top-full z-50 mt-1.5 max-h-96 w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface-elevated py-2 shadow-elevated"
              role="region"
              aria-label="Search results"
            >
              {searchLoading ? (
                <p className="px-3 py-2 text-sm text-ink-muted">Searching…</p>
              ) : results ? (
                resultSections.map(({ key, label, path }) => {
                  const rows = results[key] as {
                    id: string
                    name?: string
                    invoiceNo?: string
                    purchaseNo?: string
                    customerName?: string
                    supplierName?: string
                    companyName?: string
                    sku?: string
                  }[]
                  if (!rows?.length) return null
                  return (
                    <div key={key} className="px-2 py-1">
                      <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                        {label}
                      </p>
                      <ul>
                        {rows.map((row) => {
                          const title =
                            row.name ??
                            row.invoiceNo ??
                            row.purchaseNo ??
                            row.customerName ??
                            row.supplierName ??
                            row.companyName ??
                            row.sku ??
                            row.id
                          return (
                            <li key={row.id}>
                              <button
                                type="button"
                                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-muted"
                                onClick={() => {
                                  navigate(path(row.id))
                                  setSearchOpen(false)
                                  setQuery('')
                                }}
                              >
                                {title}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })
              ) : null}
              {results && !resultSections.some(({ key }) => (results[key] as unknown[]).length > 0) ? (
                <p className="px-3 py-2 text-sm text-ink-muted">No results</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-ink-muted hover:text-ink md:hidden"
            onClick={onOpenCommandPalette}
            aria-label="Open global search"
            title="Global search (Ctrl+K)"
          >
            <Search className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-ink-muted hover:text-ink"
            aria-label={isDarkUi ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkUi ? 'Light mode' : 'Dark mode'}
            onClick={toggleTheme}
          >
            {isDarkUi ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </Button>

          <NetworkStatusIndicator />

          <div ref={bellRef} className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'relative h-9 w-9 p-0 text-ink-muted hover:text-ink',
                bellOpen && 'bg-surface-muted text-ink',
              )}
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              aria-expanded={bellOpen}
              aria-controls="header-notifications-panel"
              onClick={() => {
                setUserMenuOpen(false)
                setBellOpen((v) => !v)
              }}
            >
              <Bell className="h-4 w-4" aria-hidden />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              ) : null}
            </Button>
            {bellOpen ? (
              <div
                id="header-notifications-panel"
                role="region"
                aria-label="Notifications"
                className="absolute right-0 top-full z-50 mt-1.5 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-elevated"
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <div>
                    <span className="text-sm font-semibold text-ink">Notifications</span>
                    {unread > 0 ? (
                      <span className="ml-2 text-xs text-ink-muted">{unread} unread</span>
                    ) : null}
                  </div>
                  <div className="flex gap-0.5">
                    <Button type="button" variant="ghost" size="sm" onClick={() => markAllNotificationsRead()}>
                      Mark all
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => clearNotifications()}>
                      Clear
                    </Button>
                  </div>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-ink-muted">No notifications</li>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          className={cn(
                            'w-full border-b border-border px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-surface-muted',
                            !n.read && 'bg-brand-50/60 dark:bg-brand-100/10',
                          )}
                          onClick={() => {
                            markNotificationRead(n.id)
                            const href = n.related?.href ?? n.link
                            if (href) navigate(href)
                            setBellOpen(false)
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', severityDot(n.severity))}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className={cn('font-medium text-ink', !n.read && 'font-semibold')}>
                                  {n.title}
                                </p>
                                <Badge variant="default" className="text-[10px]">
                                  {NOTIFICATION_CATEGORY_LABELS[n.category]}
                                </Badge>
                              </div>
                              <p className="text-xs text-ink-muted line-clamp-2">{n.message}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                                <span>{formatNotificationTime(n.createdAt)}</span>
                                <span>· {NOTIFICATION_SEVERITY_LABELS[n.severity]}</span>
                                {n.related ? <span>· {n.related.label}</span> : null}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                <div className="border-t border-border p-1.5">
                  <Link
                    to="/admin/notifications"
                    className="block rounded-md px-2 py-2 text-center text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30"
                    onClick={() => setBellOpen(false)}
                  >
                    Open notification center
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          <div ref={userMenuRef} className="relative ml-1 border-l border-border pl-1.5 sm:ml-1.5 sm:pl-2">
            <button
              type="button"
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-md px-1.5 text-left transition-colors sm:px-2',
                'hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
                userMenuOpen && 'bg-surface-muted',
              )}
              aria-label="Account menu"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-controls="header-user-menu"
              onClick={() => {
                setBellOpen(false)
                setUserMenuOpen((v) => !v)
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-1 ring-brand-200/80 dark:bg-brand-100/20 dark:text-brand-200 dark:ring-brand-700/40">
                <User className="h-4 w-4" aria-hidden />
              </div>
              <div className="hidden min-w-0 max-w-[9.5rem] md:block">
                <p className="truncate text-sm font-medium leading-none text-ink">
                  {session?.user.name ?? 'User'}
                </p>
                <p className="mt-0.5 truncate text-[11px] leading-none text-ink-muted">
                  {session?.user.roleName ?? '—'}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform',
                  userMenuOpen && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
            {userMenuOpen ? (
              <div
                id="header-user-menu"
                role="menu"
                aria-label="Account"
                className="absolute right-0 top-full z-50 mt-1.5 w-[17.5rem] overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-elevated"
              >
                <div className="flex items-center gap-3 border-b border-border bg-surface-muted/40 px-3.5 py-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-2 ring-brand-200/70 dark:bg-brand-100/20 dark:text-brand-200 dark:ring-brand-700/40">
                    <User className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {session?.user.name ?? 'User'}
                    </p>
                    {session?.user.email ? (
                      <p className="mt-0.5 truncate text-xs text-ink-muted">{session.user.email}</p>
                    ) : null}
                    <span className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200/80 dark:bg-brand-100/15 dark:text-brand-200 dark:ring-brand-700/40">
                      {session?.user.roleName ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="p-1.5">
                  <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                    Account
                  </p>
                  <Link
                    to="/admin/personalization"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-muted text-ink-muted">
                      <Palette className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">Personalization</span>
                      <span className="block text-[11px] text-ink-muted">Theme &amp; layout</span>
                    </span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-muted text-ink-muted">
                      <Settings2 className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">Settings</span>
                      <span className="block text-[11px] text-ink-muted">Business &amp; preferences</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-muted"
                    onClick={() => {
                      setUserMenuOpen(false)
                      onOpenShortcuts?.()
                    }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-muted text-ink-muted">
                      <Keyboard className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">Keyboard shortcuts</span>
                      <span className="block text-[11px] text-ink-muted">Press ? anytime</span>
                    </span>
                  </button>
                </div>

                <div className="border-t border-border p-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-danger hover:bg-danger-bg"
                    onClick={() => {
                      setUserMenuOpen(false)
                      setLogoutOpen(true)
                    }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-danger-bg text-danger">
                      <LogOut className="h-4 w-4" aria-hidden />
                    </span>
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Sign out?"
        description="You will need to sign in again to continue using DMS.SHEETAL COOL."
        confirmLabel="Sign out"
        onConfirm={handleLogout}
      />
    </header>
  )
}
