/**
 * MockDatabase — single seed snapshot for the frontend-only ERP.
 * Runtime mutations live in Zustand (`useDmsStore`); this module only
 * provides the initial dataset so modules never invent parallel arrays.
 */
import type {
  AppNotification,
  AuditLog,
  Brand,
  BusinessSettings,
  Category,
  Customer,
  Distributor,
  Expense,
  ExportJob,
  GstRate,
  Invoice,
  LedgerEntry,
  Location,
  Payment,
  Product,
  Purchase,
  PurchaseReturn,
  Role,
  Sale,
  SalesReturn,
  StockAdjustment,
  StockMovement,
  StockTransfer,
  Supplier,
  Unit,
  User,
} from '@/types'
import type { ApprovalRequest } from '@/types/approval'
import {
  seedAdjustments,
  seedApprovals,
  seedAuditLogs,
  seedBrands,
  seedCategories,
  seedCustomers,
  seedDistributors,
  seedExpenses,
  seedExports,
  seedGstRates,
  seedInvoices,
  seedLedger,
  seedLocations,
  seedMovements,
  seedNotifications,
  seedPayments,
  seedProducts,
  seedPurchaseReturns,
  seedPurchases,
  seedRoles,
  seedSales,
  seedSalesReturns,
  seedSettings,
  seedSuppliers,
  seedTransfers,
  seedUnits,
  seedUsers,
} from '@/mock/data'

export interface MockDatabaseCounters {
  sale: number
  purchase: number
  payment: number
  return: number
  transfer: number
  adjustment: number
  approval: number
}

/** Canonical entity collections — one source of seed truth. */
export interface MockDatabase {
  products: Product[]
  customers: Customer[]
  distributors: Distributor[]
  suppliers: Supplier[]
  sales: Sale[]
  purchases: Purchase[]
  invoices: Invoice[]
  payments: Payment[]
  expenses: Expense[]
  /** Sales + purchase returns */
  salesReturns: SalesReturn[]
  purchaseReturns: PurchaseReturn[]
  stockMovements: StockMovement[]
  ledgerEntries: LedgerEntry[]
  notifications: AppNotification[]
  auditLogs: AuditLog[]
  users: User[]
  settings: BusinessSettings
  /** Supporting masters (still centralized here) */
  categories: Category[]
  brands: Brand[]
  units: Unit[]
  gstRates: GstRate[]
  roles: Role[]
  locations: Location[]
  adjustments: StockAdjustment[]
  transfers: StockTransfer[]
  approvals: ApprovalRequest[]
  exportJobs: ExportJob[]
  counters: MockDatabaseCounters
}

export const MOCK_INITIAL_COUNTERS: MockDatabaseCounters = {
  sale: 1042,
  purchase: 2089,
  payment: 313,
  return: 100,
  transfer: 103,
  adjustment: 15,
  approval: 1007,
}

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

/** Build a fresh deep-cloned database from seed tables (never mutate seeds). */
export function createMockDatabase(): MockDatabase {
  return {
    products: clone(seedProducts),
    customers: clone(seedCustomers),
    distributors: clone(seedDistributors),
    suppliers: clone(seedSuppliers),
    sales: clone(seedSales),
    purchases: clone(seedPurchases),
    invoices: clone(seedInvoices),
    payments: clone(seedPayments),
    expenses: clone(seedExpenses),
    salesReturns: clone(seedSalesReturns),
    purchaseReturns: clone(seedPurchaseReturns),
    stockMovements: clone(seedMovements),
    ledgerEntries: clone(seedLedger),
    notifications: clone(seedNotifications),
    auditLogs: clone(seedAuditLogs),
    users: clone(seedUsers),
    settings: clone(seedSettings),
    categories: clone(seedCategories),
    brands: clone(seedBrands),
    units: clone(seedUnits),
    gstRates: clone(seedGstRates),
    roles: clone(seedRoles),
    locations: clone(seedLocations),
    adjustments: clone(seedAdjustments),
    transfers: clone(seedTransfers),
    approvals: clone(seedApprovals),
    exportJobs: clone(seedExports),
    counters: { ...MOCK_INITIAL_COUNTERS },
  }
}

let snapshot: MockDatabase | null = null

/** Cached seed snapshot used to hydrate the app store once. */
export function getMockDatabase(): MockDatabase {
  if (!snapshot) snapshot = createMockDatabase()
  return snapshot
}

/** Drop cache and rebuild (e.g. “reset demo data”). */
export function resetMockDatabase(): MockDatabase {
  snapshot = createMockDatabase()
  return snapshot
}

/** Replace the cached snapshot (sample business / clear demo). */
export function replaceMockDatabase(db: MockDatabase): MockDatabase {
  snapshot = clone(db)
  return snapshot
}

/**
 * Maps MockDatabase fields onto Zustand initial state shape
 * (store uses `movements` / `ledger` naming historically).
 */
export function mockDatabaseToStoreSlice(db: MockDatabase = getMockDatabase()) {
  return {
    categories: db.categories,
    brands: db.brands,
    units: db.units,
    gstRates: db.gstRates,
    products: db.products,
    customers: db.customers,
    distributors: db.distributors,
    suppliers: db.suppliers,
    purchases: db.purchases,
    sales: db.sales,
    invoices: db.invoices,
    payments: db.payments,
    expenses: db.expenses,
    movements: db.stockMovements,
    adjustments: db.adjustments,
    transfers: db.transfers,
    salesReturns: db.salesReturns,
    purchaseReturns: db.purchaseReturns,
    ledger: db.ledgerEntries,
    users: db.users,
    roles: db.roles,
    notifications: db.notifications,
    auditLogs: db.auditLogs,
    approvals: db.approvals,
    exportJobs: db.exportJobs,
    settings: db.settings,
    locations: db.locations,
    counters: { ...db.counters },
  }
}
