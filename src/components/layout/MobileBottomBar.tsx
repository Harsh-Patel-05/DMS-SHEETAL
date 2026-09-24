import {
  Home,
  LayoutGrid,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import { canAccess, resolveModuleForPath } from '@/utils/permissions'

const NAV = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/transactions/sales', label: 'Sales', icon: ShoppingCart },
  { to: '/inventory/stock', label: 'Stock', icon: Package },
] as const

const QUICK = [
  { to: '/transactions/sales/new', label: 'New sale', icon: ShoppingCart, action: 'create' as const },
  { to: '/transactions/purchases/new', label: 'New purchase', icon: Receipt, action: 'create' as const },
  { to: '/transactions/expenses', label: 'Expense', icon: Wallet, action: 'create' as const },
  { to: '/inventory/adjustment', label: 'Stock adjust', icon: Package, action: 'create' as const },
  { to: '/transactions/sales-returns', label: 'Return', icon: LayoutGrid, action: 'create' as const },
] as const

export function MobileBottomBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [quickOpen, setQuickOpen] = useState(false)
  const session = useDmsStore((s) => s.session)
  const roles = useDmsStore((s) => s.roles)

  const navItems = useMemo(
    () =>
      NAV.filter((item) =>
        canAccess(session, roles, resolveModuleForPath(item.to), 'view'),
      ),
    [session, roles],
  )

  const quickItems = useMemo(
    () =>
      QUICK.filter((item) =>
        canAccess(session, roles, resolveModuleForPath(item.to), item.action),
      ),
    [session, roles],
  )

  const hideOnBilling =
    /^\/transactions\/(sales|purchases)\/(new|[^/]+\/edit)$/.test(location.pathname) ||
    /^\/transactions\/payments\/new$/.test(location.pathname)

  if (hideOnBilling) return null

  return (
    <>
      <nav className="mobile-bottom-bar md:hidden" aria-label="Mobile quick navigation">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={cn('mobile-bottom-item', active && 'mobile-bottom-item-active')}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </Link>
          )
        })}
        {quickItems.length > 0 ? (
          <button
            type="button"
            className="mobile-bottom-fab"
            aria-label="Quick actions"
            onClick={() => setQuickOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : null}
      </nav>

      {quickOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="erp-overlay absolute inset-0"
            aria-label="Close quick actions"
            onClick={() => setQuickOpen(false)}
          />
          <div className="mobile-quick-sheet absolute inset-x-0 bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-base font-semibold text-ink">Quick actions</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => setQuickOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {quickItems.map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  type="button"
                  className="mobile-quick-action"
                  onClick={() => {
                    setQuickOpen(false)
                    navigate(to)
                  }}
                >
                  <Icon className="h-5 w-5 text-brand-600 dark:text-brand-300" aria-hidden />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
