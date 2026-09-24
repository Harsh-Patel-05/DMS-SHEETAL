export type Status = 'active' | 'inactive'
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type DocStatus = 'draft' | 'confirmed' | 'cancelled' | 'paid' | 'partial' | 'unpaid'
export type PaymentType = 'received' | 'paid'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card' | 'other'
export type MovementType =
  | 'purchase'
  | 'sale'
  | 'sales_return'
  | 'purchase_return'
  | 'adjustment'
  | 'transfer'
export type AdjustmentType = 'increase' | 'decrease'
export type TransferStatus = 'draft' | 'requested' | 'approved' | 'rejected' | 'completed'
export type PartyType = 'customer' | 'distributor' | 'supplier'
export type ExpenseCategory =
  | 'rent'
  | 'salary'
  | 'transport'
  | 'electricity'
  | 'maintenance'
  | 'marketing'
  | 'office'
  | 'other'
export type NotificationType =
  | 'low_stock'
  | 'new_sale'
  | 'new_purchase'
  | 'payment_received'
  | 'payment_due'
  | 'return_created'
  | 'stock_adjustment'
  | 'system'
  | 'approval'
  | 'invoice'

export type NotificationCategory =
  | 'stock'
  | 'sales'
  | 'purchase'
  | 'payments'
  | 'invoices'
  | 'approvals'
  | 'system'

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export type RoleName =
  | 'Super Admin'
  | 'Admin'
  | 'Manager'
  | 'Sales Executive'
  | 'Stock Manager'
  | 'Accountant'
  | 'Viewer'

export type PermissionModule =
  | 'dashboard'
  | 'products'
  | 'stock'
  | 'purchase'
  | 'sales'
  | 'invoices'
  | 'payments'
  | 'customers'
  | 'distributors'
  | 'suppliers'
  | 'returns'
  | 'expenses'
  | 'reports'
  | 'users'
  | 'settings'
  | 'audit_logs'
  | 'approvals'

export type {
  ApprovalStatus,
  ApprovalKind,
  ApprovalEventAction,
  ApprovalTimelineEvent,
  ApprovalPayload,
  ApprovalRequest,
} from './approval'
export { APPROVAL_KIND_LABELS, APPROVAL_STATUS_LABELS } from './approval'

export interface Category {
  id: string
  name: string
  description?: string
  parentId?: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Brand {
  id: string
  name: string
  description?: string
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  name: string
  shortName: string
  status: Status
  createdAt: string
  updatedAt: string
}

export interface GstRate {
  id: string
  name: string
  rate: number
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  categoryId: string
  brandId: string
  unitId: string
  purchasePrice: number
  sellingPrice: number
  mrp: number
  gstRateId: string
  hsnCode: string
  openingStock: number
  currentStock: number
  minimumStock: number
  description?: string
  imageUrl?: string
  status: Status
  createdAt: string
  updatedAt: string
}

export interface PartyBase {
  id: string
  name: string
  mobile: string
  email?: string
  address: string
  city: string
  state: string
  gstNumber?: string
  creditLimit: number
  openingBalance: number
  currentBalance: number
  paymentTerms: string
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Customer extends PartyBase {
  type: 'customer'
}

export interface Distributor extends PartyBase {
  type: 'distributor'
  companyName: string
  contactPerson: string
  pan?: string
}

export interface Supplier extends PartyBase {
  type: 'supplier'
  companyName?: string
  contactPerson?: string
  pan?: string
}

export interface LineItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  rate: number
  discount: number
  gstRate: number
  amount: number
  notes?: string
}

export interface Purchase {
  id: string
  purchaseNo: string
  date: string
  supplierId: string
  supplierName: string
  invoiceNo: string
  items: LineItem[]
  subtotal: number
  discount: number
  cgst: number
  sgst: number
  igst: number
  otherCharges: number
  roundOff: number
  grandTotal: number
  paid: number
  due: number
  status: DocStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  invoiceNo: string
  date: string
  customerId: string
  customerName: string
  items: LineItem[]
  subtotal: number
  discount: number
  cgst: number
  sgst: number
  igst: number
  otherCharges: number
  roundOff: number
  grandTotal: number
  paid: number
  due: number
  status: DocStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  invoiceNo: string
  saleId: string
  date: string
  customerId: string
  customerName: string
  customerAddress: string
  customerGst?: string
  items: LineItem[]
  subtotal: number
  discount: number
  cgst: number
  sgst: number
  igst: number
  otherCharges: number
  roundOff: number
  grandTotal: number
  paid: number
  balance: number
  status: DocStatus
  createdAt: string
}

export interface PaymentAllocation {
  saleId: string
  invoiceNo: string
  amount: number
}

export interface Payment {
  id: string
  paymentNo: string
  type: PaymentType
  partyType: PartyType
  partyId: string
  partyName: string
  date: string
  amount: number
  method: PaymentMethod
  reference?: string
  notes?: string
  /** Invoice / sale allocations for received customer/distributor payments */
  allocations?: PaymentAllocation[]
  /** Portion of payment not applied to any invoice */
  unallocated?: number
  createdAt: string
}

export interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  paymentMethod: PaymentMethod
  reference?: string
  notes?: string
  createdAt: string
}

export interface StockMovement {
  id: string
  date: string
  productId: string
  productName: string
  reference: string
  type: MovementType
  quantityIn: number
  quantityOut: number
  balance: number
  notes?: string
  createdAt: string
}

export interface StockAdjustment {
  id: string
  date: string
  productId: string
  productName: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: string
  notes?: string
  createdAt: string
}

export interface StockTransfer {
  id: string
  transferNo: string
  date: string
  fromLocation: string
  toLocation: string
  productId: string
  productName: string
  quantity: number
  reason: string
  status: TransferStatus
  createdAt: string
  updatedAt: string
}

export interface SalesReturn {
  id: string
  returnNo: string
  date: string
  saleId: string
  invoiceNo: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  soldQuantity: number
  returnQuantity: number
  rate: number
  amount: number
  reason: string
  status: DocStatus
  createdAt: string
}

export interface PurchaseReturn {
  id: string
  returnNo: string
  date: string
  purchaseId: string
  purchaseNo: string
  supplierId: string
  supplierName: string
  productId: string
  productName: string
  purchaseQuantity: number
  returnQuantity: number
  rate: number
  amount: number
  reason: string
  status: DocStatus
  createdAt: string
}

export interface LedgerEntry {
  id: string
  date: string
  partyType: PartyType
  partyId: string
  partyName: string
  reference: string
  description: string
  debit: number
  credit: number
  balance: number
  createdAt: string
}

export interface Permission {
  module: PermissionModule
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

export interface Role {
  id: string
  name: RoleName
  description: string
  permissions: Permission[]
  status: Status
}

export interface User {
  id: string
  name: string
  email: string
  username: string
  password: string
  roleId: string
  roleName: RoleName
  phone?: string
  status: Status
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationRelatedRecord {
  type: string
  id?: string
  label: string
  href?: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  category: NotificationCategory
  severity: NotificationSeverity
  priority: NotificationPriority
  title: string
  message: string
  read: boolean
  link?: string
  related?: NotificationRelatedRecord
  createdAt: string
}

export interface AuditLog {
  id: string
  date: string
  userId: string
  userName: string
  module: string
  action: string
  reference?: string
  description: string
}

export type ExportJobStatus = 'preparing' | 'completed' | 'failed'

export type ExportModuleId =
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'distributors'
  | 'sales'
  | 'purchases'
  | 'invoices'
  | 'payments'
  | 'expenses'
  | 'stock'

export interface ExportJob {
  id: string
  fileName: string
  moduleId: ExportModuleId
  moduleLabel: string
  status: ExportJobStatus
  createdAt: string
  completedAt?: string
  rowCount?: number
  errorMessage?: string
  /** CSV text retained so Download works after simulation completes */
  csvContent?: string
}

export interface BusinessSettings {
  businessName: string
  logoUrl?: string
  address: string
  phone: string
  email: string
  gstNumber: string
  pan: string
  invoicePrefix: string
  invoiceStartingNumber: number
  currency: string
  dateFormat: string
  lowStockThreshold: number
  allowNegativeStock: boolean
  paymentMethods: PaymentMethod[]
  taxEnabled: boolean
  /**
   * Max invoice discount % by role. `null` = unlimited.
   * Admin / Super Admin default to unlimited and remain configurable here.
   */
  discountLimits?: Partial<Record<RoleName, number | null>>
  /** When true, confirming a sale that exceeds credit requires prior credit-limit approval */
  enforceCreditLimit?: boolean
  /** Idle minutes before mock session timeout (Security UX) */
  sessionTimeoutMinutes?: number
  /** Default payment terms shown on sales forms */
  salesDefaultPaymentTerms?: string
  /** Default payment terms for purchases */
  purchaseDefaultPaymentTerms?: string
  /** In-app notification preference toggles */
  notificationPrefs?: {
    lowStock: boolean
    newSale: boolean
    paymentDue: boolean
    system: boolean
  }
}

export interface Location {
  id: string
  name: string
  type: 'warehouse' | 'godown' | 'showroom'
  status: Status
}

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom'

export interface DateRange {
  preset: DateRangePreset
  from?: string
  to?: string
}
