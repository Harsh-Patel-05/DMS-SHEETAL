import type { NavGroup, NavItem } from '@/config/navigation'
import type { Permission, PermissionModule, Role, RoleName } from '@/types'

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

type SessionLike = {
  user: { roleId: string; roleName: RoleName }
} | null

/** Map URL path prefixes → permission module (longest match wins). */
const PATH_MODULE_RULES: { prefix: string; module: PermissionModule | null }[] = [
  { prefix: '/dashboard', module: 'dashboard' },
  { prefix: '/master/products', module: 'products' },
  { prefix: '/master/categories', module: 'products' },
  { prefix: '/master/brands', module: 'products' },
  { prefix: '/master/units', module: 'products' },
  { prefix: '/master/gst-rates', module: 'products' },
  { prefix: '/parties/customers', module: 'customers' },
  { prefix: '/parties/distributors', module: 'distributors' },
  { prefix: '/parties/suppliers', module: 'suppliers' },
  { prefix: '/transactions/purchases', module: 'purchase' },
  { prefix: '/transactions/sales', module: 'sales' },
  { prefix: '/transactions/invoices', module: 'invoices' },
  { prefix: '/transactions/payments', module: 'payments' },
  { prefix: '/transactions/sales-returns', module: 'returns' },
  { prefix: '/transactions/purchase-returns', module: 'returns' },
  { prefix: '/transactions/expenses', module: 'expenses' },
  { prefix: '/inventory', module: 'stock' },
  { prefix: '/finance', module: 'reports' },
  { prefix: '/reports', module: 'reports' },
  { prefix: '/admin/users', module: 'users' },
  { prefix: '/admin/roles', module: 'users' },
  { prefix: '/admin/permissions', module: 'users' },
  { prefix: '/admin/approvals', module: 'approvals' },
  { prefix: '/admin/audit-logs', module: 'audit_logs' },
  { prefix: '/admin/settings', module: 'settings' },
  { prefix: '/admin/demo', module: 'settings' },
  { prefix: '/admin/personalization', module: 'settings' },
  { prefix: '/admin/import', module: 'settings' },
  { prefix: '/admin/export', module: 'settings' },
  { prefix: '/admin/notifications', module: 'settings' },
  { prefix: '/admin/activity', module: 'audit_logs' },
  { prefix: '/admin', module: 'users' },
  { prefix: '/forbidden', module: null },
  { prefix: '/login', module: null },
]

export function resolveModuleForPath(pathname: string): PermissionModule | null {
  const path = pathname.split('?')[0] || '/'
  const sorted = [...PATH_MODULE_RULES].sort((a, b) => b.prefix.length - a.prefix.length)
  for (const rule of sorted) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.module
    }
  }
  return null
}

export function getRolePermissions(roles: Role[], roleId: string, roleName?: RoleName): Permission[] {
  const role = roles.find((r) => r.id === roleId) ?? roles.find((r) => r.name === roleName)
  return role?.permissions ?? []
}

export function canAccess(
  session: SessionLike,
  roles: Role[],
  module: PermissionModule | null | undefined,
  action: PermissionAction = 'view',
): boolean {
  if (!session) return false
  if (!module) return true
  if (session.user.roleName === 'Super Admin') return true
  const perms = getRolePermissions(roles, session.user.roleId, session.user.roleName)
  const row = perms.find((p) => p.module === module)
  if (!row) return false
  return Boolean(row[action])
}

export function filterNavGroups(
  groups: NavGroup[],
  session: SessionLike,
  roles: Role[],
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const module = item.module ?? resolveModuleForPath(item.to)
        return canAccess(session, roles, module, 'view')
      }),
    }))
    .filter((group) => group.items.length > 0)
}

export function filterNavItems(
  items: NavItem[],
  session: SessionLike,
  roles: Role[],
): NavItem[] {
  return items.filter((item) => {
    const module = item.module ?? resolveModuleForPath(item.to)
    return canAccess(session, roles, module, 'view')
  })
}

export const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  stock: 'Stock',
  purchase: 'Purchase',
  sales: 'Sales',
  invoices: 'Invoices',
  payments: 'Payments',
  customers: 'Customers',
  distributors: 'Distributors',
  suppliers: 'Suppliers',
  returns: 'Returns',
  expenses: 'Expenses',
  reports: 'Reports',
  users: 'Users',
  settings: 'Settings',
  audit_logs: 'Audit logs',
  approvals: 'Approvals',
}
