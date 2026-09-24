/**
 * MockServices — async API façade over MockRepositories.
 * Prepared for future HTTP swap: keep signatures stable, replace repo calls.
 */
import {
  auditLogRepository,
  customerRepository,
  distributorRepository,
  expenseRepository,
  invoiceRepository,
  ledgerRepository,
  masterRepository,
  mockRepositories,
  notificationRepository,
  paymentRepository,
  productRepository,
  purchaseRepository,
  returnsRepository,
  salesRepository,
  settingsRepository,
  stockMovementRepository,
  supplierRepository,
  userRepository,
} from '@/mock/repositories'
import { useDmsStore } from '@/store/dms-store'
import type {
  Brand,
  Category,
  Customer,
  Distributor,
  Expense,
  GstRate,
  LineItem,
  Payment,
  Product,
  Role,
  StockAdjustment,
  StockTransfer,
  Supplier,
  Unit,
  User,
} from '@/types'

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms))

export const authService = {
  async login(username: string, password: string) {
    await delay()
    return useDmsStore.getState().login(username, password)
  },
  async logout() {
    await delay(50)
    useDmsStore.getState().logout()
  },
  getSession() {
    return useDmsStore.getState().session
  },
}

export const productService = {
  async getAll() {
    await delay()
    return productRepository.all()
  },
  async getById(id: string) {
    await delay()
    return productRepository.findById(id)
  },
  async save(data: Parameters<NonNullable<typeof productRepository.save>>[0]) {
    await delay()
    return productRepository.save!(data)
  },
  async remove(id: string) {
    await delay()
    productRepository.remove!(id)
  },
}

export const masterService = {
  async categories() {
    await delay()
    return masterRepository.categories()
  },
  async saveCategory(data: Parameters<typeof masterRepository.saveCategory>[0]) {
    await delay()
    return masterRepository.saveCategory(data)
  },
  async deleteCategory(id: string) {
    await delay()
    masterRepository.deleteCategory(id)
  },
  async brands() {
    await delay()
    return masterRepository.brands()
  },
  async saveBrand(data: Parameters<typeof masterRepository.saveBrand>[0]) {
    await delay()
    return masterRepository.saveBrand(data)
  },
  async deleteBrand(id: string) {
    await delay()
    masterRepository.deleteBrand(id)
  },
  async units() {
    await delay()
    return masterRepository.units()
  },
  async saveUnit(data: Parameters<typeof masterRepository.saveUnit>[0]) {
    await delay()
    return masterRepository.saveUnit(data)
  },
  async deleteUnit(id: string) {
    await delay()
    masterRepository.deleteUnit(id)
  },
  async gstRates() {
    await delay()
    return masterRepository.gstRates()
  },
  async saveGstRate(data: Parameters<typeof masterRepository.saveGstRate>[0]) {
    await delay()
    return masterRepository.saveGstRate(data)
  },
  async deleteGstRate(id: string) {
    await delay()
    masterRepository.deleteGstRate(id)
  },
}

export const partyService = {
  async customers() {
    await delay()
    return customerRepository.all()
  },
  async saveCustomer(data: Parameters<NonNullable<typeof customerRepository.save>>[0]) {
    await delay()
    return customerRepository.save!(data)
  },
  async deleteCustomer(id: string) {
    await delay()
    customerRepository.remove!(id)
  },
  async distributors() {
    await delay()
    return distributorRepository.all()
  },
  async saveDistributor(data: Parameters<NonNullable<typeof distributorRepository.save>>[0]) {
    await delay()
    return distributorRepository.save!(data)
  },
  async deleteDistributor(id: string) {
    await delay()
    distributorRepository.remove!(id)
  },
  async suppliers() {
    await delay()
    return supplierRepository.all()
  },
  async saveSupplier(data: Parameters<NonNullable<typeof supplierRepository.save>>[0]) {
    await delay()
    return supplierRepository.save!(data)
  },
  async deleteSupplier(id: string) {
    await delay()
    supplierRepository.remove!(id)
  },
}

export const purchaseService = {
  async getAll() {
    await delay()
    return purchaseRepository.all()
  },
  async getById(id: string) {
    await delay()
    return purchaseRepository.findById(id)
  },
  async save(input: Parameters<typeof purchaseRepository.save>[0]) {
    await delay(200)
    return purchaseRepository.save(input)
  },
  async cancel(id: string) {
    await delay()
    return purchaseRepository.cancel(id)
  },
}

export const salesService = {
  async getAll() {
    await delay()
    return salesRepository.all()
  },
  async getById(id: string) {
    await delay()
    return salesRepository.findById(id)
  },
  async save(input: Parameters<typeof salesRepository.save>[0]) {
    await delay(200)
    return salesRepository.save(input)
  },
  async cancel(id: string) {
    await delay()
    return salesRepository.cancel(id)
  },
}

export const invoiceService = {
  async getAll() {
    await delay()
    return invoiceRepository.all()
  },
  async getById(id: string) {
    await delay()
    return invoiceRepository.findById(id)
  },
}

export const paymentService = {
  async getAll() {
    await delay()
    return paymentRepository.all()
  },
  async record(input: Parameters<typeof paymentRepository.record>[0]) {
    await delay()
    return paymentRepository.record(input)
  },
}

export const inventoryService = {
  async movements() {
    await delay()
    return stockMovementRepository.all()
  },
  async adjustments() {
    await delay()
    return stockMovementRepository.adjustments()
  },
  async transfers() {
    await delay()
    return stockMovementRepository.transfers()
  },
  async adjust(input: Parameters<typeof stockMovementRepository.adjust>[0]) {
    await delay()
    return stockMovementRepository.adjust(input)
  },
  async saveTransfer(input: Parameters<typeof stockMovementRepository.saveTransfer>[0]) {
    await delay()
    return stockMovementRepository.saveTransfer(input)
  },
  async updateTransferStatus(id: string, status: StockTransfer['status']) {
    await delay()
    stockMovementRepository.updateTransferStatus(id, status)
  },
}

export const returnsService = {
  async salesReturns() {
    await delay()
    return returnsRepository.salesReturns()
  },
  async purchaseReturns() {
    await delay()
    return returnsRepository.purchaseReturns()
  },
  async createSalesReturn(input: Parameters<typeof returnsRepository.createSalesReturn>[0]) {
    await delay()
    return returnsRepository.createSalesReturn(input)
  },
  async createPurchaseReturn(input: Parameters<typeof returnsRepository.createPurchaseReturn>[0]) {
    await delay()
    return returnsRepository.createPurchaseReturn(input)
  },
}

export const expenseService = {
  async getAll() {
    await delay()
    return expenseRepository.all()
  },
  async save(input: Parameters<typeof expenseRepository.save>[0]) {
    await delay()
    return expenseRepository.save(input)
  },
  async remove(id: string) {
    await delay()
    expenseRepository.remove(id)
  },
}

export const ledgerService = {
  async getAll(partyType?: Parameters<typeof ledgerRepository.all>[0], partyId?: string) {
    await delay()
    return ledgerRepository.all(partyType, partyId)
  },
}

export const adminService = {
  async users() {
    await delay()
    return userRepository.publicAll()
  },
  async saveUser(data: Parameters<typeof userRepository.save>[0]) {
    await delay()
    return userRepository.save(data)
  },
  async deleteUser(id: string) {
    await delay()
    userRepository.remove(id)
  },
  async roles() {
    await delay()
    return masterRepository.roles()
  },
  async updatePermissions(roleId: string, permissions: Role['permissions']) {
    await delay()
    masterRepository.updatePermissions(roleId, permissions)
  },
  async notifications() {
    await delay()
    return notificationRepository.all()
  },
  async auditLogs() {
    await delay()
    return auditLogRepository.all()
  },
  async getSettings() {
    await delay()
    return settingsRepository.get()
  },
  async saveSettings(settings: Parameters<typeof settingsRepository.save>[0]) {
    await delay()
    settingsRepository.save(settings)
  },
}

export const searchService = {
  async global(query: string) {
    await delay(80)
    const q = query.trim().toLowerCase()
    if (!q) {
      return {
        products: [] as Product[],
        customers: [] as Customer[],
        distributors: [] as Distributor[],
        suppliers: [] as Supplier[],
        invoices: [] as Awaited<ReturnType<typeof invoiceRepository.all>>,
        sales: [] as Awaited<ReturnType<typeof salesRepository.all>>,
        purchases: [] as Awaited<ReturnType<typeof purchaseRepository.all>>,
        payments: [] as Payment[],
      }
    }
    return {
      products: productRepository
        .all()
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 5),
      customers: customerRepository
        .all()
        .filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q))
        .slice(0, 5),
      distributors: distributorRepository
        .all()
        .filter((d) => d.name.toLowerCase().includes(q) || d.companyName.toLowerCase().includes(q))
        .slice(0, 5),
      suppliers: supplierRepository
        .all()
        .filter((x) => x.name.toLowerCase().includes(q))
        .slice(0, 5),
      invoices: invoiceRepository
        .all()
        .filter((i) => i.invoiceNo.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q))
        .slice(0, 5),
      sales: salesRepository
        .all()
        .filter((x) => x.invoiceNo.toLowerCase().includes(q) || x.customerName.toLowerCase().includes(q))
        .slice(0, 5),
      purchases: purchaseRepository
        .all()
        .filter((p) => p.purchaseNo.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q))
        .slice(0, 5),
      payments: paymentRepository
        .all()
        .filter(
          (p) =>
            p.paymentNo.toLowerCase().includes(q) ||
            p.partyName.toLowerCase().includes(q) ||
            p.method.toLowerCase().includes(q),
        )
        .slice(0, 5),
    }
  },
}

/** Named bundle for app bootstrap / future API client swap */
export const mockServices = {
  auth: authService,
  products: productService,
  masters: masterService,
  parties: partyService,
  purchases: purchaseService,
  sales: salesService,
  invoices: invoiceService,
  payments: paymentService,
  inventory: inventoryService,
  returns: returnsService,
  expenses: expenseService,
  ledger: ledgerService,
  admin: adminService,
  search: searchService,
  repositories: mockRepositories,
} as const

export type MockServices = typeof mockServices

export type {
  Product,
  Category,
  Brand,
  Unit,
  GstRate,
  Customer,
  Distributor,
  Supplier,
  Expense,
  User,
  Payment,
  StockAdjustment,
  LineItem,
}
