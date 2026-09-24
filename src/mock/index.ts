/**
 * Mock data engine public surface.
 *
 * - MockDatabase: seed snapshot (hydrate only)
 * - MockRepositories: live reads/writes via Zustand
 * - MockServices: async API over repositories
 *
 * Prefer repositories/services from app code. Seed arrays are for the database builder.
 */
export {
  createMockDatabase,
  getMockDatabase,
  resetMockDatabase,
  replaceMockDatabase,
  mockDatabaseToStoreSlice,
  MOCK_INITIAL_COUNTERS,
  type MockDatabase,
  type MockDatabaseCounters,
} from '@/mock/database'

export {
  mockRepositories,
  productRepository,
  customerRepository,
  distributorRepository,
  supplierRepository,
  salesRepository,
  purchaseRepository,
  invoiceRepository,
  paymentRepository,
  expenseRepository,
  returnsRepository,
  stockMovementRepository,
  ledgerRepository,
  notificationRepository,
  auditLogRepository,
  userRepository,
  settingsRepository,
  masterRepository,
  type MockRepositories,
} from '@/mock/repositories'

export {
  mockServices,
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
  type MockServices,
} from '@/mock/services'

export {
  applyStock,
  partyBalanceUpdate,
  deriveDocStatus,
  buildInvoiceFromSale,
  syncInvoiceFromSale,
  makeMovement,
  makeLedger,
  applyReturnToSaleBalances,
  applyReturnToPurchaseBalances,
  returnedQtyForSaleProduct,
  returnedQtyForPurchaseProduct,
  cancelSaleSideEffects,
  cancelPurchaseSideEffects,
} from '@/mock/relationships'

export {
  createSampleBusinessDatabase,
  createClearedDemoDatabase,
  summarizeDatabase,
  SAMPLE_BUSINESS_COUNTERS,
} from '@/mock/sample-business'

/** @deprecated Prefer getMockDatabase() — kept for gradual migration */
export * from '@/mock/data'
