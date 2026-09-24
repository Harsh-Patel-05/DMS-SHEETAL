import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  Package,
  Receipt,
  RotateCcw,
  Settings,
  Shield,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  Warehouse,
  Wallet,
} from 'lucide-react'
import type { PermissionModule } from '@/types'

export interface NavItem {
  label: string
  to: string
  /** When set, menu item is hidden unless the role can view this module */
  module?: PermissionModule
}

export interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [{ label: 'Overview', to: '/dashboard', module: 'dashboard' }],
  },
  {
    id: 'master',
    label: 'Master Data',
    icon: Package,
    items: [
      { label: 'Products', to: '/master/products', module: 'products' },
      { label: 'Categories', to: '/master/categories', module: 'products' },
      { label: 'Brands', to: '/master/brands', module: 'products' },
      { label: 'Units', to: '/master/units', module: 'products' },
      { label: 'GST Rates', to: '/master/gst-rates', module: 'products' },
    ],
  },
  {
    id: 'parties',
    label: 'Parties',
    icon: Users,
    items: [
      { label: 'Customers', to: '/parties/customers', module: 'customers' },
      { label: 'Distributors', to: '/parties/distributors', module: 'distributors' },
      { label: 'Suppliers', to: '/parties/suppliers', module: 'suppliers' },
    ],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    icon: Receipt,
    items: [
      { label: 'Purchases', to: '/transactions/purchases', module: 'purchase' },
      { label: 'Sales', to: '/transactions/sales', module: 'sales' },
      { label: 'Invoices', to: '/transactions/invoices', module: 'invoices' },
      { label: 'Payments', to: '/transactions/payments', module: 'payments' },
      { label: 'Sales Returns', to: '/transactions/sales-returns', module: 'returns' },
      { label: 'Purchase Returns', to: '/transactions/purchase-returns', module: 'returns' },
      { label: 'Expenses', to: '/transactions/expenses', module: 'expenses' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    items: [
      { label: 'Overview', to: '/inventory/overview', module: 'stock' },
      { label: 'Current Stock', to: '/inventory/stock', module: 'stock' },
      { label: 'Movement', to: '/inventory/movement', module: 'stock' },
      { label: 'Adjustment', to: '/inventory/adjustment', module: 'stock' },
      { label: 'Transfer', to: '/inventory/transfer', module: 'stock' },
      { label: 'Low Stock', to: '/inventory/low-stock', module: 'stock' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    items: [
      { label: 'Report Builder', to: '/reports/builder', module: 'reports' },
      { label: 'Sales Report', to: '/reports/sales', module: 'reports' },
      { label: 'Purchase Report', to: '/reports/purchases', module: 'reports' },
      { label: 'Stock Report', to: '/reports/stock', module: 'reports' },
      { label: 'Stock Valuation', to: '/reports/stock-valuation', module: 'reports' },
      { label: 'Financial Summary', to: '/finance/summary', module: 'reports' },
      { label: 'Outstanding', to: '/finance/outstanding', module: 'reports' },
      { label: 'Profit & Loss', to: '/reports/profit-loss', module: 'reports' },
      { label: 'Outstanding Receivables', to: '/reports/receivables', module: 'reports' },
      { label: 'Outstanding Payables', to: '/reports/payables', module: 'reports' },
      { label: 'GST Summary', to: '/reports/gst', module: 'reports' },
      { label: 'Customer Ledger', to: '/reports/customer-ledger', module: 'reports' },
      { label: 'Distributor Ledger', to: '/reports/distributor-ledger', module: 'reports' },
      { label: 'Supplier Ledger', to: '/reports/supplier-ledger', module: 'reports' },
      { label: 'Payment Report', to: '/reports/payments', module: 'reports' },
      { label: 'Expense Report', to: '/reports/expenses', module: 'reports' },
      { label: 'Sales Returns', to: '/reports/sales-returns', module: 'reports' },
      { label: 'Purchase Returns', to: '/reports/purchase-returns', module: 'reports' },
      { label: 'Daily Summary', to: '/reports/daily-summary', module: 'reports' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Shield,
    items: [
      { label: 'Control Center', to: '/admin', module: 'users' },
      { label: 'Demo Mode', to: '/admin/demo', module: 'settings' },
      { label: 'Users', to: '/admin/users', module: 'users' },
      { label: 'Roles', to: '/admin/roles', module: 'users' },
      { label: 'Permissions', to: '/admin/permissions', module: 'users' },
      { label: 'Approvals', to: '/admin/approvals', module: 'approvals' },
      { label: 'Notification Center', to: '/admin/notifications', module: 'settings' },
      { label: 'Recent Activity', to: '/admin/activity', module: 'audit_logs' },
      { label: 'Import Center', to: '/admin/import', module: 'settings' },
      { label: 'Export Center', to: '/admin/export', module: 'settings' },
      { label: 'Personalization', to: '/admin/personalization', module: 'settings' },
      { label: 'Audit Logs', to: '/admin/audit-logs', module: 'audit_logs' },
      { label: 'Settings', to: '/admin/settings', module: 'settings' },
    ],
  },
]

export const navIcons = {
  dashboard: Gauge,
  master: Tags,
  parties: Building2,
  transactions: ShoppingCart,
  inventory: Boxes,
  reports: Activity,
  admin: Settings,
  payments: Wallet,
  returns: RotateCcw,
  transfer: ArrowLeftRight,
  invoices: FileText,
  notifications: Bell,
  clipboard: ClipboardList,
  truck: Truck,
} as const
