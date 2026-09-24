import {
  ClipboardList,
  FileSpreadsheet,
  Inbox,
  Package,
  Receipt,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { usePermission } from '@/hooks/use-permission'
import type { PermissionModule } from '@/types'
import type { PermissionAction } from '@/utils/permissions'

export type ModuleEmptyKey =
  | 'sales'
  | 'purchases'
  | 'products'
  | 'customers'
  | 'distributors'
  | 'suppliers'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'salesReturns'
  | 'purchaseReturns'
  | 'adjustments'
  | 'transfers'
  | 'stock'
  | 'lowStock'
  | 'approvals'
  | 'notifications'
  | 'users'
  | 'categories'
  | 'brands'
  | 'units'
  | 'gstRates'
  | 'exports'
  | 'imports'
  | 'reports'
  | 'generic'

interface ModuleEmptyConfig {
  icon: LucideIcon
  title: string
  description: string
  /** Permission module for primary create CTA (omit = always show if configured) */
  permissionModule?: PermissionModule
  primaryAction?: PermissionAction
  primary?: { label: string; to?: string; onClick?: () => void }
  secondary?: { label: string; to?: string; onClick?: () => void }
}

const PRESETS: Record<ModuleEmptyKey, ModuleEmptyConfig> = {
  sales: {
    icon: ShoppingCart,
    title: 'No sales found',
    description: 'Create your first sale or import historical invoices to get started.',
    permissionModule: 'sales',
    primaryAction: 'create',
    primary: { label: 'Create Sale', to: '/transactions/sales/new' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  purchases: {
    icon: ClipboardList,
    title: 'No purchases found',
    description: 'Record a purchase bill or import supplier invoices.',
    permissionModule: 'purchase',
    primaryAction: 'create',
    primary: { label: 'Create Purchase', to: '/transactions/purchases/new' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  products: {
    icon: Package,
    title: 'No products found',
    description: 'Add products to your catalog or import a product list.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add Product', to: '/master/products' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  customers: {
    icon: Users,
    title: 'No customers found',
    description: 'Add customers to start selling, or import your party list.',
    permissionModule: 'customers',
    primaryAction: 'create',
    primary: { label: 'Add Customer', to: '/parties/customers' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  distributors: {
    icon: Users,
    title: 'No distributors found',
    description: 'Add distributors or import party master data.',
    permissionModule: 'distributors',
    primaryAction: 'create',
    primary: { label: 'Add Distributor', to: '/parties/distributors' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  suppliers: {
    icon: Users,
    title: 'No suppliers found',
    description: 'Add suppliers for purchases, or import your vendor list.',
    permissionModule: 'suppliers',
    primaryAction: 'create',
    primary: { label: 'Add Supplier', to: '/parties/suppliers' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  invoices: {
    icon: Receipt,
    title: 'No invoices found',
    description: 'Invoices appear when sales are confirmed. Create a sale to begin.',
    permissionModule: 'sales',
    primaryAction: 'create',
    primary: { label: 'Create Sale', to: '/transactions/sales/new' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  payments: {
    icon: Wallet,
    title: 'No payments found',
    description: 'Record a payment against outstanding invoices, or import payment history.',
    permissionModule: 'payments',
    primaryAction: 'create',
    primary: { label: 'Record Payment', to: '/transactions/payments/new' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  expenses: {
    icon: Wallet,
    title: 'No expenses found',
    description: 'Track business expenses to keep profit reports accurate.',
    permissionModule: 'expenses',
    primaryAction: 'create',
    primary: { label: 'Add Expense', to: '/transactions/expenses' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  salesReturns: {
    icon: ShoppingCart,
    title: 'No sales returns found',
    description: 'Create a return when goods come back from a customer.',
    permissionModule: 'returns',
    primaryAction: 'create',
    primary: { label: 'New Return', to: '/transactions/sales-returns' },
  },
  purchaseReturns: {
    icon: ClipboardList,
    title: 'No purchase returns found',
    description: 'Create a return when sending goods back to a supplier.',
    permissionModule: 'returns',
    primaryAction: 'create',
    primary: { label: 'New Return', to: '/transactions/purchase-returns' },
  },
  adjustments: {
    icon: Package,
    title: 'No stock adjustments found',
    description: 'Adjust stock for damage, count corrections, or opening balances.',
    permissionModule: 'stock',
    primaryAction: 'create',
    primary: { label: 'New Adjustment', to: '/inventory/adjustment' },
  },
  transfers: {
    icon: Package,
    title: 'No transfers found',
    description: 'Move stock between locations when you start using multi-godown.',
    permissionModule: 'stock',
    primaryAction: 'create',
    primary: { label: 'New Transfer', to: '/inventory/transfer' },
  },
  stock: {
    icon: Package,
    title: 'No stock records',
    description: 'Add products with opening stock, or import inventory.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add Product', to: '/master/products' },
    secondary: { label: 'Import Data', to: '/admin/import' },
  },
  lowStock: {
    icon: Package,
    title: 'All products above minimum',
    description: 'Nothing needs reorder right now. Check again after sales activity.',
    primary: { label: 'View Stock', to: '/inventory/stock' },
  },
  approvals: {
    icon: ClipboardList,
    title: 'No approvals pending',
    description: 'Discount, credit, and stock requests will appear here when submitted.',
  },
  notifications: {
    icon: Receipt,
    title: 'No notifications',
    description: 'System alerts and reminders will show up here.',
  },
  users: {
    icon: Users,
    title: 'No users found',
    description: 'Invite team members to collaborate in DMS.',
    permissionModule: 'users',
    primaryAction: 'create',
    primary: { label: 'Manage Users', to: '/admin/users' },
  },
  categories: {
    icon: Package,
    title: 'No categories found',
    description: 'Organize products with categories before building your catalog.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add Category', to: '/master/categories' },
  },
  brands: {
    icon: Package,
    title: 'No brands found',
    description: 'Add brands to classify products in reports and filters.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add Brand', to: '/master/brands' },
  },
  units: {
    icon: Package,
    title: 'No units found',
    description: 'Define units of measure used on invoices and stock.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add Unit', to: '/master/units' },
  },
  gstRates: {
    icon: Receipt,
    title: 'No GST rates found',
    description: 'Configure GST slabs for tax calculation on bills.',
    permissionModule: 'products',
    primaryAction: 'create',
    primary: { label: 'Add GST Rate', to: '/master/gst-rates' },
  },
  exports: {
    icon: FileSpreadsheet,
    title: 'No exports yet',
    description: 'Run an export to download data for backup or sharing.',
    primary: { label: 'Open Export Center', to: '/admin/export' },
  },
  imports: {
    icon: FileSpreadsheet,
    title: 'No import activity',
    description: 'Import CSV data to seed masters and transactions.',
    primary: { label: 'Open Import Center', to: '/admin/import' },
  },
  reports: {
    icon: FileSpreadsheet,
    title: 'No records in range',
    description: 'Try a wider date range, or create transactions to populate this report.',
    permissionModule: 'sales',
    primaryAction: 'create',
    primary: { label: 'Create Sale', to: '/transactions/sales/new' },
    secondary: { label: 'Dashboard', to: '/dashboard' },
  },
  generic: {
    icon: Inbox,
    title: 'No records found',
    description: 'Nothing matches this view yet. Create data or clear filters.',
  },
}

export function getModuleEmptyConfig(key: ModuleEmptyKey): ModuleEmptyConfig {
  return PRESETS[key] ?? PRESETS.generic
}

function ActionButton({
  label,
  to,
  onClick,
  variant = 'primary',
}: {
  label: string
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'outline'
}) {
  if (to) {
    return (
      <Link to={to}>
        <Button type="button" variant={variant} className="min-h-10 touch-manipulation">
          {label}
        </Button>
      </Link>
    )
  }
  return (
    <Button type="button" variant={variant} className="min-h-10 touch-manipulation" onClick={onClick}>
      {label}
    </Button>
  )
}

export interface ModuleEmptyStateProps {
  module: ModuleEmptyKey
  /** Override title */
  title?: string
  description?: string
  /** Extra CTAs appended after presets */
  extraActions?: ReactNode
  className?: string
  /** When primary opens a modal instead of navigating */
  onPrimaryClick?: () => void
  onSecondaryClick?: () => void
}

export function ModuleEmptyState({
  module,
  title,
  description,
  extraActions,
  className,
  onPrimaryClick,
  onSecondaryClick,
}: ModuleEmptyStateProps) {
  const cfg = getModuleEmptyConfig(module)
  const { can } = usePermission(cfg.permissionModule)
  const showPrimary =
    !!cfg.primary &&
    (!cfg.permissionModule || can(cfg.primaryAction ?? 'create', cfg.permissionModule))

  return (
    <EmptyState
      className={className}
      icon={cfg.icon}
      title={title ?? cfg.title}
      description={description ?? cfg.description}
      actions={
        <>
          {showPrimary && cfg.primary ? (
            <ActionButton
              label={cfg.primary.label}
              to={onPrimaryClick ? undefined : cfg.primary.to}
              onClick={onPrimaryClick ?? cfg.primary.onClick}
              variant="primary"
            />
          ) : null}
          {cfg.secondary ? (
            <ActionButton
              label={cfg.secondary.label}
              to={onSecondaryClick ? undefined : cfg.secondary.to}
              onClick={onSecondaryClick ?? cfg.secondary.onClick}
              variant="outline"
            />
          ) : null}
          {extraActions}
        </>
      }
    />
  )
}

/** Compact action pair for DataTable emptyAction prop */
export function moduleEmptyActions(
  module: ModuleEmptyKey,
  opts?: { onPrimaryClick?: () => void; allowPrimary?: boolean },
): ReactNode {
  const cfg = getModuleEmptyConfig(module)
  const allowPrimary = opts?.allowPrimary !== false
  return (
    <>
      {allowPrimary && cfg.primary ? (
        <ActionButton
          label={cfg.primary.label}
          to={opts?.onPrimaryClick ? undefined : cfg.primary.to}
          onClick={opts?.onPrimaryClick ?? cfg.primary.onClick}
          variant="primary"
        />
      ) : null}
      {cfg.secondary ? (
        <ActionButton
          label={cfg.secondary.label}
          to={cfg.secondary.to}
          onClick={cfg.secondary.onClick}
          variant="outline"
        />
      ) : null}
    </>
  )
}
