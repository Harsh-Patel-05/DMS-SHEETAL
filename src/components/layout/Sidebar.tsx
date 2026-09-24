import { ChevronDown, Snowflake } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { navGroups, type NavGroup } from '@/config/navigation'
import { useFocusTrap } from '@/hooks/use-focus-trap'
import { useDmsStore } from '@/store/dms-store'
import { usePrefsStore } from '@/store/prefs-store'
import { cn } from '@/utils/cn'
import { filterNavGroups } from '@/utils/permissions'

export interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  className?: string
}

function groupActive(pathname: string, items: { to: string }[]) {
  return items.some((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))
}

export function Sidebar({ mobileOpen, onMobileClose, className }: SidebarProps) {
  const { pathname } = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const collapsed = usePrefsStore((s) => s.sidebarCollapsed)
  const session = useDmsStore((s) => s.session)
  const roles = useDmsStore((s) => s.roles)
  const mobileNavRef = useRef<HTMLElement>(null)
  const visibleGroups = useMemo(
    () => filterNavGroups(navGroups, session, roles),
    [session, roles],
  )

  useFocusTrap(Boolean(mobileOpen), mobileNavRef)

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, onMobileClose])

  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const g of visibleGroups) {
      if (groupActive(pathname, g.items)) next[g.id] = true
    }
    setOpenGroups((prev) => ({ ...prev, ...next }))
  }, [pathname, visibleGroups])

  const toggle = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const content = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className={cn('flex h-14 shrink-0 items-center border-b border-white/10', collapsed ? 'justify-center px-2' : 'gap-2.5 px-4')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-400/20 text-brand-200">
            <Snowflake className="h-5 w-5" aria-hidden />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold leading-tight text-white">DMS.SHEETAL</p>
              <p className="text-[11px] font-medium tracking-[0.18em] text-brand-300">COOL</p>
            </div>
          ) : null}
        </div>
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
          <ul className="space-y-1">
            {visibleGroups.map((group) => {
              const isOpen = openGroups[group.id] ?? false
              const Icon = group.icon
              const active = groupActive(pathname, group.items)
              const single = group.items.length === 1

              if (collapsed) {
                const target = single ? group.items[0].to : group.items.find((i) => pathname.startsWith(i.to))?.to ?? group.items[0].to
                return (
                  <li key={group.id}>
                    <NavLink
                      to={target}
                      onClick={onMobileClose}
                      title={group.label}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-center rounded-md px-2 py-2.5 transition-colors',
                          isActive || active
                            ? 'bg-brand-600 text-white'
                            : 'text-brand-100/90 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span className="sr-only">{group.label}</span>
                    </NavLink>
                  </li>
                )
              }

              if (single) {
                const item = group.items[0]
                return (
                  <li key={group.id}>
                    <NavLink
                      to={item.to}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive || active
                            ? 'bg-brand-600 text-white'
                            : 'text-brand-100/90 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {group.label}
                    </NavLink>
                  </li>
                )
              }

              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggle(group.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                      active ? 'bg-white/10 text-white' : 'text-brand-100/90 hover:bg-white/10 hover:text-white',
                    )}
                    aria-expanded={isOpen}
                    aria-controls={`nav-group-${group.id}`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn('h-4 w-4 shrink-0 transition-transform duration-150', isOpen && 'rotate-180')}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <ul id={`nav-group-${group.id}`} className="mt-0.5 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                      {group.items.map((item) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            onClick={onMobileClose}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                                isActive
                                  ? 'bg-brand-600 font-medium text-white'
                                  : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
                              )
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </nav>
        <div className={cn('border-t border-white/10 py-3', collapsed ? 'px-2' : 'px-4')}>
          {!collapsed ? (
            <p className="text-xs text-brand-200/70">© {new Date().getFullYear()} Sheetal Cool</p>
          ) : null}
        </div>
      </div>
    ),
    [collapsed, onMobileClose, openGroups, pathname, visibleGroups],
  )

  return (
    <>
      <aside
        className={cn(
          'hidden shrink-0 flex-col text-white transition-[width] duration-200 ease-out lg:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
          className,
        )}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
        aria-label="Application sidebar"
      >
        {content}
      </aside>
      {mobileOpen ? (
        <>
          <button
            type="button"
            className="erp-anim-overlay fixed inset-0 z-40 bg-ink/50 lg:hidden"
            aria-label="Close menu"
            onClick={onMobileClose}
          />
          <aside
            ref={mobileNavRef}
            className="erp-anim-sidebar-mobile fixed inset-y-0 left-0 z-50 flex w-72 flex-col text-white shadow-elevated lg:hidden"
            style={{ backgroundColor: 'var(--color-sidebar)' }}
            aria-labelledby="mobile-nav-title"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <SidebarMobileBody
              groups={visibleGroups}
              pathname={pathname}
              openGroups={openGroups}
              onToggleGroup={toggle}
              onMobileClose={onMobileClose}
            />
          </aside>
        </>
      ) : null}
    </>
  )
}

function SidebarMobileBody({
  groups,
  pathname,
  openGroups,
  onToggleGroup,
  onMobileClose,
}: {
  groups: NavGroup[]
  pathname: string
  openGroups: Record<string, boolean>
  onToggleGroup: (id: string) => void
  onMobileClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-400/20 text-brand-200">
          <Snowflake className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p id="mobile-nav-title" className="font-display text-sm font-semibold leading-tight text-white">
            DMS.SHEETAL
          </p>
          <p className="text-[11px] font-medium tracking-[0.18em] text-brand-300">COOL</p>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        <ul className="space-y-1">
          {groups.map((group) => {
            const isOpen = openGroups[group.id] ?? false
            const Icon = group.icon
            const active = groupActive(pathname, group.items)
            const single = group.items.length === 1

            if (single) {
              const item = group.items[0]
              return (
                <li key={group.id}>
                  <NavLink
                    to={item.to}
                    onClick={onMobileClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive || active
                          ? 'bg-brand-600 text-white'
                          : 'text-brand-100/90 hover:bg-white/10 hover:text-white',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {group.label}
                  </NavLink>
                </li>
              )
            }

            return (
              <li key={group.id}>
                <button
                  type="button"
                  onClick={() => onToggleGroup(group.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
                    active ? 'bg-white/10 text-white' : 'text-brand-100/90 hover:bg-white/10 hover:text-white',
                  )}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-mobile-${group.id}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 transition-transform duration-150', isOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <ul id={`nav-group-mobile-${group.id}`} className="mt-0.5 ml-4 space-y-0.5 border-l border-white/10 pl-3">
                    {group.items.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onMobileClose}
                          className={({ isActive }) =>
                            cn(
                              'block rounded-md px-2 py-1.5 text-sm transition-colors',
                              isActive
                                ? 'bg-brand-600 font-medium text-white'
                                : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
                            )
                          }
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
