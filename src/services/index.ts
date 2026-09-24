/**
 * Application services — thin re-export of MockServices.
 * Swap this file later for real HTTP clients without touching pages.
 */
export {
  authService,
  productService,
  masterService,
  partyService,
  purchaseService,
  salesService,
  invoiceService,
  paymentService,
  inventoryService,
  returnsService,
  expenseService,
  ledgerService,
  adminService,
  searchService,
  mockServices,
  type MockServices,
} from '@/mock/services'

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
} from '@/mock/services'
