import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification,
  ApprovalKind,
  ApprovalPayload,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalTimelineEvent,
  AuditLog,
  Brand,
  BusinessSettings,
  Category,
  Customer,
  Distributor,
  Expense,
  ExportJob,
  ExportModuleId,
  GstRate,
  Invoice,
  LedgerEntry,
  LineItem,
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
  DocStatus,
  PartyType,
} from '@/types'
import { APPROVAL_KIND_LABELS } from '@/types/approval'
import { mockDatabaseToStoreSlice, getMockDatabase, resetMockDatabase, replaceMockDatabase } from '@/mock/database'
import {
  createClearedDemoDatabase,
  createSampleBusinessDatabase,
} from '@/mock/sample-business'
import {
  applyReturnToPurchaseBalances,
  applyReturnToSaleBalances,
  applyStock,
  buildInvoiceFromSale,
  cancelPurchaseSideEffects,
  cancelSaleSideEffects,
  makeLedger,
  makeMovement,
  partyBalanceUpdate,
  returnedQtyForPurchaseProduct,
  returnedQtyForSaleProduct,
  syncInvoiceFromSale,
} from '@/mock/relationships'
import { calculateInvoiceTotal, roundMoney } from '@/utils/calculations'
import { generateId, nowISO, todayISO } from '@/utils/cn'
import { buildCreditSnapshot } from '@/utils/credit-control'
import { DEFAULT_DISCOUNT_LIMITS, evaluateDiscountControl } from '@/utils/discount-control'
import { normalizeNotification } from '@/utils/notifications'
import {
  normalizeGstin,
  normalizeMobile,
  validatePaymentInput,
  validatePurchaseInput,
  validateQuantity,
  validateSaleInput,
} from '@/utils/validation'

export interface AuthSession {
  user: Omit<User, 'password'>
  token: string
  /** ISO timestamp of last user activity (session timeout) */
  lastActivityAt: string
}

interface DmsState {
  hydrated: boolean
  session: AuthSession | null
  categories: Category[]
  brands: Brand[]
  units: Unit[]
  gstRates: GstRate[]
  products: Product[]
  customers: Customer[]
  distributors: Distributor[]
  suppliers: Supplier[]
  purchases: Purchase[]
  sales: Sale[]
  invoices: Invoice[]
  payments: Payment[]
  expenses: Expense[]
  movements: StockMovement[]
  adjustments: StockAdjustment[]
  transfers: StockTransfer[]
  salesReturns: SalesReturn[]
  purchaseReturns: PurchaseReturn[]
  ledger: LedgerEntry[]
  users: User[]
  roles: Role[]
  notifications: AppNotification[]
  auditLogs: AuditLog[]
  approvals: ApprovalRequest[]
  exportJobs: ExportJob[]
  settings: BusinessSettings
  locations: Location[]
  counters: {
    sale: number
    purchase: number
    payment: number
    return: number
    transfer: number
    adjustment: number
    approval: number
  }

  login: (username: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
  touchSessionActivity: () => void

  addAudit: (module: string, action: string, description: string, reference?: string) => void
  pushNotification: (
    n: Omit<AppNotification, 'id' | 'read' | 'createdAt' | 'category' | 'severity' | 'priority'> & {
      category?: AppNotification['category']
      severity?: AppNotification['severity']
      priority?: AppNotification['priority']
      related?: AppNotification['related']
    },
  ) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
  removeNotification: (id: string) => void

  queueExportJob: (moduleId: ExportModuleId, moduleLabel: string, fileName: string) => ExportJob
  completeExportJob: (
    id: string,
    data: { fileName: string; csvContent: string; rowCount: number },
  ) => void
  failExportJob: (id: string, errorMessage: string) => void
  removeExportJob: (id: string) => void
  clearExportJobs: () => void

  upsertCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Category
  deleteCategory: (id: string) => void
  upsertBrand: (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Brand
  deleteBrand: (id: string) => void
  upsertUnit: (data: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Unit
  deleteUnit: (id: string) => void
  upsertGstRate: (data: Omit<GstRate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => GstRate
  deleteGstRate: (id: string) => void

  upsertProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'> & { id?: string; currentStock?: number }) => Product
  deleteProduct: (id: string) => void

  upsertCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'currentBalance'> & { id?: string; currentBalance?: number }) => Customer
  deleteCustomer: (id: string) => void
  upsertDistributor: (data: Omit<Distributor, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'currentBalance'> & { id?: string; currentBalance?: number }) => Distributor
  deleteDistributor: (id: string) => void
  upsertSupplier: (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'type' | 'currentBalance'> & { id?: string; currentBalance?: number }) => Supplier
  deleteSupplier: (id: string) => void

  savePurchase: (input: {
    id?: string
    supplierId: string
    date: string
    invoiceNo: string
    items: Omit<LineItem, 'id' | 'amount'>[]
    otherCharges?: number
    roundOff?: number
    paid?: number
    notes?: string
    confirm: boolean
  }) => { ok: boolean; purchase?: Purchase; message?: string }

  saveSale: (input: {
    id?: string
    customerId: string
    date: string
    items: Omit<LineItem, 'id' | 'amount'>[]
    otherCharges?: number
    paid?: number
    notes?: string
    confirm: boolean
  }) => { ok: boolean; sale?: Sale; message?: string }

  cancelSale: (id: string) => { ok: boolean; message?: string }
  cancelPurchase: (id: string) => { ok: boolean; message?: string }

  recordPayment: (input: {
    type: Payment['type']
    partyType: PartyType
    partyId: string
    date: string
    amount: number
    method: Payment['method']
    reference?: string
    notes?: string
    allocations?: { saleId: string; amount: number }[]
  }) => { ok: boolean; payment?: Payment; message?: string }

  allocateCustomerPayment: (
    customerId: string,
    paymentAmount: number,
    allocations: { saleId: string; amount: number }[],
  ) => { ok: boolean; message?: string; allocated?: number; unallocated?: number }

  saveExpense: (input: Omit<Expense, 'id' | 'createdAt'> & { id?: string }) => Expense
  deleteExpense: (id: string) => void

  adjustStock: (input: {
    productId: string
    adjustmentType: StockAdjustment['adjustmentType']
    quantity: number
    reason: string
    notes?: string
    date?: string
  }) => { ok: boolean; message?: string }

  saveTransfer: (input: Omit<StockTransfer, 'id' | 'transferNo' | 'createdAt' | 'updatedAt' | 'productName'> & { id?: string }) => StockTransfer
  updateTransferStatus: (id: string, status: StockTransfer['status']) => void

  createSalesReturn: (input: {
    saleId: string
    productId: string
    returnQuantity: number
    reason: string
    date?: string
  }) => { ok: boolean; message?: string }

  createPurchaseReturn: (input: {
    purchaseId: string
    productId: string
    returnQuantity: number
    reason: string
    date?: string
  }) => { ok: boolean; message?: string }

  upsertUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => User
  deleteUser: (id: string) => void
  setUserStatus: (id: string, status: User['status']) => { ok: boolean; message?: string }
  assignUserRole: (id: string, roleId: string) => { ok: boolean; message?: string }
  updateRolePermissions: (roleId: string, permissions: Role['permissions']) => void
  updateSettings: (settings: Partial<BusinessSettings>) => void

  createApproval: (input: {
    kind: ApprovalKind
    title: string
    description: string
    amount?: number
    referenceType?: string
    referenceId?: string
    referenceLabel?: string
    href?: string
    payload?: ApprovalPayload
    submit?: boolean
  }) => { ok: boolean; approval?: ApprovalRequest; message?: string }
  submitApproval: (id: string, note?: string) => { ok: boolean; message?: string }
  approveApproval: (id: string, note?: string) => { ok: boolean; message?: string }
  rejectApproval: (id: string, note?: string) => { ok: boolean; message?: string }
  completeApproval: (id: string, note?: string) => { ok: boolean; message?: string }
  addApprovalComment: (id: string, note: string) => { ok: boolean; message?: string }

  resetDemoData: () => void
  loadSampleBusinessData: () => void
  clearDemoData: () => void
}

function stripPassword(user: User): Omit<User, 'password'> {
  const { password: _p, ...rest } = user
  return rest
}

function nextDocNo(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

const initialCounters = mockDatabaseToStoreSlice().counters

function buildInitialState() {
  const slice = mockDatabaseToStoreSlice()
  return {
    hydrated: true,
    session: null as AuthSession | null,
    ...slice,
  }
}

function sliceFromDatabase(db: ReturnType<typeof getMockDatabase>) {
  return mockDatabaseToStoreSlice(db)
}

function rebindSession(
  session: AuthSession | null,
  users: User[],
): AuthSession | null {
  if (!session) return null
  const stillThere = users.find((u) => u.id === session.user.id && u.status === 'active')
  if (!stillThere) return null
  return {
    ...session,
    user: stripPassword(stillThere),
    lastActivityAt: session.lastActivityAt ?? nowISO(),
  }
}

function actorFromSession(session: AuthSession | null) {
  return {
    userId: session?.user.id ?? 'system',
    userName: session?.user.name ?? 'System',
  }
}

function pushApprovalEvent(
  approval: ApprovalRequest,
  action: ApprovalTimelineEvent['action'],
  status: ApprovalStatus,
  actor: { userId: string; userName: string },
  note?: string,
): ApprovalRequest {
  const event: ApprovalTimelineEvent = {
    id: generateId('ape'),
    at: nowISO(),
    action,
    status,
    userId: actor.userId,
    userName: actor.userName,
    note,
  }
  return {
    ...approval,
    status,
    timeline: [...approval.timeline, event],
    updatedAt: nowISO(),
  }
}

export const useDmsStore = create<DmsState>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      login: (username, password) => {
        const user = get().users.find(
          (u) =>
            (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
            u.password === password &&
            u.status === 'active',
        )
        if (!user) return { ok: false, message: 'Invalid credentials or inactive account' }
        const ts = nowISO()
        const session: AuthSession = {
          user: stripPassword({ ...user, lastLogin: ts }),
          token: generateId('tok'),
          lastActivityAt: ts,
        }
        set({
          session,
          users: get().users.map((u) => (u.id === user.id ? { ...u, lastLogin: ts } : u)),
        })
        get().addAudit('Auth', 'Login', `${user.name} logged in`)
        return { ok: true }
      },

      logout: () => {
        const session = get().session
        if (session) get().addAudit('Auth', 'Logout', `${session.user.name} logged out`)
        set({ session: null })
      },

      touchSessionActivity: () => {
        const session = get().session
        if (!session) return
        set({ session: { ...session, lastActivityAt: nowISO() } })
      },

      addAudit: (module, action, description, reference) => {
        const session = get().session
        const entry: AuditLog = {
          id: generateId('aud'),
          date: nowISO(),
          userId: session?.user.id ?? 'system',
          userName: session?.user.name ?? 'System',
          module,
          action,
          reference,
          description,
        }
        set({ auditLogs: [entry, ...get().auditLogs].slice(0, 500) })
      },

      pushNotification: (n) => {
        const item = normalizeNotification({
          id: generateId('ntf'),
          ...n,
          read: false,
          createdAt: nowISO(),
        })
        set({ notifications: [item, ...get().notifications].slice(0, 100) })
      },

      markNotificationRead: (id) => set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
      markAllNotificationsRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
      clearNotifications: () => set({ notifications: [] }),
      removeNotification: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),

      queueExportJob: (moduleId, moduleLabel, fileName) => {
        const job: ExportJob = {
          id: generateId('expj'),
          fileName,
          moduleId,
          moduleLabel,
          status: 'preparing',
          createdAt: nowISO(),
        }
        set({ exportJobs: [job, ...get().exportJobs].slice(0, 100) })
        return job
      },

      completeExportJob: (id, data) => {
        set({
          exportJobs: get().exportJobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: 'completed' as const,
                  fileName: data.fileName,
                  csvContent: data.csvContent,
                  rowCount: data.rowCount,
                  completedAt: nowISO(),
                  errorMessage: undefined,
                }
              : j,
          ),
        })
      },

      failExportJob: (id, errorMessage) => {
        set({
          exportJobs: get().exportJobs.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: 'failed' as const,
                  errorMessage,
                  completedAt: nowISO(),
                  csvContent: undefined,
                  rowCount: undefined,
                }
              : j,
          ),
        })
      },

      removeExportJob: (id) => set({ exportJobs: get().exportJobs.filter((j) => j.id !== id) }),
      clearExportJobs: () => set({ exportJobs: [] }),

      upsertCategory: (data) => {
        const ts = nowISO()
        if (data.id) {
          const updated = { ...get().categories.find((c) => c.id === data.id)!, ...data, updatedAt: ts } as Category
          set({ categories: get().categories.map((c) => (c.id === data.id ? updated : c)) })
          get().addAudit('Categories', 'Category Updated', `Updated ${updated.name}`, updated.id)
          return updated
        }
        const created: Category = { ...data, id: generateId('cat'), createdAt: ts, updatedAt: ts } as Category
        set({ categories: [created, ...get().categories] })
        get().addAudit('Categories', 'Category Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteCategory: (id) => {
        const item = get().categories.find((c) => c.id === id)
        set({ categories: get().categories.filter((c) => c.id !== id) })
        if (item) get().addAudit('Categories', 'Category Deleted', `Deleted ${item.name}`, id)
      },

      upsertBrand: (data) => {
        const ts = nowISO()
        if (data.id) {
          const updated = { ...get().brands.find((b) => b.id === data.id)!, ...data, updatedAt: ts } as Brand
          set({ brands: get().brands.map((b) => (b.id === data.id ? updated : b)) })
          get().addAudit('Brands', 'Brand Updated', `Updated ${updated.name}`, updated.id)
          return updated
        }
        const created: Brand = { ...data, id: generateId('br'), createdAt: ts, updatedAt: ts } as Brand
        set({ brands: [created, ...get().brands] })
        get().addAudit('Brands', 'Brand Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteBrand: (id) => {
        const item = get().brands.find((b) => b.id === id)
        set({ brands: get().brands.filter((b) => b.id !== id) })
        if (item) get().addAudit('Brands', 'Brand Deleted', `Deleted ${item.name}`, id)
      },

      upsertUnit: (data) => {
        const ts = nowISO()
        if (data.id) {
          const updated = { ...get().units.find((u) => u.id === data.id)!, ...data, updatedAt: ts } as Unit
          set({ units: get().units.map((u) => (u.id === data.id ? updated : u)) })
          return updated
        }
        const created: Unit = { ...data, id: generateId('un'), createdAt: ts, updatedAt: ts } as Unit
        set({ units: [created, ...get().units] })
        return created
      },
      deleteUnit: (id) => set({ units: get().units.filter((u) => u.id !== id) }),

      upsertGstRate: (data) => {
        const ts = nowISO()
        if (data.id) {
          const updated = { ...get().gstRates.find((g) => g.id === data.id)!, ...data, updatedAt: ts } as GstRate
          set({ gstRates: get().gstRates.map((g) => (g.id === data.id ? updated : g)) })
          return updated
        }
        const created: GstRate = { ...data, id: generateId('gst'), createdAt: ts, updatedAt: ts } as GstRate
        set({ gstRates: [created, ...get().gstRates] })
        return created
      },
      deleteGstRate: (id) => set({ gstRates: get().gstRates.filter((g) => g.id !== id) }),

      upsertProduct: (data) => {
        const ts = nowISO()
        if (data.id) {
          const existing = get().products.find((p) => p.id === data.id)!
          const updated: Product = {
            ...existing,
            ...data,
            currentStock: data.currentStock ?? existing.currentStock,
            updatedAt: ts,
          }
          set({ products: get().products.map((p) => (p.id === data.id ? updated : p)) })
          get().addAudit('Products', 'Product Updated', `Updated ${updated.name}`, updated.sku)
          return updated
        }
        const created: Product = {
          ...(data as Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'currentStock'>),
          id: generateId('prd'),
          currentStock: data.currentStock ?? data.openingStock,
          createdAt: ts,
          updatedAt: ts,
        }
        set({ products: [created, ...get().products] })
        get().addAudit('Products', 'Product Created', `Created ${created.name}`, created.sku)
        get().pushNotification({
          type: 'system',
          title: 'Product added',
          message: `${created.name} has been added to catalogue.`,
          link: `/master/products/${created.id}`,
          related: {
            type: 'product',
            id: created.id,
            label: created.sku || created.name,
            href: `/master/products/${created.id}`,
          },
        })
        return created
      },
      deleteProduct: (id) => {
        const item = get().products.find((p) => p.id === id)
        set({ products: get().products.filter((p) => p.id !== id) })
        if (item) get().addAudit('Products', 'Product Deleted', `Deleted ${item.name}`, item.sku)
      },

      upsertCustomer: (data) => {
        const ts = nowISO()
        const mobile = normalizeMobile(data.mobile)
        const gstNumber = data.gstNumber ? normalizeGstin(data.gstNumber) : data.gstNumber
        const payload = { ...data, mobile, gstNumber }
        if (data.id) {
          const existing = get().customers.find((c) => c.id === data.id)!
          const updated: Customer = { ...existing, ...payload, type: 'customer', updatedAt: ts }
          set({ customers: get().customers.map((c) => (c.id === data.id ? updated : c)) })
          get().addAudit('Customers', 'Customer Updated', `Updated ${updated.name}`, updated.id)
          return updated
        }
        const created: Customer = {
          ...payload,
          id: generateId('cus'),
          type: 'customer',
          currentBalance: data.currentBalance ?? data.openingBalance,
          createdAt: ts,
          updatedAt: ts,
        }
        set({ customers: [created, ...get().customers] })
        get().addAudit('Customers', 'Customer Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteCustomer: (id) => {
        const item = get().customers.find((c) => c.id === id)
        set({ customers: get().customers.filter((c) => c.id !== id) })
        if (item) get().addAudit('Customers', 'Customer Deleted', `Deleted ${item.name}`, id)
      },

      upsertDistributor: (data) => {
        const ts = nowISO()
        const mobile = normalizeMobile(data.mobile)
        const gstNumber = data.gstNumber ? normalizeGstin(data.gstNumber) : data.gstNumber
        const payload = { ...data, mobile, gstNumber }
        if (data.id) {
          const existing = get().distributors.find((d) => d.id === data.id)!
          const updated: Distributor = { ...existing, ...payload, type: 'distributor', updatedAt: ts }
          set({ distributors: get().distributors.map((d) => (d.id === data.id ? updated : d)) })
          return updated
        }
        const created: Distributor = {
          ...payload,
          id: generateId('dis'),
          type: 'distributor',
          currentBalance: data.currentBalance ?? data.openingBalance,
          createdAt: ts,
          updatedAt: ts,
        }
        set({ distributors: [created, ...get().distributors] })
        get().addAudit('Distributors', 'Distributor Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteDistributor: (id) => set({ distributors: get().distributors.filter((d) => d.id !== id) }),

      upsertSupplier: (data) => {
        const ts = nowISO()
        const mobile = normalizeMobile(data.mobile)
        const gstNumber = data.gstNumber ? normalizeGstin(data.gstNumber) : data.gstNumber
        const payload = { ...data, mobile, gstNumber }
        if (data.id) {
          const existing = get().suppliers.find((s) => s.id === data.id)!
          const updated: Supplier = { ...existing, ...payload, type: 'supplier', updatedAt: ts }
          set({ suppliers: get().suppliers.map((s) => (s.id === data.id ? updated : s)) })
          return updated
        }
        const created: Supplier = {
          ...payload,
          id: generateId('sup'),
          type: 'supplier',
          currentBalance: data.currentBalance ?? data.openingBalance,
          createdAt: ts,
          updatedAt: ts,
        }
        set({ suppliers: [created, ...get().suppliers] })
        get().addAudit('Suppliers', 'Supplier Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteSupplier: (id) => set({ suppliers: get().suppliers.filter((s) => s.id !== id) }),

      savePurchase: (input) => {
        const state = get()
        const purchaseCheck = validatePurchaseInput(input)
        if (!purchaseCheck.ok) return { ok: false, message: purchaseCheck.message }
        const supplier = state.suppliers.find((s) => s.id === input.supplierId)
        if (!supplier) return { ok: false, message: 'Supplier not found' }
        if (!input.items.length) return { ok: false, message: 'Add at least one product' }

        for (const item of input.items) {
          const product = state.products.find((p) => p.id === item.productId)
          if (!product) return { ok: false, message: `Product not found: ${item.productName || item.productId}` }
        }

        const lines: LineItem[] = input.items.map((item) => ({
          id: generateId('pli'),
          ...item,
          amount: roundMoney(item.quantity * item.rate - (item.discount || 0)),
        }))
        const totals = calculateInvoiceTotal({
          lines: lines.map((l) => ({ qty: l.quantity, rate: l.rate, discount: l.discount, gstRate: l.gstRate })),
          otherCharges: input.otherCharges,
          roundOff: input.roundOff,
          paid: input.paid,
        })
        const ts = nowISO()
        const status: DocStatus = input.confirm
          ? totals.due <= 0
            ? 'paid'
            : totals.paid > 0
              ? 'partial'
              : 'unpaid'
          : 'draft'

        let purchase: Purchase
        if (input.id) {
          const existing = state.purchases.find((p) => p.id === input.id)
          if (!existing) return { ok: false, message: 'Purchase not found' }
          if (existing.status !== 'draft' && existing.status !== 'confirmed') {
            // allow editing drafts mostly
          }
          purchase = {
            ...existing,
            date: input.date,
            supplierId: supplier.id,
            supplierName: supplier.name,
            invoiceNo: input.invoiceNo,
            items: lines,
            ...totals,
            notes: input.notes,
            status: input.confirm ? (status === 'draft' ? 'confirmed' : status) : 'draft',
            updatedAt: ts,
          }
          if (input.confirm && existing.status === 'draft') {
            purchase.status = totals.due <= 0 ? 'paid' : totals.paid > 0 ? 'partial' : 'confirmed'
          }
        } else {
          const counters = { ...state.counters, purchase: state.counters.purchase + 1 }
          purchase = {
            id: generateId('pur'),
            purchaseNo: nextDocNo('PO', counters.purchase),
            date: input.date,
            supplierId: supplier.id,
            supplierName: supplier.name,
            invoiceNo: input.invoiceNo,
            items: lines,
            ...totals,
            notes: input.notes,
            status: input.confirm ? (totals.due <= 0 ? 'paid' : totals.paid > 0 ? 'partial' : 'confirmed') : 'draft',
            createdAt: ts,
            updatedAt: ts,
          }
          set({ counters })
        }

        const wasDraftOrNew = !input.id || state.purchases.find((p) => p.id === input.id)?.status === 'draft'
        let products = state.products
        let movements = state.movements
        let suppliers = state.suppliers
        let ledger = state.ledger

        if (input.confirm && wasDraftOrNew) {
          for (const line of lines) {
            const res = applyStock(products, line.productId, line.quantity, true)
            if (!res.ok) return { ok: false, message: res.message }
            products = res.products
            movements = [
              makeMovement({
                date: purchase.date,
                productId: line.productId,
                productName: line.productName,
                reference: purchase.purchaseNo,
                type: 'purchase',
                quantityIn: line.quantity,
                quantityOut: 0,
                balance: res.product!.currentStock,
              }),
              ...movements,
            ]
          }
          suppliers = partyBalanceUpdate(suppliers, supplier.id, purchase.due)
          const bal = suppliers.find((s) => s.id === supplier.id)!.currentBalance
          ledger = [
            makeLedger({
              date: purchase.date,
              partyType: 'supplier',
              partyId: supplier.id,
              partyName: supplier.name,
              reference: purchase.purchaseNo,
              description: 'Purchase invoice',
              debit: 0,
              credit: purchase.grandTotal,
              balance: bal,
            }),
            ...ledger,
          ]
          if (purchase.paid > 0) {
            ledger = [
              makeLedger({
                date: purchase.date,
                partyType: 'supplier',
                partyId: supplier.id,
                partyName: supplier.name,
                reference: purchase.purchaseNo,
                description: 'Payment against purchase',
                debit: purchase.paid,
                credit: 0,
                balance: bal,
              }),
              ...ledger,
            ]
          }
        }

        const purchases = input.id
          ? state.purchases.map((p) => (p.id === input.id ? purchase : p))
          : [purchase, ...state.purchases]

        set({ purchases, products, movements, suppliers, ledger })
        if (input.confirm && wasDraftOrNew) {
          get().addAudit('Purchase', 'Purchase Created', `Purchase ${purchase.purchaseNo} confirmed`, purchase.purchaseNo)
          get().pushNotification({
            type: 'new_purchase',
            category: 'purchase',
            severity: 'success',
            title: 'Purchase confirmed',
            message: `${purchase.purchaseNo} from ${purchase.supplierName} — ₹${purchase.grandTotal.toLocaleString('en-IN')}`,
            link: `/transactions/purchases/${purchase.id}/edit`,
            related: {
              type: 'purchase',
              id: purchase.id,
              label: purchase.purchaseNo,
              href: `/transactions/purchases/${purchase.id}/edit`,
            },
          })
        }
        return { ok: true, purchase }
      },

      saveSale: (input) => {
        const state = get()
        const saleCheck = validateSaleInput(input)
        if (!saleCheck.ok) return { ok: false, message: saleCheck.message }
        const customer = state.customers.find((c) => c.id === input.customerId)
        if (!customer) return { ok: false, message: 'Customer not found' }
        if (!input.items.length) return { ok: false, message: 'Add at least one product' }

        for (const item of input.items) {
          const product = state.products.find((p) => p.id === item.productId)
          if (!product) return { ok: false, message: 'Product not found' }
          if (input.confirm && item.quantity > product.currentStock && !state.settings.allowNegativeStock) {
            return { ok: false, message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}` }
          }
        }

        const lines: LineItem[] = input.items.map((item) => ({
          id: generateId('sli'),
          ...item,
          amount: roundMoney(item.quantity * item.rate - (item.discount || 0)),
        }))
        const totals = calculateInvoiceTotal({
          lines: lines.map((l) => ({ qty: l.quantity, rate: l.rate, discount: l.discount, gstRate: l.gstRate })),
          otherCharges: input.otherCharges,
          paid: input.paid,
        })

        if (input.confirm) {
          const roleName = state.session?.user.roleName
          const discountEval = evaluateDiscountControl({
            roleName,
            limits: state.settings.discountLimits,
            discountAmount: totals.discount,
            subtotalAfterDiscount: totals.subtotal,
          })
          if (discountEval.exceeds) {
            const covered = (state.approvals ?? []).some(
              (a) =>
                a.kind === 'discount' &&
                (a.status === 'approved' || a.status === 'completed') &&
                a.payload?.customerId === customer.id &&
                (a.payload.discountPercent ?? 0) + 0.01 >= discountEval.effectivePercent,
            )
            if (!covered) {
              return {
                ok: false,
                message: `Approval required: discount ${discountEval.effectivePercent.toFixed(1)}% exceeds your limit of ${discountEval.maxLabel}.`,
              }
            }
          }

          const enforceCredit = state.settings.enforceCreditLimit !== false
          if (enforceCredit && totals.due > 0) {
            const credit = buildCreditSnapshot({
              creditLimit: customer.creditLimit,
              currentOutstanding: customer.currentBalance,
              currentSaleDue: totals.due,
              currentInvoice: totals.grandTotal,
            })
            if (credit.exceeded) {
              const covered = (state.approvals ?? []).some(
                (a) =>
                  a.kind === 'credit_limit' &&
                  (a.status === 'approved' || a.status === 'completed') &&
                  a.payload?.customerId === customer.id &&
                  (a.payload.creditLimitRequested ?? 0) + 0.01 >= credit.projectedOutstanding,
              )
              if (!covered) {
                return {
                  ok: false,
                  message:
                    'Credit limit exceeded. Request credit limit approval before confirming this sale.',
                }
              }
            }
          }
        }

        const ts = nowISO()

        let sale: Sale
        const counters = { ...state.counters }
        if (input.id) {
          const existing = state.sales.find((s) => s.id === input.id)
          if (!existing) return { ok: false, message: 'Sale not found' }
          sale = {
            ...existing,
            date: input.date,
            customerId: customer.id,
            customerName: customer.name,
            items: lines,
            ...totals,
            notes: input.notes,
            status: input.confirm
              ? totals.due <= 0
                ? 'paid'
                : totals.paid > 0
                  ? 'partial'
                  : 'confirmed'
              : 'draft',
            updatedAt: ts,
          }
        } else {
          counters.sale += 1
          const invoiceNo = `${state.settings.invoicePrefix}-${counters.sale}`
          sale = {
            id: generateId('sal'),
            invoiceNo,
            date: input.date,
            customerId: customer.id,
            customerName: customer.name,
            items: lines,
            ...totals,
            notes: input.notes,
            status: input.confirm
              ? totals.due <= 0
                ? 'paid'
                : totals.paid > 0
                  ? 'partial'
                  : 'confirmed'
              : 'draft',
            createdAt: ts,
            updatedAt: ts,
          }
        }

        const wasDraftOrNew = !input.id || state.sales.find((s) => s.id === input.id)?.status === 'draft'
        let products = state.products
        let movements = state.movements
        let customers = state.customers
        let ledger = state.ledger
        let invoices = state.invoices
        let notifications = state.notifications

        if (input.confirm && wasDraftOrNew) {
          for (const line of lines) {
            const res = applyStock(products, line.productId, -line.quantity, state.settings.allowNegativeStock)
            if (!res.ok) return { ok: false, message: res.message }
            products = res.products
            movements = [
              makeMovement({
                date: sale.date,
                productId: line.productId,
                productName: line.productName,
                reference: sale.invoiceNo,
                type: 'sale',
                quantityIn: 0,
                quantityOut: line.quantity,
                balance: res.product!.currentStock,
              }),
              ...movements,
            ]
            if (res.product && res.product.currentStock <= res.product.minimumStock) {
              notifications = [
                normalizeNotification({
                  id: generateId('ntf'),
                  type: 'low_stock',
                  severity: res.product.currentStock <= 5 ? 'critical' : 'warning',
                  title: res.product.currentStock <= 5 ? 'Critical stock alert' : 'Low stock alert',
                  message: `${res.product.name} is at ${res.product.currentStock} (min ${res.product.minimumStock}).`,
                  read: false,
                  link: '/inventory/low-stock',
                  related: {
                    type: 'product',
                    id: res.product.id,
                    label: res.product.sku || res.product.name,
                    href: `/master/products/${res.product.id}`,
                  },
                  createdAt: ts,
                }),
                ...notifications,
              ]
            }
          }
          customers = partyBalanceUpdate(customers, customer.id, sale.due)
          const bal = customers.find((c) => c.id === customer.id)!.currentBalance
          ledger = [
            makeLedger({
              date: sale.date,
              partyType: 'customer',
              partyId: customer.id,
              partyName: customer.name,
              reference: sale.invoiceNo,
              description: 'Sale invoice',
              debit: sale.grandTotal,
              credit: 0,
              balance: bal,
            }),
            ...ledger,
          ]
          if (sale.paid > 0) {
            ledger = [
              makeLedger({
                date: sale.date,
                partyType: 'customer',
                partyId: customer.id,
                partyName: customer.name,
                reference: sale.invoiceNo,
                description: 'Payment against sale',
                debit: 0,
                credit: sale.paid,
                balance: bal,
              }),
              ...ledger,
            ]
          }
          invoices = [buildInvoiceFromSale(sale, customer), ...invoices]
        }

        const sales = input.id ? state.sales.map((s) => (s.id === input.id ? sale : s)) : [sale, ...state.sales]
        set({ sales, products, movements, customers, ledger, invoices, notifications, counters })
        if (input.confirm && wasDraftOrNew) {
          get().addAudit('Sales', 'Sale Created', `Sale ${sale.invoiceNo} confirmed`, sale.invoiceNo)
          get().pushNotification({
            type: 'new_sale',
            category: 'sales',
            severity: 'success',
            title: 'Sale confirmed',
            message: `Invoice ${sale.invoiceNo} for ${sale.customerName}`,
            link: `/transactions/invoices/${invoices[0]?.id}`,
            related: {
              type: 'invoice',
              id: invoices[0]?.id,
              label: sale.invoiceNo,
              href: invoices[0]?.id
                ? `/transactions/invoices/${invoices[0].id}`
                : `/transactions/sales/${sale.id}/edit`,
            },
          })
          get().pushNotification({
            type: 'invoice',
            category: 'invoices',
            severity: 'info',
            title: 'Invoice generated',
            message: `Invoice ${sale.invoiceNo} is ready to print and share.`,
            link: invoices[0]?.id ? `/transactions/invoices/${invoices[0].id}` : '/transactions/invoices',
            related: {
              type: 'invoice',
              id: invoices[0]?.id,
              label: sale.invoiceNo,
              href: invoices[0]?.id
                ? `/transactions/invoices/${invoices[0].id}`
                : '/transactions/invoices',
            },
          })
        }
        return { ok: true, sale }
      },

      cancelSale: (id) => {
        const state = get()
        const sale = state.sales.find((s) => s.id === id)
        if (!sale) return { ok: false, message: 'Sale not found' }
        if (sale.status === 'cancelled') return { ok: false, message: 'Already cancelled' }

        const result = cancelSaleSideEffects({
          sale,
          products: state.products,
          movements: state.movements,
          customers: state.customers,
          invoices: state.invoices,
          ledger: state.ledger,
          allowNegativeStock: state.settings.allowNegativeStock,
        })
        if (!result.ok) return { ok: false, message: result.message }

        set({
          products: result.products,
          movements: result.movements,
          customers: result.customers,
          invoices: result.invoices,
          ledger: result.ledger,
          sales: state.sales.map((s) => (s.id === id ? { ...s, ...result.salesPatch } : s)),
        })
        get().addAudit('Sales', 'Sale Cancelled', `Cancelled ${sale.invoiceNo}`, sale.invoiceNo)
        return { ok: true }
      },

      cancelPurchase: (id) => {
        const state = get()
        const purchase = state.purchases.find((p) => p.id === id)
        if (!purchase) return { ok: false, message: 'Purchase not found' }
        if (purchase.status === 'cancelled') return { ok: false, message: 'Already cancelled' }

        const result = cancelPurchaseSideEffects({
          purchase,
          products: state.products,
          movements: state.movements,
          suppliers: state.suppliers,
          ledger: state.ledger,
          allowNegativeStock: state.settings.allowNegativeStock,
        })
        if (!result.ok) return { ok: false, message: result.message }

        set({
          products: result.products,
          movements: result.movements,
          suppliers: result.suppliers,
          ledger: result.ledger,
          purchases: state.purchases.map((p) => (p.id === id ? { ...p, ...result.purchasePatch } : p)),
        })
        get().addAudit('Purchase', 'Purchase Cancelled', `Cancelled ${purchase.purchaseNo}`, purchase.purchaseNo)
        return { ok: true }
      },

      recordPayment: (input) => {
        const state = get()
        const paymentCheck = validatePaymentInput(input)
        if (!paymentCheck.ok) return { ok: false, message: paymentCheck.message }
        if (input.amount <= 0) return { ok: false, message: 'Amount must be positive' }
        let partyName = ''
        let customers = state.customers
        let suppliers = state.suppliers
        let distributors = state.distributors

        if (input.partyType === 'customer') {
          const p = customers.find((c) => c.id === input.partyId)
          if (!p) return { ok: false, message: 'Customer not found' }
          partyName = p.name
          const delta = input.type === 'received' ? -input.amount : input.amount
          customers = partyBalanceUpdate(customers, p.id, delta)
        } else if (input.partyType === 'supplier') {
          const p = suppliers.find((s) => s.id === input.partyId)
          if (!p) return { ok: false, message: 'Supplier not found' }
          partyName = p.name
          const delta = input.type === 'paid' ? -input.amount : input.amount
          suppliers = partyBalanceUpdate(suppliers, p.id, delta)
        } else {
          const p = distributors.find((d) => d.id === input.partyId)
          if (!p) return { ok: false, message: 'Distributor not found' }
          partyName = p.name
          const delta = input.type === 'received' ? -input.amount : input.amount
          distributors = partyBalanceUpdate(distributors, p.id, delta)
        }

        const rawAllocations = (input.allocations ?? []).filter((a) => a.amount > 0)
        const canAllocateInvoices =
          input.type === 'received' &&
          (input.partyType === 'customer' || input.partyType === 'distributor') &&
          rawAllocations.length > 0

        if (canAllocateInvoices) {
          const totalAllocated = rawAllocations.reduce((sum, a) => sum + a.amount, 0)
          if (totalAllocated > input.amount + 0.001) {
            return { ok: false, message: 'Allocations exceed payment amount' }
          }
          for (const { saleId, amount } of rawAllocations) {
            const sale = state.sales.find((s) => s.id === saleId)
            if (!sale) return { ok: false, message: 'Sale not found' }
            if (sale.customerId !== input.partyId) {
              return { ok: false, message: 'Sale does not belong to this party' }
            }
            if (sale.status === 'cancelled' || sale.status === 'draft') {
              return { ok: false, message: `Cannot allocate to ${sale.invoiceNo}` }
            }
            if (amount > sale.due + 0.001) {
              return { ok: false, message: `Amount exceeds due on ${sale.invoiceNo}` }
            }
          }
        }

        const counters = { ...state.counters, payment: state.counters.payment + 1 }
        const bySale = new Map(rawAllocations.map((a) => [a.saleId, a.amount]))
        const ts = nowISO()

        let sales = state.sales
        let invoices = state.invoices
        let paymentAllocations: Payment['allocations'] = undefined
        let unallocated = input.amount

        if (canAllocateInvoices) {
          sales = state.sales.map((sale) => {
            const alloc = bySale.get(sale.id)
            if (!alloc) return sale
            const paid = roundMoney(sale.paid + alloc)
            const due = Math.max(0, roundMoney(sale.due - alloc))
            const status: Sale['status'] =
              due <= 0 ? 'paid' : paid > 0 ? 'partial' : sale.status
            return { ...sale, paid, due, status, updatedAt: ts }
          })
          invoices = state.invoices
          for (const sale of sales) {
            if (!bySale.has(sale.id)) continue
            invoices = syncInvoiceFromSale(invoices, sale)
          }
          paymentAllocations = rawAllocations.map((a) => {
            const sale = state.sales.find((s) => s.id === a.saleId)!
            return { saleId: a.saleId, invoiceNo: sale.invoiceNo, amount: a.amount }
          })
          unallocated = Math.max(
            0,
            roundMoney(input.amount - rawAllocations.reduce((s, a) => s + a.amount, 0)),
          )
        }

        const payment: Payment = {
          id: generateId('pay'),
          paymentNo: nextDocNo(input.type === 'received' ? 'PAY-R' : 'PAY-P', counters.payment),
          type: input.type,
          partyType: input.partyType,
          partyId: input.partyId,
          partyName,
          date: input.date,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          allocations: paymentAllocations,
          unallocated: canAllocateInvoices || input.type === 'received' ? unallocated : undefined,
          createdAt: ts,
        }

        const bal =
          input.partyType === 'customer'
            ? customers.find((c) => c.id === input.partyId)!.currentBalance
            : input.partyType === 'supplier'
              ? suppliers.find((s) => s.id === input.partyId)!.currentBalance
              : distributors.find((d) => d.id === input.partyId)!.currentBalance

        const allocSummary =
          paymentAllocations && paymentAllocations.length > 0
            ? ` · Allocated ${paymentAllocations.map((a) => `${a.invoiceNo} ₹${a.amount.toLocaleString('en-IN')}`).join(', ')}${
                unallocated > 0 ? ` · Unallocated ₹${unallocated.toLocaleString('en-IN')}` : ''
              }`
            : ''

        const ledgerEntry: LedgerEntry = {
          id: generateId('led'),
          date: input.date,
          partyType: input.partyType,
          partyId: input.partyId,
          partyName,
          reference: payment.paymentNo,
          description:
            (input.type === 'received' ? 'Payment received' : 'Payment made') + allocSummary,
          debit: input.type === 'paid' ? input.amount : 0,
          credit: input.type === 'received' ? input.amount : 0,
          balance: bal,
          createdAt: ts,
        }

        set({
          payments: [payment, ...state.payments],
          customers,
          suppliers,
          distributors,
          sales,
          invoices,
          ledger: [ledgerEntry, ...state.ledger],
          counters,
        })
        get().addAudit(
          'Payments',
          input.type === 'received' ? 'Payment Received' : 'Payment Paid',
          `${payment.paymentNo} — ${partyName}${allocSummary}`,
          payment.paymentNo,
        )
        get().pushNotification({
          type: 'payment_received',
          category: 'payments',
          severity: 'success',
          title: input.type === 'received' ? 'Payment received' : 'Payment recorded',
          message: `${payment.paymentNo}: ₹${input.amount.toLocaleString('en-IN')} — ${partyName}`,
          link: '/transactions/payments',
          related: {
            type: 'payment',
            id: payment.id,
            label: payment.paymentNo,
            href: '/transactions/payments',
          },
        })
        return { ok: true, payment }
      },

      allocateCustomerPayment: (customerId, paymentAmount, allocations) => {
        const state = get()
        if (paymentAmount <= 0) return { ok: false, message: 'Invalid payment amount' }

        const positive = allocations.filter((a) => a.amount > 0)
        const totalAllocated = positive.reduce((sum, a) => sum + a.amount, 0)
        if (totalAllocated > paymentAmount + 0.001) {
          return { ok: false, message: 'Allocations exceed payment amount' }
        }

        for (const { saleId, amount } of positive) {
          const sale = state.sales.find((s) => s.id === saleId)
          if (!sale) return { ok: false, message: 'Sale not found' }
          if (sale.customerId !== customerId) {
            return { ok: false, message: 'Sale does not belong to this customer' }
          }
          if (sale.status === 'cancelled' || sale.status === 'draft') {
            return { ok: false, message: `Cannot allocate to ${sale.invoiceNo}` }
          }
          if (amount > sale.due + 0.001) {
            return { ok: false, message: `Amount exceeds due on ${sale.invoiceNo}` }
          }
        }

        const bySale = new Map(positive.map((a) => [a.saleId, a.amount]))
        const ts = nowISO()

        const sales = state.sales.map((sale) => {
          const alloc = bySale.get(sale.id)
          if (!alloc) return sale
          const paid = roundMoney(sale.paid + alloc)
          const due = Math.max(0, roundMoney(sale.due - alloc))
          const status: Sale['status'] =
            due <= 0 ? 'paid' : paid > 0 ? 'partial' : sale.status
          return { ...sale, paid, due, status, updatedAt: ts }
        })

        let invoices = state.invoices
        for (const sale of sales) {
          if (!bySale.has(sale.id)) continue
          invoices = syncInvoiceFromSale(invoices, sale)
        }

        const unallocated = Math.max(0, roundMoney(paymentAmount - totalAllocated))

        set({ sales, invoices })
        get().addAudit(
          'Payments',
          'Payment Allocated',
          `Allocated ₹${totalAllocated.toLocaleString('en-IN')} to ${positive.length} sale(s); unallocated ₹${unallocated.toLocaleString('en-IN')}`,
        )
        return { ok: true, allocated: totalAllocated, unallocated }
      },

      saveExpense: (input) => {
        const ts = nowISO()
        if (input.id) {
          const updated = { ...get().expenses.find((e) => e.id === input.id)!, ...input, createdAt: get().expenses.find((e) => e.id === input.id)!.createdAt }
          set({ expenses: get().expenses.map((e) => (e.id === input.id ? updated : e)) })
          return updated
        }
        const created: Expense = { ...input, id: generateId('exp'), createdAt: ts }
        set({ expenses: [created, ...get().expenses] })
        get().addAudit('Expenses', 'Expense Created', created.description, created.id)
        return created
      },
      deleteExpense: (id) => set({ expenses: get().expenses.filter((e) => e.id !== id) }),

      adjustStock: (input) => {
        const state = get()
        const product = state.products.find((p) => p.id === input.productId)
        if (!product) return { ok: false, message: 'Product not found' }
        const qtyCheck = validateQuantity(input.quantity, 'Quantity')
        if (!qtyCheck.ok) return { ok: false, message: qtyCheck.message }
        const delta = input.adjustmentType === 'increase' ? input.quantity : -input.quantity
        const res = applyStock(state.products, input.productId, delta, state.settings.allowNegativeStock)
        if (!res.ok) return { ok: false, message: res.message }
        const ts = nowISO()
        const counters = { ...state.counters, adjustment: state.counters.adjustment + 1 }
        const adj: StockAdjustment = {
          id: generateId('adj'),
          date: input.date ?? todayISO(),
          productId: product.id,
          productName: product.name,
          adjustmentType: input.adjustmentType,
          quantity: input.quantity,
          reason: input.reason,
          notes: input.notes,
          createdAt: ts,
        }
        const mov: StockMovement = {
          id: generateId('mov'),
          date: adj.date,
          productId: product.id,
          productName: product.name,
          reference: nextDocNo('ADJ', counters.adjustment),
          type: 'adjustment',
          quantityIn: input.adjustmentType === 'increase' ? input.quantity : 0,
          quantityOut: input.adjustmentType === 'decrease' ? input.quantity : 0,
          balance: res.product!.currentStock,
          notes: input.reason,
          createdAt: ts,
        }
        set({
          products: res.products,
          adjustments: [adj, ...state.adjustments],
          movements: [mov, ...state.movements],
          counters,
        })
        get().addAudit('Stock', 'Stock Adjusted', `${product.name} ${input.adjustmentType} by ${input.quantity}`, mov.reference)
        get().pushNotification({
          type: 'stock_adjustment',
          category: 'stock',
          severity: 'info',
          title: 'Stock adjusted',
          message: `${product.name}: ${input.adjustmentType} ${input.quantity}`,
          link: '/inventory/adjustment',
          related: {
            type: 'product',
            id: product.id,
            label: product.sku || product.name,
            href: `/master/products/${product.id}`,
          },
        })
        return { ok: true }
      },

      saveTransfer: (input) => {
        const state = get()
        const product = state.products.find((p) => p.id === input.productId)
        if (!product) throw new Error('Product not found')
        const ts = nowISO()
        if (input.id) {
          const updated: StockTransfer = {
            ...state.transfers.find((t) => t.id === input.id)!,
            ...input,
            productName: product.name,
            updatedAt: ts,
          }
          set({ transfers: state.transfers.map((t) => (t.id === input.id ? updated : t)) })
          return updated
        }
        const counters = { ...state.counters, transfer: state.counters.transfer + 1 }
        const created: StockTransfer = {
          ...input,
          id: generateId('trn'),
          transferNo: nextDocNo('TR', counters.transfer),
          productName: product.name,
          createdAt: ts,
          updatedAt: ts,
        }
        set({ transfers: [created, ...state.transfers], counters })
        return created
      },

      updateTransferStatus: (id, status) => {
        const state = get()
        const transfer = state.transfers.find((t) => t.id === id)
        if (!transfer) return
        let products = state.products
        let movements = state.movements
        if (status === 'completed' && transfer.status !== 'completed') {
          // Location transfer is logged as movement; stock qty stays same (same company inventory).
          // Reject if insufficient stock at source for visibility.
          const product = products.find((p) => p.id === transfer.productId)
          if (!product || product.currentStock < transfer.quantity) {
            get().pushNotification({
              type: 'system',
              category: 'system',
              severity: 'critical',
              priority: 'urgent',
              title: 'Transfer blocked',
              message: `Insufficient stock to complete ${transfer.transferNo}`,
              link: '/inventory/transfer',
              related: {
                type: 'transfer',
                id: transfer.id,
                label: transfer.transferNo,
                href: '/inventory/transfer',
              },
            })
            return
          }
          movements = [
            {
              id: generateId('mov'),
              date: todayISO(),
              productId: transfer.productId,
              productName: transfer.productName,
              reference: transfer.transferNo,
              type: 'transfer',
              quantityIn: transfer.quantity,
              quantityOut: transfer.quantity,
              balance: product.currentStock,
              notes: `${transfer.fromLocation} → ${transfer.toLocation} (${transfer.quantity} units relocated)`,
              createdAt: nowISO(),
            },
            ...movements,
          ]
          get().addAudit('Stock', 'Transfer Completed', `${transfer.transferNo}: ${transfer.fromLocation} → ${transfer.toLocation}`, transfer.transferNo)
        }
        set({
          products,
          movements,
          transfers: state.transfers.map((t) => (t.id === id ? { ...t, status, updatedAt: nowISO() } : t)),
        })
      },

      createSalesReturn: (input) => {
        const state = get()
        const sale = state.sales.find((s) => s.id === input.saleId)
        if (!sale || sale.status === 'cancelled' || sale.status === 'draft') return { ok: false, message: 'Invalid sale' }
        const line = sale.items.find((i) => i.productId === input.productId)
        if (!line) return { ok: false, message: 'Product not in sale' }
        const alreadyReturned = returnedQtyForSaleProduct(state.salesReturns, sale.id, line.productId)
        const remainingQty = line.quantity - alreadyReturned
        if (input.returnQuantity <= 0 || input.returnQuantity > remainingQty) {
          return { ok: false, message: `Return qty must be between 1 and ${remainingQty}` }
        }
        const ts = nowISO()
        const counters = { ...state.counters, return: state.counters.return + 1 }
        const amount = roundMoney((line.amount / line.quantity) * input.returnQuantity)
        const ret: SalesReturn = {
          id: generateId('sret'),
          returnNo: nextDocNo('SR', counters.return),
          date: input.date ?? todayISO(),
          saleId: sale.id,
          invoiceNo: sale.invoiceNo,
          customerId: sale.customerId,
          customerName: sale.customerName,
          productId: line.productId,
          productName: line.productName,
          soldQuantity: line.quantity,
          returnQuantity: input.returnQuantity,
          rate: line.rate,
          amount,
          reason: input.reason,
          status: 'confirmed',
          createdAt: ts,
        }
        const res = applyStock(state.products, line.productId, input.returnQuantity, true)
        if (!res.ok) return { ok: false, message: res.message }

        const updatedSale = applyReturnToSaleBalances(sale, amount)
        const customers = partyBalanceUpdate(state.customers, sale.customerId, -amount)
        const invoices = syncInvoiceFromSale(state.invoices, updatedSale)
        const bal = customers.find((c) => c.id === sale.customerId)!.currentBalance

        set({
          salesReturns: [ret, ...state.salesReturns],
          sales: state.sales.map((s) => (s.id === sale.id ? updatedSale : s)),
          invoices,
          products: res.products,
          movements: [
            makeMovement({
              date: ret.date,
              productId: line.productId,
              productName: line.productName,
              reference: ret.returnNo,
              type: 'sales_return',
              quantityIn: input.returnQuantity,
              quantityOut: 0,
              balance: res.product!.currentStock,
              notes: `Return against ${sale.invoiceNo}`,
            }),
            ...state.movements,
          ],
          customers,
          ledger: [
            makeLedger({
              date: ret.date,
              partyType: 'customer',
              partyId: sale.customerId,
              partyName: sale.customerName,
              reference: ret.returnNo,
              description: `Sales return · ${sale.invoiceNo}`,
              debit: 0,
              credit: amount,
              balance: bal,
            }),
            ...state.ledger,
          ],
          counters,
        })
        get().addAudit('Returns', 'Sales Return Created', ret.returnNo, ret.returnNo)
        get().pushNotification({
          type: 'return_created',
          category: 'sales',
          severity: 'warning',
          title: 'Sales return',
          message: ret.returnNo,
          link: '/transactions/sales-returns',
          related: { type: 'sales_return', id: ret.id, label: ret.returnNo, href: '/transactions/sales-returns' },
        })
        return { ok: true }
      },

      createPurchaseReturn: (input) => {
        const state = get()
        const purchase = state.purchases.find((p) => p.id === input.purchaseId)
        if (!purchase || purchase.status === 'cancelled' || purchase.status === 'draft') return { ok: false, message: 'Invalid purchase' }
        const line = purchase.items.find((i) => i.productId === input.productId)
        if (!line) return { ok: false, message: 'Product not in purchase' }
        const alreadyReturned = returnedQtyForPurchaseProduct(state.purchaseReturns, purchase.id, line.productId)
        const remainingQty = line.quantity - alreadyReturned
        if (input.returnQuantity <= 0 || input.returnQuantity > remainingQty) {
          return { ok: false, message: `Return qty must be between 1 and ${remainingQty}` }
        }
        const ts = nowISO()
        const counters = { ...state.counters, return: state.counters.return + 1 }
        const amount = roundMoney((line.amount / line.quantity) * input.returnQuantity)
        const ret: PurchaseReturn = {
          id: generateId('pret'),
          returnNo: nextDocNo('PR', counters.return),
          date: input.date ?? todayISO(),
          purchaseId: purchase.id,
          purchaseNo: purchase.purchaseNo,
          supplierId: purchase.supplierId,
          supplierName: purchase.supplierName,
          productId: line.productId,
          productName: line.productName,
          purchaseQuantity: line.quantity,
          returnQuantity: input.returnQuantity,
          rate: line.rate,
          amount,
          reason: input.reason,
          status: 'confirmed',
          createdAt: ts,
        }
        const res = applyStock(state.products, line.productId, -input.returnQuantity, state.settings.allowNegativeStock)
        if (!res.ok) return { ok: false, message: res.message }

        const updatedPurchase = applyReturnToPurchaseBalances(purchase, amount)
        const suppliers = partyBalanceUpdate(state.suppliers, purchase.supplierId, -amount)
        const bal = suppliers.find((s) => s.id === purchase.supplierId)!.currentBalance

        set({
          purchaseReturns: [ret, ...state.purchaseReturns],
          purchases: state.purchases.map((p) => (p.id === purchase.id ? updatedPurchase : p)),
          products: res.products,
          movements: [
            makeMovement({
              date: ret.date,
              productId: line.productId,
              productName: line.productName,
              reference: ret.returnNo,
              type: 'purchase_return',
              quantityIn: 0,
              quantityOut: input.returnQuantity,
              balance: res.product!.currentStock,
              notes: `Return against ${purchase.purchaseNo}`,
            }),
            ...state.movements,
          ],
          suppliers,
          ledger: [
            makeLedger({
              date: ret.date,
              partyType: 'supplier',
              partyId: purchase.supplierId,
              partyName: purchase.supplierName,
              reference: ret.returnNo,
              description: `Purchase return · ${purchase.purchaseNo}`,
              debit: amount,
              credit: 0,
              balance: bal,
            }),
            ...state.ledger,
          ],
          counters,
        })
        get().addAudit('Returns', 'Purchase Return Created', ret.returnNo, ret.returnNo)
        get().pushNotification({
          type: 'return_created',
          category: 'purchase',
          severity: 'warning',
          title: 'Purchase return',
          message: ret.returnNo,
          link: '/transactions/purchase-returns',
          related: {
            type: 'purchase_return',
            id: ret.id,
            label: ret.returnNo,
            href: '/transactions/purchase-returns',
          },
        })
        return { ok: true }
      },

      upsertUser: (data) => {
        const ts = nowISO()
        if (data.id) {
          const updated = { ...get().users.find((u) => u.id === data.id)!, ...data, updatedAt: ts }
          set({ users: get().users.map((u) => (u.id === data.id ? updated : u)) })
          get().addAudit('Users', 'User Updated', `Updated ${updated.name}`, updated.id)
          return updated
        }
        const created: User = { ...data, id: generateId('usr'), createdAt: ts, updatedAt: ts }
        set({ users: [created, ...get().users] })
        get().addAudit('Users', 'User Created', `Created ${created.name}`, created.id)
        return created
      },
      deleteUser: (id) => {
        if (get().session?.user.id === id) return
        set({ users: get().users.filter((u) => u.id !== id) })
        get().addAudit('Users', 'User Deleted', `Deleted user ${id}`, id)
      },

      setUserStatus: (id, status) => {
        const user = get().users.find((u) => u.id === id)
        if (!user) return { ok: false, message: 'User not found' }
        if (get().session?.user.id === id && status === 'inactive') {
          return { ok: false, message: 'Cannot deactivate your own account' }
        }
        set({
          users: get().users.map((u) =>
            u.id === id ? { ...u, status, updatedAt: nowISO() } : u,
          ),
        })
        get().addAudit('Users', 'Status Changed', `${user.name} → ${status}`, id)
        return { ok: true }
      },

      assignUserRole: (id, roleId) => {
        const user = get().users.find((u) => u.id === id)
        const role = get().roles.find((r) => r.id === roleId)
        if (!user) return { ok: false, message: 'User not found' }
        if (!role) return { ok: false, message: 'Role not found' }
        const updated = { ...user, roleId: role.id, roleName: role.name, updatedAt: nowISO() }
        set({
          users: get().users.map((u) => (u.id === id ? updated : u)),
          session:
            get().session?.user.id === id
              ? { ...get().session!, user: stripPassword(updated) }
              : get().session,
        })
        get().addAudit('Users', 'Role Assigned', `${user.name} → ${role.name}`, id)
        return { ok: true }
      },

      updateRolePermissions: (roleId, permissions) => {
        set({ roles: get().roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)) })
        get().addAudit('Roles', 'Permissions Updated', `Updated role ${roleId}`, roleId)
      },

      updateSettings: (settings) => {
        set({ settings: { ...get().settings, ...settings } })
        get().addAudit('Settings', 'Settings Updated', 'Business settings saved')
      },

      createApproval: (input) => {
        const session = get().session
        if (!session) return { ok: false, message: 'Sign in required' }
        const actor = actorFromSession(session)
        const n = get().counters.approval + 1
        const id = generateId('apr')
        const requestNo = nextDocNo('APR', n)
        const now = nowISO()
        let approval: ApprovalRequest = {
          id,
          requestNo,
          kind: input.kind,
          status: 'draft',
          title: input.title || APPROVAL_KIND_LABELS[input.kind],
          description: input.description,
          amount: input.amount,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          referenceLabel: input.referenceLabel,
          href: input.href,
          requestedById: actor.userId,
          requestedByName: actor.userName,
          payload: input.payload,
          timeline: [
            {
              id: generateId('ape'),
              at: now,
              action: 'created',
              status: 'draft',
              userId: actor.userId,
              userName: actor.userName,
            },
          ],
          createdAt: now,
          updatedAt: now,
        }
        if (input.submit) {
          approval = pushApprovalEvent(approval, 'submitted', 'pending_approval', actor, 'Submitted for approval')
        }
        set({
          approvals: [approval, ...get().approvals],
          counters: { ...get().counters, approval: n },
        })
        get().addAudit(
          'Approvals',
          input.submit ? 'Approval Submitted' : 'Approval Created',
          `${approval.requestNo}: ${approval.title}`,
          approval.requestNo,
        )
        if (input.submit) {
          get().pushNotification({
            type: 'approval',
            category: 'approvals',
            severity: 'info',
            priority: 'high',
            title: 'Approval pending',
            message: `${approval.requestNo} — ${approval.title}`,
            link: '/admin/approvals',
            related: {
              type: 'approval',
              id: approval.id,
              label: approval.requestNo,
              href: '/admin/approvals',
            },
          })
        }
        return { ok: true, approval }
      },

      submitApproval: (id, note) => {
        const approval = get().approvals.find((a) => a.id === id)
        if (!approval) return { ok: false, message: 'Approval not found' }
        if (approval.status !== 'draft') return { ok: false, message: 'Only drafts can be submitted' }
        const actor = actorFromSession(get().session)
        const next = pushApprovalEvent(approval, 'submitted', 'pending_approval', actor, note ?? 'Submitted for approval')
        set({ approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        get().addAudit('Approvals', 'Approval Submitted', `${next.requestNo} submitted`, next.requestNo)
        get().pushNotification({
          type: 'approval',
          category: 'approvals',
          severity: 'info',
          priority: 'high',
          title: 'Approval pending',
          message: `${next.requestNo} — ${next.title}`,
          link: '/admin/approvals',
          related: {
            type: 'approval',
            id: next.id,
            label: next.requestNo,
            href: '/admin/approvals',
          },
        })
        return { ok: true }
      },

      approveApproval: (id, note) => {
        const approval = get().approvals.find((a) => a.id === id)
        if (!approval) return { ok: false, message: 'Approval not found' }
        if (approval.status !== 'pending_approval') {
          return { ok: false, message: 'Only pending requests can be approved' }
        }
        const actor = actorFromSession(get().session)
        let next = pushApprovalEvent(approval, 'approved', 'approved', actor, note)
        next = {
          ...next,
          approverId: actor.userId,
          approverName: actor.userName,
          decisionNote: note,
          decidedAt: nowISO(),
        }

        // Apply credit-limit change on approve
        if (next.kind === 'credit_limit' && next.payload?.customerId && next.payload.creditLimitRequested) {
          const customers = get().customers.map((c) =>
            c.id === next.payload!.customerId
              ? { ...c, creditLimit: next.payload!.creditLimitRequested!, updatedAt: nowISO() }
              : c,
          )
          set({ customers, approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        } else {
          set({ approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        }

        get().addAudit('Approvals', 'Approval Approved', `${next.requestNo} approved`, next.requestNo)
        get().pushNotification({
          type: 'approval',
          category: 'approvals',
          severity: 'success',
          title: 'Request approved',
          message: `${next.requestNo} — ${next.title}`,
          link: '/admin/approvals',
          related: {
            type: 'approval',
            id: next.id,
            label: next.requestNo,
            href: '/admin/approvals',
          },
        })
        return { ok: true }
      },

      rejectApproval: (id, note) => {
        const approval = get().approvals.find((a) => a.id === id)
        if (!approval) return { ok: false, message: 'Approval not found' }
        if (approval.status !== 'pending_approval') {
          return { ok: false, message: 'Only pending requests can be rejected' }
        }
        const actor = actorFromSession(get().session)
        let next = pushApprovalEvent(approval, 'rejected', 'rejected', actor, note)
        next = {
          ...next,
          approverId: actor.userId,
          approverName: actor.userName,
          decisionNote: note,
          decidedAt: nowISO(),
        }
        set({ approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        get().addAudit('Approvals', 'Approval Rejected', `${next.requestNo} rejected`, next.requestNo)
        get().pushNotification({
          type: 'approval',
          category: 'approvals',
          severity: 'warning',
          priority: 'high',
          title: 'Request rejected',
          message: `${next.requestNo} — ${next.title}`,
          link: '/admin/approvals',
          related: {
            type: 'approval',
            id: next.id,
            label: next.requestNo,
            href: '/admin/approvals',
          },
        })
        return { ok: true }
      },

      completeApproval: (id, note) => {
        const approval = get().approvals.find((a) => a.id === id)
        if (!approval) return { ok: false, message: 'Approval not found' }
        if (approval.status !== 'approved') {
          return { ok: false, message: 'Only approved requests can be completed' }
        }
        const actor = actorFromSession(get().session)

        if (approval.kind === 'stock_adjustment' && approval.payload?.productId) {
          const result = get().adjustStock({
            productId: approval.payload.productId,
            adjustmentType: approval.payload.adjustmentType ?? 'decrease',
            quantity: approval.payload.quantity ?? 0,
            reason: approval.payload.reason ?? approval.title,
          })
          if (!result.ok) return { ok: false, message: result.message }
        }

        let next = pushApprovalEvent(approval, 'completed', 'completed', actor, note ?? 'Marked completed')
        next = { ...next, completedAt: nowISO() }
        set({ approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        get().addAudit('Approvals', 'Approval Completed', `${next.requestNo} completed`, next.requestNo)
        return { ok: true }
      },

      addApprovalComment: (id, note) => {
        const approval = get().approvals.find((a) => a.id === id)
        if (!approval) return { ok: false, message: 'Approval not found' }
        if (!note.trim()) return { ok: false, message: 'Comment required' }
        const actor = actorFromSession(get().session)
        const event: ApprovalTimelineEvent = {
          id: generateId('ape'),
          at: nowISO(),
          action: 'comment',
          status: approval.status,
          userId: actor.userId,
          userName: actor.userName,
          note: note.trim(),
        }
        const next: ApprovalRequest = {
          ...approval,
          timeline: [...approval.timeline, event],
          updatedAt: nowISO(),
        }
        set({ approvals: get().approvals.map((a) => (a.id === id ? next : a)) })
        return { ok: true }
      },

      resetDemoData: () => {
        const db = resetMockDatabase()
        set({
          ...sliceFromDatabase(db),
          hydrated: true,
          session: null,
        })
      },

      loadSampleBusinessData: () => {
        const db = replaceMockDatabase(createSampleBusinessDatabase())
        const slice = sliceFromDatabase(db)
        const session = rebindSession(get().session, slice.users)
        set({
          ...slice,
          hydrated: true,
          session,
        })
        get().addAudit('Admin', 'Sample Data Loaded', 'Loaded Sheetal Cool sample business dataset')
      },

      clearDemoData: () => {
        const db = replaceMockDatabase(createClearedDemoDatabase())
        const slice = sliceFromDatabase(db)
        const session = rebindSession(get().session, slice.users)
        set({
          ...slice,
          hydrated: true,
          session,
        })
        get().addAudit('Admin', 'Demo Data Cleared', 'Cleared transactional demo data')
      },
    }),
    {
      name: 'dms-sheetal-cool-v2',
      partialize: (s) => {
        const { hydrated: _h, ...rest } = s
        // strip functions automatically by zustand persist — only state
        return {
          session: rest.session,
          categories: rest.categories,
          brands: rest.brands,
          units: rest.units,
          gstRates: rest.gstRates,
          products: rest.products,
          customers: rest.customers,
          distributors: rest.distributors,
          suppliers: rest.suppliers,
          purchases: rest.purchases,
          sales: rest.sales,
          invoices: rest.invoices,
          payments: rest.payments,
          expenses: rest.expenses,
          movements: rest.movements,
          adjustments: rest.adjustments,
          transfers: rest.transfers,
          salesReturns: rest.salesReturns,
          purchaseReturns: rest.purchaseReturns,
          ledger: rest.ledger,
          users: rest.users,
          roles: rest.roles,
          notifications: rest.notifications,
          auditLogs: rest.auditLogs,
          approvals: rest.approvals,
          exportJobs: rest.exportJobs,
          settings: rest.settings,
          locations: rest.locations,
          counters: rest.counters,
        }
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DmsState>
        const counters = {
          ...current.counters,
          ...(p.counters ?? {}),
          approval: p.counters?.approval ?? current.counters.approval,
        }
        const settings = {
          ...current.settings,
          ...(p.settings ?? {}),
          discountLimits: {
            ...DEFAULT_DISCOUNT_LIMITS,
            ...(current.settings.discountLimits ?? {}),
            ...(p.settings?.discountLimits ?? {}),
          },
          enforceCreditLimit: p.settings?.enforceCreditLimit ?? current.settings.enforceCreditLimit ?? true,
        }
        const seed = getMockDatabase()
        const session = p.session
          ? {
              ...p.session,
              lastActivityAt: p.session.lastActivityAt ?? nowISO(),
            }
          : null
        /** Merge seed role modules into persisted roles so new permission keys (e.g. approvals) are not lost to store drift. */
        const roles = (() => {
          const persisted = (p.roles ?? current.roles) as Role[]
          return seed.roles.map((seedRole) => {
            const existing =
              persisted.find((r) => r.id === seedRole.id) ??
              persisted.find((r) => r.name === seedRole.name)
            if (!existing) return seedRole
            const byModule = new Map(existing.permissions.map((row) => [row.module, row]))
            const permissions = seedRole.permissions.map(
              (seedPerm) => byModule.get(seedPerm.module) ?? seedPerm,
            )
            for (const row of existing.permissions) {
              if (!permissions.some((x) => x.module === row.module)) permissions.push(row)
            }
            return {
              ...seedRole,
              ...existing,
              id: seedRole.id,
              name: existing.name || seedRole.name,
              permissions,
            }
          })
        })()
        return {
          ...current,
          ...p,
          session,
          roles,
          approvals: p.approvals ?? seed.approvals,
          exportJobs: p.exportJobs ?? seed.exportJobs,
          notifications: (p.notifications ?? current.notifications ?? seed.notifications).map((n) =>
            normalizeNotification(n as Parameters<typeof normalizeNotification>[0]),
          ),
          settings,
          counters,
          hydrated: true,
        }
      },
    },
  ),
)
