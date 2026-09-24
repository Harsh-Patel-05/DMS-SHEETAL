/**
 * MockRepositories — synchronous data access over the single Zustand store.
 * All modules share this live state; no local duplicate arrays.
 */
import { useDmsStore } from '@/store/dms-store'
import type { PartyType, Role, StockTransfer } from '@/types'

function db() {
  return useDmsStore.getState()
}

function createCollectionRepo<T extends { id: string }>(
  select: () => T[],
  save?: (row: T) => T,
  remove?: (id: string) => void,
) {
  return {
    all: () => select(),
    findById: (id: string) => select().find((r) => r.id === id) ?? null,
    filter: (predicate: (row: T) => boolean) => select().filter(predicate),
    save: save
      ? (row: T) => save(row)
      : undefined,
    remove: remove
      ? (id: string) => remove(id)
      : undefined,
  }
}

export const productRepository = {
  ...createCollectionRepo(
    () => db().products,
    (row) => db().upsertProduct(row),
    (id) => db().deleteProduct(id),
  ),
}

export const customerRepository = {
  ...createCollectionRepo(
    () => db().customers,
    (row) => db().upsertCustomer(row),
    (id) => db().deleteCustomer(id),
  ),
}

export const distributorRepository = {
  ...createCollectionRepo(
    () => db().distributors,
    (row) => db().upsertDistributor(row),
    (id) => db().deleteDistributor(id),
  ),
}

export const supplierRepository = {
  ...createCollectionRepo(
    () => db().suppliers,
    (row) => db().upsertSupplier(row),
    (id) => db().deleteSupplier(id),
  ),
}

export const salesRepository = {
  all: () => db().sales,
  findById: (id: string) => db().sales.find((s) => s.id === id) ?? null,
  save: (input: Parameters<ReturnType<typeof db>['saveSale']>[0]) => db().saveSale(input),
  cancel: (id: string) => db().cancelSale(id),
}

export const purchaseRepository = {
  all: () => db().purchases,
  findById: (id: string) => db().purchases.find((p) => p.id === id) ?? null,
  save: (input: Parameters<ReturnType<typeof db>['savePurchase']>[0]) => db().savePurchase(input),
  cancel: (id: string) => db().cancelPurchase(id),
}

export const invoiceRepository = {
  all: () => db().invoices,
  findById: (id: string) => db().invoices.find((i) => i.id === id) ?? null,
}

export const paymentRepository = {
  all: () => db().payments,
  findById: (id: string) => db().payments.find((p) => p.id === id) ?? null,
  record: (input: Parameters<ReturnType<typeof db>['recordPayment']>[0]) => db().recordPayment(input),
}

export const expenseRepository = {
  all: () => db().expenses,
  findById: (id: string) => db().expenses.find((e) => e.id === id) ?? null,
  save: (input: Parameters<ReturnType<typeof db>['saveExpense']>[0]) => db().saveExpense(input),
  remove: (id: string) => db().deleteExpense(id),
}

export const returnsRepository = {
  salesReturns: () => db().salesReturns,
  purchaseReturns: () => db().purchaseReturns,
  createSalesReturn: (input: Parameters<ReturnType<typeof db>['createSalesReturn']>[0]) =>
    db().createSalesReturn(input),
  createPurchaseReturn: (input: Parameters<ReturnType<typeof db>['createPurchaseReturn']>[0]) =>
    db().createPurchaseReturn(input),
}

export const stockMovementRepository = {
  all: () => db().movements,
  adjustments: () => db().adjustments,
  transfers: () => db().transfers,
  adjust: (input: Parameters<ReturnType<typeof db>['adjustStock']>[0]) => db().adjustStock(input),
  saveTransfer: (input: Parameters<ReturnType<typeof db>['saveTransfer']>[0]) => db().saveTransfer(input),
  updateTransferStatus: (id: string, status: StockTransfer['status']) =>
    db().updateTransferStatus(id, status),
}

export const ledgerRepository = {
  all: (partyType?: PartyType, partyId?: string) => {
    let rows = db().ledger
    if (partyType) rows = rows.filter((l) => l.partyType === partyType)
    if (partyId) rows = rows.filter((l) => l.partyId === partyId)
    return rows
  },
}

export const notificationRepository = {
  all: () => db().notifications,
  markRead: (id: string) => db().markNotificationRead(id),
  markAllRead: () => db().markAllNotificationsRead(),
  clear: () => db().clearNotifications(),
}

export const auditLogRepository = {
  all: () => db().auditLogs,
}

export const userRepository = {
  all: () => db().users,
  publicAll: () => db().users.map(({ password: _p, ...u }) => u),
  findById: (id: string) => db().users.find((u) => u.id === id) ?? null,
  save: (data: Parameters<ReturnType<typeof db>['upsertUser']>[0]) => db().upsertUser(data),
  remove: (id: string) => db().deleteUser(id),
}

export const settingsRepository = {
  get: () => db().settings,
  save: (partial: Parameters<ReturnType<typeof db>['updateSettings']>[0]) => db().updateSettings(partial),
}

export const masterRepository = {
  categories: () => db().categories,
  saveCategory: (data: Parameters<ReturnType<typeof db>['upsertCategory']>[0]) => db().upsertCategory(data),
  deleteCategory: (id: string) => db().deleteCategory(id),
  brands: () => db().brands,
  saveBrand: (data: Parameters<ReturnType<typeof db>['upsertBrand']>[0]) => db().upsertBrand(data),
  deleteBrand: (id: string) => db().deleteBrand(id),
  units: () => db().units,
  saveUnit: (data: Parameters<ReturnType<typeof db>['upsertUnit']>[0]) => db().upsertUnit(data),
  deleteUnit: (id: string) => db().deleteUnit(id),
  gstRates: () => db().gstRates,
  saveGstRate: (data: Parameters<ReturnType<typeof db>['upsertGstRate']>[0]) => db().upsertGstRate(data),
  deleteGstRate: (id: string) => db().deleteGstRate(id),
  roles: () => db().roles,
  updatePermissions: (roleId: string, permissions: Role['permissions']) =>
    db().updateRolePermissions(roleId, permissions),
}

/** Facade used by MockServices / future API adapters */
export const mockRepositories = {
  products: productRepository,
  customers: customerRepository,
  distributors: distributorRepository,
  suppliers: supplierRepository,
  sales: salesRepository,
  purchases: purchaseRepository,
  invoices: invoiceRepository,
  payments: paymentRepository,
  expenses: expenseRepository,
  returns: returnsRepository,
  stockMovements: stockMovementRepository,
  ledgerEntries: ledgerRepository,
  notifications: notificationRepository,
  auditLogs: auditLogRepository,
  users: userRepository,
  settings: settingsRepository,
  masters: masterRepository,
} as const

export type MockRepositories = typeof mockRepositories
