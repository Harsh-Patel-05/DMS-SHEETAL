import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PermissionGate } from '@/components/auth/PermissionGate'
import { LandingRedirect } from '@/components/auth/LandingRedirect'
import { PageSkeleton } from '@/components/ui/skeletons'
import { RouteErrorPage } from '@/pages/system/RouteErrorPage'

const lazyPage = (
  loader: () => Promise<{ default: ComponentType }>,
  skeleton: 'table' | 'dashboard' | 'detail' | 'form' = 'table',
) => {
  const Page = lazy(loader)
  return (
    <Suspense fallback={<PageSkeleton variant={skeleton} />}>
      <Page />
    </Suspense>
  )
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
  {
    path: '/login',
    element: lazyPage(() => import('@/pages/auth/LoginPage'), 'form'),
    errorElement: <RouteErrorPage />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <LandingRedirect /> },
          { path: 'forbidden', element: lazyPage(() => import('@/pages/system/PermissionDeniedPage'), 'detail') },
          {
            element: <PermissionGate />,
            children: [
          { path: 'dashboard', element: lazyPage(() => import('@/pages/dashboard/DashboardPage'), 'dashboard') },
          { path: 'master/products', element: lazyPage(() => import('@/pages/master/ProductsPage')) },
          { path: 'master/products/:id', element: lazyPage(() => import('@/pages/master/ProductDetailPage'), 'detail') },
          { path: 'master/categories', element: lazyPage(() => import('@/pages/master/CategoriesPage')) },
          { path: 'master/brands', element: lazyPage(() => import('@/pages/master/BrandsPage')) },
          { path: 'master/units', element: lazyPage(() => import('@/pages/master/UnitsPage')) },
          { path: 'master/gst-rates', element: lazyPage(() => import('@/pages/master/GstRatesPage')) },
          { path: 'parties/customers', element: lazyPage(() => import('@/pages/parties/CustomersPage')) },
          { path: 'parties/customers/:id', element: lazyPage(() => import('@/pages/parties/CustomerDetailPage'), 'detail') },
          { path: 'parties/distributors', element: lazyPage(() => import('@/pages/parties/DistributorsPage')) },
          { path: 'parties/distributors/:id', element: lazyPage(() => import('@/pages/parties/DistributorDetailPage'), 'detail') },
          { path: 'parties/suppliers', element: lazyPage(() => import('@/pages/parties/SuppliersPage')) },
          { path: 'parties/suppliers/:id', element: lazyPage(() => import('@/pages/parties/SupplierDetailPage'), 'detail') },
          { path: 'transactions/purchases', element: lazyPage(() => import('@/pages/transactions/PurchasesPage')) },
          { path: 'transactions/purchases/new', element: lazyPage(() => import('@/pages/transactions/PurchaseFormPage'), 'form') },
          { path: 'transactions/purchases/:id/edit', element: lazyPage(() => import('@/pages/transactions/PurchaseFormPage'), 'form') },
          { path: 'transactions/sales', element: lazyPage(() => import('@/pages/transactions/SalesPage')) },
          { path: 'transactions/sales/new', element: lazyPage(() => import('@/pages/transactions/SaleFormPage'), 'form') },
          { path: 'transactions/sales/:id/edit', element: lazyPage(() => import('@/pages/transactions/SaleFormPage'), 'form') },
          { path: 'transactions/invoices', element: lazyPage(() => import('@/pages/transactions/InvoicesPage')) },
          { path: 'transactions/invoices/:id', element: lazyPage(() => import('@/pages/transactions/InvoiceDetailPage'), 'detail') },
          { path: 'transactions/payments', element: lazyPage(() => import('@/pages/transactions/PaymentsPage')) },
          { path: 'transactions/payments/new', element: lazyPage(() => import('@/pages/transactions/PaymentFormPage'), 'form') },
          { path: 'transactions/sales-returns', element: lazyPage(() => import('@/pages/transactions/SalesReturnsPage')) },
          { path: 'transactions/purchase-returns', element: lazyPage(() => import('@/pages/transactions/PurchaseReturnsPage')) },
          { path: 'transactions/expenses', element: lazyPage(() => import('@/pages/transactions/ExpensesPage')) },
          { path: 'inventory/overview', element: lazyPage(() => import('@/pages/inventory/StockPage')) },
          { path: 'inventory/stock', element: lazyPage(() => import('@/pages/inventory/StockPage')) },
          { path: 'finance/summary', element: lazyPage(() => import('@/pages/finance/FinancialSummaryPage'), 'dashboard') },
          { path: 'finance/outstanding', element: lazyPage(() => import('@/pages/finance/OutstandingPage'), 'dashboard') },
          { path: 'inventory/movement', element: lazyPage(() => import('@/pages/inventory/MovementPage')) },
          { path: 'inventory/adjustment', element: lazyPage(() => import('@/pages/inventory/AdjustmentPage')) },
          { path: 'inventory/transfer', element: lazyPage(() => import('@/pages/inventory/TransferPage')) },
          { path: 'inventory/low-stock', element: lazyPage(() => import('@/pages/inventory/LowStockPage')) },
          { path: 'reports/builder', element: lazyPage(() => import('@/pages/reports/ReportBuilderPage')) },
          { path: 'reports/sales', element: lazyPage(() => import('@/pages/reports/SalesReportPage')) },
          { path: 'reports/purchases', element: lazyPage(() => import('@/pages/reports/PurchasesReportPage')) },
          { path: 'reports/stock', element: lazyPage(() => import('@/pages/reports/StockReportPage')) },
          { path: 'reports/stock-valuation', element: lazyPage(() => import('@/pages/reports/StockValuationReportPage')) },
          { path: 'reports/profit-loss', element: lazyPage(() => import('@/pages/reports/ProfitLossReportPage')) },
          { path: 'reports/receivables', element: lazyPage(() => import('@/pages/reports/ReceivablesReportPage')) },
          { path: 'reports/payables', element: lazyPage(() => import('@/pages/reports/PayablesReportPage')) },
          { path: 'reports/gst', element: lazyPage(() => import('@/pages/reports/GstReportPage')) },
          { path: 'reports/customer-ledger', element: lazyPage(() => import('@/pages/reports/CustomerLedgerReportPage')) },
          { path: 'reports/distributor-ledger', element: lazyPage(() => import('@/pages/reports/DistributorLedgerReportPage')) },
          { path: 'reports/supplier-ledger', element: lazyPage(() => import('@/pages/reports/SupplierLedgerReportPage')) },
          { path: 'reports/payments', element: lazyPage(() => import('@/pages/reports/PaymentsReportPage')) },
          { path: 'reports/expenses', element: lazyPage(() => import('@/pages/reports/ExpensesReportPage')) },
          { path: 'reports/sales-returns', element: lazyPage(() => import('@/pages/reports/SalesReturnsReportPage')) },
          { path: 'reports/purchase-returns', element: lazyPage(() => import('@/pages/reports/PurchaseReturnsReportPage')) },
          { path: 'reports/daily-summary', element: lazyPage(() => import('@/pages/reports/DailySummaryReportPage')) },
          { path: 'admin', element: lazyPage(() => import('@/pages/admin/AdminControlCenterPage')) },
          { path: 'admin/demo', element: lazyPage(() => import('@/pages/admin/DemoModePage')) },
          { path: 'admin/users', element: lazyPage(() => import('@/pages/admin/UsersPage')) },
          { path: 'admin/users/:id', element: lazyPage(() => import('@/pages/admin/UserDetailPage')) },
          { path: 'admin/roles', element: lazyPage(() => import('@/pages/admin/RolesPage')) },
          { path: 'admin/permissions', element: lazyPage(() => import('@/pages/admin/PermissionsPage')) },
          { path: 'admin/approvals', element: lazyPage(() => import('@/pages/admin/ApprovalsPage')) },
          { path: 'admin/notifications', element: lazyPage(() => import('@/pages/admin/NotificationsPage')) },
          { path: 'admin/activity', element: lazyPage(() => import('@/pages/admin/ActivityCenterPage')) },
          { path: 'admin/import', element: lazyPage(() => import('@/pages/admin/ImportCenterPage')) },
          { path: 'admin/export', element: lazyPage(() => import('@/pages/admin/ExportCenterPage')) },
          { path: 'admin/personalization', element: lazyPage(() => import('@/pages/admin/PersonalizationPage')) },
          { path: 'admin/audit-logs', element: lazyPage(() => import('@/pages/admin/AuditLogsPage')) },
          { path: 'admin/settings', element: lazyPage(() => import('@/pages/admin/SettingsPage')) },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <LandingRedirect /> },
  ],
  { basename: routerBasename },
)
