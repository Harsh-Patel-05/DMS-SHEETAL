/**
 * Rich “Sample Business Data” for Demo Mode — Sheetal Cool / MP distribution.
 * Deterministic generator so resets are stable across reloads.
 */
import type {
  AppNotification,
  AuditLog,
  Customer,
  Distributor,
  Expense,
  Invoice,
  LedgerEntry,
  Payment,
  Product,
  Purchase,
  PurchaseReturn,
  Sale,
  SalesReturn,
  StockAdjustment,
  StockMovement,
  StockTransfer,
  Supplier,
} from '@/types'
import type { ApprovalRequest } from '@/types/approval'
import type { MockDatabase, MockDatabaseCounters } from '@/mock/database'
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
  seedLocations,
  seedNotifications,
  seedProducts,
  seedRoles,
  seedSettings,
  seedSuppliers,
  seedTransfers,
  seedUnits,
  seedUsers,
} from '@/mock/data'
import { calculateInvoiceTotal, roundMoney } from '@/utils/calculations'
import { normalizeNotification } from '@/utils/notifications'

function clone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value)) as T
}

/** Mulberry32 — stable pseudo-random from seed. */
function rng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length) % list.length]
}

function isoDate(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date(Date.UTC(2026, 8, 16, hour, minute, 0)) // 2026-09-16
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function isoAt(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date(Date.UTC(2026, 8, 16, hour, minute, 0))
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString()
}

const EXTRA_CUSTOMERS: Omit<Customer, 'currentBalance'>[] = [
  {
    id: 'cus_7', type: 'customer', name: 'Jain Electrical Works', mobile: '9827011223',
    email: 'jain.ew@gmail.com', address: '14 Sarafa Bazaar', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AAJFJ2211A1Z3', creditLimit: 120000, openingBalance: 4500,
    paymentTerms: 'Net 21', status: 'active', createdAt: '2025-10-01T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'cus_8', type: 'customer', name: 'Cool World Retail', mobile: '9755544332',
    address: 'AB Road, Scheme 54', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AADCC8899B1Z6', creditLimit: 250000, openingBalance: 0,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-11-12T10:00:00.000Z', updatedAt: '2026-09-08T10:00:00.000Z',
  },
  {
    id: 'cus_9', type: 'customer', name: 'Bharat Fan House', mobile: '9425099887',
    email: 'bharatfans@yahoo.com', address: 'Station Chowk', city: 'Gwalior', state: 'Madhya Pradesh',
    gstNumber: '23AABCB6677C1Z2', creditLimit: 180000, openingBalance: 12000,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-09-20T10:00:00.000Z', updatedAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'cus_10', type: 'customer', name: 'Sagar Home Needs', mobile: '9988123456',
    address: 'Main Market', city: 'Sagar', state: 'Madhya Pradesh',
    creditLimit: 60000, openingBalance: 0,
    paymentTerms: 'Cash', status: 'active', createdAt: '2026-02-01T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: 'cus_11', type: 'customer', name: 'Chambal Traders', mobile: '9826077889',
    email: 'orders@chambaltraders.in', address: 'Transport Nagar', city: 'Morena', state: 'Madhya Pradesh',
    gstNumber: '23AAFCC3344D1Z8', creditLimit: 90000, openingBalance: 3200,
    paymentTerms: 'Net 15', status: 'active', createdAt: '2025-12-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'cus_12', type: 'customer', name: 'Malwa Cool Mart', mobile: '8877665544',
    address: 'Rajwada Circle', city: 'Dhar', state: 'Madhya Pradesh',
    creditLimit: 45000, openingBalance: 0,
    paymentTerms: 'Net 7', status: 'active', createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: 'cus_13', type: 'customer', name: 'Narmada Electricals', mobile: '9425012345',
    email: 'narmada.elec@gmail.com', address: 'Civil Lines', city: 'Hoshangabad', state: 'Madhya Pradesh',
    gstNumber: '23AADFN9900E1Z1', creditLimit: 110000, openingBalance: 8000,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-08-18T10:00:00.000Z', updatedAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'cus_14', type: 'customer', name: 'Vindhya Appliances', mobile: '9755500112',
    address: 'Rewa Road', city: 'Satna', state: 'Madhya Pradesh',
    creditLimit: 70000, openingBalance: 1500,
    paymentTerms: 'Net 21', status: 'inactive', createdAt: '2025-07-01T10:00:00.000Z', updatedAt: '2026-06-01T10:00:00.000Z',
  },
]

const EXTRA_SUPPLIERS: Omit<Supplier, 'currentBalance'>[] = [
  {
    id: 'sup_5', type: 'supplier', name: 'Bajaj Electricals Ltd', companyName: 'Bajaj Electricals Limited',
    contactPerson: 'Rohit Desai', mobile: '9820011223', email: 'channel@bajajelectricals.com',
    address: '45/47, Veer Nariman Road', city: 'Mumbai', state: 'Maharashtra',
    gstNumber: '27AABCB1234F1Z5', pan: 'AABCB1234F', creditLimit: 700000, openingBalance: 0,
    paymentTerms: 'Net 45', status: 'active', createdAt: '2025-06-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'sup_6', type: 'supplier', name: 'Usha International', companyName: 'Usha International Ltd',
    contactPerson: 'Meena Kapoor', mobile: '9811122334', email: 'dealers@usha.com',
    address: 'Plot 15, Sector 32', city: 'Gurgaon', state: 'Haryana',
    gstNumber: '06AAACU5678G1Z9', pan: 'AAACU5678G', creditLimit: 500000, openingBalance: 8500,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-07-01T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'sup_7', type: 'supplier', name: 'Indore Packing Supplies', companyName: 'Indore Packing Supplies',
    contactPerson: 'Farhan Qureshi', mobile: '9826099001', email: 'sales@indorepack.in',
    address: 'Lasudia Mori', city: 'Indore', state: 'Madhya Pradesh',
    gstNumber: '23AAFPI7788H1Z4', pan: 'AAFPI7788H', creditLimit: 80000, openingBalance: 0,
    paymentTerms: 'Net 15', status: 'active', createdAt: '2025-09-01T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z',
  },
]

const EXTRA_DISTRIBUTORS: Omit<Distributor, 'currentBalance'>[] = [
  {
    id: 'dis_4', type: 'distributor', name: 'Bundelkhand Cool Chain', companyName: 'Bundelkhand Cool Chain Pvt Ltd',
    contactPerson: 'Deepak Tiwari', mobile: '9425123456', email: 'deepak@bccdist.in',
    address: 'Industrial Area', city: 'Jhansi', state: 'Uttar Pradesh',
    gstNumber: '09AABCB9900J1Z2', pan: 'AABCB9900J', creditLimit: 400000, openingBalance: 22000,
    paymentTerms: 'Net 45', status: 'active', createdAt: '2025-08-01T10:00:00.000Z', updatedAt: '2026-09-04T10:00:00.000Z',
  },
  {
    id: 'dis_5', type: 'distributor', name: 'Chhattisgarh Agencies', companyName: 'Chhattisgarh Agencies',
    contactPerson: 'Sunita Verma', mobile: '9770011223', email: 'sunita@cgagencies.in',
    address: 'Pandri Market', city: 'Raipur', state: 'Chhattisgarh',
    gstNumber: '22AADCC1122K1Z7', pan: 'AADCC1122K', creditLimit: 320000, openingBalance: 0,
    paymentTerms: 'Net 30', status: 'active', createdAt: '2025-10-10T10:00:00.000Z', updatedAt: '2026-08-28T10:00:00.000Z',
  },
]

const METHODS = ['cash', 'upi', 'bank_transfer', 'cheque', 'card'] as const
const EXPENSE_CATS = ['rent', 'salary', 'transport', 'electricity', 'maintenance', 'marketing', 'office', 'other'] as const

export const SAMPLE_BUSINESS_COUNTERS: MockDatabaseCounters = {
  sale: 1120,
  purchase: 2145,
  payment: 420,
  return: 128,
  transfer: 118,
  adjustment: 28,
  approval: 1020,
}

/** Full realistic Indian cooling-distribution sample dataset. */
export function createSampleBusinessDatabase(): MockDatabase {
  const rand = rng(0x5fee7a1)

  const products: Product[] = clone(seedProducts).map((p) => ({
    ...p,
    currentStock: p.openingStock + Math.floor(rand() * 40) - 10,
  }))

  const customers: Customer[] = [
    ...clone(seedCustomers).map((c) => ({ ...c, currentBalance: c.openingBalance })),
    ...EXTRA_CUSTOMERS.map((c) => ({ ...c, currentBalance: c.openingBalance })),
  ]
  const suppliers: Supplier[] = [
    ...clone(seedSuppliers).map((s) => ({ ...s, currentBalance: s.openingBalance })),
    ...EXTRA_SUPPLIERS.map((s) => ({ ...s, currentBalance: s.openingBalance })),
  ]
  const distributors: Distributor[] = [
    ...clone(seedDistributors).map((d) => ({ ...d, currentBalance: d.openingBalance })),
    ...EXTRA_DISTRIBUTORS.map((d) => ({ ...d, currentBalance: d.openingBalance })),
  ]

  const stockMap = new Map(products.map((p) => [p.id, p.currentStock]))
  const custBal = new Map(customers.map((c) => [c.id, c.currentBalance]))
  const supBal = new Map(suppliers.map((s) => [s.id, s.currentBalance]))
  const distBal = new Map(distributors.map((d) => [d.id, d.currentBalance]))

  const sales: Sale[] = []
  const purchases: Purchase[] = []
  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const movements: StockMovement[] = []
  const ledger: LedgerEntry[] = []
  const expenses: Expense[] = []
  const salesReturns: SalesReturn[] = []
  const purchaseReturns: PurchaseReturn[] = []
  const adjustments: StockAdjustment[] = []
  const transfers: StockTransfer[] = clone(seedTransfers)
  const notifications: AppNotification[] = []
  const auditLogs: AuditLog[] = []

  let saleNo = 1001
  let purchaseNo = 2001
  let payNo = 301
  let retNo = 101
  let adjNo = 16
  let movSeq = 1
  let ledSeq = 1

  const gstFor = (product: Product) => {
    const id = product.gstRateId
    if (id.includes('12')) return 12
    if (id.includes('5') && !id.includes('18')) return 5
    return 18
  }

  // Purchases first (stock in)
  for (let i = 0; i < 28; i++) {
    const daysAgo = 85 - Math.floor(i * 2.8) + Math.floor(rand() * 2)
    const supplier = pick(rand, suppliers.filter((s) => s.status === 'active'))
    const lineCount = 1 + Math.floor(rand() * 3)
    const items = []
    for (let L = 0; L < lineCount; L++) {
      const product = pick(rand, products)
      const qty = 5 + Math.floor(rand() * 35)
      const rate = product.purchasePrice
      const discount = rand() > 0.7 ? roundMoney(rate * qty * 0.02) : 0
      items.push({
        id: `pli_sb_${i}_${L}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        rate,
        discount,
        gstRate: gstFor(product),
        amount: roundMoney(qty * rate - discount),
      })
    }
    const paidRatio = rand()
    const paidHint = paidRatio > 0.55 ? 1 : paidRatio > 0.25 ? 0.4 + rand() * 0.4 : 0
    const totals = calculateInvoiceTotal({
      lines: items.map((l) => ({ qty: l.quantity, rate: l.rate, discount: l.discount, gstRate: l.gstRate })),
      otherCharges: rand() > 0.8 ? 500 : 0,
      paid: 0,
    })
    const paid = roundMoney(totals.grandTotal * paidHint)
    const due = roundMoney(totals.grandTotal - paid)
    const status = due <= 0.001 ? 'paid' : paid > 0 ? 'partial' : 'confirmed'
    const pno = `PO-${purchaseNo++}`
    const date = isoDate(daysAgo)
    const createdAt = isoAt(daysAgo, 10 + Math.floor(rand() * 6))
    const purchase: Purchase = {
      id: `pur_sb_${i}`,
      purchaseNo: pno,
      date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      invoiceNo: `${supplier.name.slice(0, 3).toUpperCase()}/26/${1000 + i}`,
      items,
      ...totals,
      paid,
      due,
      status,
      createdAt,
      updatedAt: createdAt,
    }
    purchases.push(purchase)

    for (const line of items) {
      const bal = (stockMap.get(line.productId) ?? 0) + line.quantity
      stockMap.set(line.productId, bal)
      movements.push({
        id: `mov_sb_${movSeq++}`,
        date,
        productId: line.productId,
        productName: line.productName,
        reference: pno,
        type: 'purchase',
        quantityIn: line.quantity,
        quantityOut: 0,
        balance: bal,
        createdAt,
      })
    }

    const nextSup = (supBal.get(supplier.id) ?? 0) + due
    supBal.set(supplier.id, nextSup)
    ledger.push({
      id: `led_sb_${ledSeq++}`,
      date,
      partyType: 'supplier',
      partyId: supplier.id,
      partyName: supplier.name,
      reference: pno,
      description: 'Purchase invoice',
      debit: 0,
      credit: totals.grandTotal,
      balance: nextSup,
      createdAt,
    })
    if (paid > 0) {
      payNo++
      const pmt: Payment = {
        id: `pay_sb_p_${i}`,
        paymentNo: `PAY-P-${String(payNo).padStart(4, '0')}`,
        type: 'paid',
        partyType: 'supplier',
        partyId: supplier.id,
        partyName: supplier.name,
        date,
        amount: paid,
        method: pick(rand, [...METHODS]),
        reference: rand() > 0.5 ? `NEFT/HDFC/${40000 + i}` : undefined,
        createdAt,
      }
      payments.push(pmt)
      ledger.push({
        id: `led_sb_${ledSeq++}`,
        date,
        partyType: 'supplier',
        partyId: supplier.id,
        partyName: supplier.name,
        reference: pmt.paymentNo,
        description: 'Payment against purchase',
        debit: paid,
        credit: 0,
        balance: nextSup,
        createdAt,
      })
    }
  }

  // Sales
  for (let i = 0; i < 52; i++) {
    const daysAgo = 80 - Math.floor(i * 1.45) + Math.floor(rand() * 2)
    const customer = pick(rand, customers.filter((c) => c.status === 'active'))
    const lineCount = 1 + Math.floor(rand() * 3)
    const items = []
    for (let L = 0; L < lineCount; L++) {
      const product = pick(rand, products)
      const qty = 1 + Math.floor(rand() * 12)
      const rate = product.sellingPrice
      const discount = rand() > 0.75 ? roundMoney(50 + rand() * 400) : 0
      items.push({
        id: `sli_sb_${i}_${L}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        rate,
        discount,
        gstRate: gstFor(product),
        amount: roundMoney(qty * rate - discount),
      })
    }
    const paidRatio = rand()
    const paidHint = paidRatio > 0.5 ? 1 : paidRatio > 0.2 ? 0.25 + rand() * 0.5 : 0
    const totals = calculateInvoiceTotal({
      lines: items.map((l) => ({ qty: l.quantity, rate: l.rate, discount: l.discount, gstRate: l.gstRate })),
      otherCharges: rand() > 0.85 ? 200 : 0,
      paid: 0,
    })
    const paid = roundMoney(totals.grandTotal * paidHint)
    const due = roundMoney(totals.grandTotal - paid)
    const status = due <= 0.001 ? 'paid' : paid > 0 ? 'partial' : 'confirmed'
    const invNo = `SC-${saleNo++}`
    const date = isoDate(daysAgo)
    const createdAt = isoAt(daysAgo, 9 + Math.floor(rand() * 8), Math.floor(rand() * 50))
    const sale: Sale = {
      id: `sal_sb_${i}`,
      invoiceNo: invNo,
      date,
      customerId: customer.id,
      customerName: customer.name,
      items,
      ...totals,
      paid,
      due,
      status,
      notes: rand() > 0.9 ? 'Seasonal cooler demand' : undefined,
      createdAt,
      updatedAt: createdAt,
    }
    sales.push(sale)

    for (const line of items) {
      const bal = Math.max(0, (stockMap.get(line.productId) ?? 0) - line.quantity)
      stockMap.set(line.productId, bal)
      movements.push({
        id: `mov_sb_${movSeq++}`,
        date,
        productId: line.productId,
        productName: line.productName,
        reference: invNo,
        type: 'sale',
        quantityIn: 0,
        quantityOut: line.quantity,
        balance: bal,
        createdAt,
      })
    }

    const nextCust = (custBal.get(customer.id) ?? 0) + due
    custBal.set(customer.id, nextCust)
    ledger.push({
      id: `led_sb_${ledSeq++}`,
      date,
      partyType: 'customer',
      partyId: customer.id,
      partyName: customer.name,
      reference: invNo,
      description: 'Sale invoice',
      debit: totals.grandTotal,
      credit: 0,
      balance: nextCust,
      createdAt,
    })

    invoices.push({
      id: `inv_sb_${i}`,
      invoiceNo: invNo,
      saleId: sale.id,
      date,
      customerId: customer.id,
      customerName: customer.name,
      customerAddress: `${customer.address}, ${customer.city}, ${customer.state}`,
      customerGst: customer.gstNumber,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      cgst: sale.cgst,
      sgst: sale.sgst,
      igst: sale.igst,
      otherCharges: sale.otherCharges,
      roundOff: sale.roundOff,
      grandTotal: sale.grandTotal,
      paid: sale.paid,
      balance: sale.due,
      status: sale.status,
      createdAt,
    })

    if (paid > 0) {
      payNo++
      const pmt: Payment = {
        id: `pay_sb_r_${i}`,
        paymentNo: `PAY-R-${String(payNo).padStart(4, '0')}`,
        type: 'received',
        partyType: 'customer',
        partyId: customer.id,
        partyName: customer.name,
        date,
        amount: paid,
        method: pick(rand, [...METHODS]),
        reference: rand() > 0.4 ? `UPI/AXIS/${880000 + i}` : undefined,
        allocations: [{ saleId: sale.id, invoiceNo: invNo, amount: paid }],
        unallocated: 0,
        createdAt,
      }
      payments.push(pmt)
      ledger.push({
        id: `led_sb_${ledSeq++}`,
        date,
        partyType: 'customer',
        partyId: customer.id,
        partyName: customer.name,
        reference: pmt.paymentNo,
        description: `Payment received · ${invNo}`,
        debit: 0,
        credit: paid,
        balance: nextCust,
        createdAt,
      })
    }

    if (i % 11 === 0 && items[0]) {
      const line = items[0]
      const rq = Math.max(1, Math.floor(line.quantity / 3))
      const amount = roundMoney((line.amount / line.quantity) * rq)
      const rno = `SR-${retNo++}`
      salesReturns.push({
        id: `sret_sb_${i}`,
        returnNo: rno,
        date: isoDate(Math.max(0, daysAgo - 2)),
        saleId: sale.id,
        invoiceNo: invNo,
        customerId: customer.id,
        customerName: customer.name,
        productId: line.productId,
        productName: line.productName,
        soldQuantity: line.quantity,
        returnQuantity: rq,
        rate: line.rate,
        amount,
        reason: pick(rand, ['Damaged packaging', 'Wrong model delivered', 'Customer cancelled']),
        status: 'confirmed',
        createdAt: isoAt(Math.max(0, daysAgo - 2), 14),
      })
      const bal = (stockMap.get(line.productId) ?? 0) + rq
      stockMap.set(line.productId, bal)
      movements.push({
        id: `mov_sb_${movSeq++}`,
        date: isoDate(Math.max(0, daysAgo - 2)),
        productId: line.productId,
        productName: line.productName,
        reference: rno,
        type: 'sales_return',
        quantityIn: rq,
        quantityOut: 0,
        balance: bal,
        notes: `Return against ${invNo}`,
        createdAt: isoAt(Math.max(0, daysAgo - 2), 14),
      })
      const cb = Math.max(0, (custBal.get(customer.id) ?? 0) - amount)
      custBal.set(customer.id, cb)
      ledger.push({
        id: `led_sb_${ledSeq++}`,
        date: isoDate(Math.max(0, daysAgo - 2)),
        partyType: 'customer',
        partyId: customer.id,
        partyName: customer.name,
        reference: rno,
        description: `Sales return · ${invNo}`,
        debit: 0,
        credit: amount,
        balance: cb,
        createdAt: isoAt(Math.max(0, daysAgo - 2), 14),
      })
    }
  }

  // A few purchase returns
  for (let i = 0; i < 4; i++) {
    const purchase = purchases[i * 5]
    if (!purchase) continue
    const line = purchase.items[0]
    const rq = Math.max(1, Math.floor(line.quantity / 5))
    const amount = roundMoney((line.amount / line.quantity) * rq)
    const rno = `PR-${retNo++}`
    purchaseReturns.push({
      id: `pret_sb_${i}`,
      returnNo: rno,
      date: isoDate(20 - i * 4),
      purchaseId: purchase.id,
      purchaseNo: purchase.purchaseNo,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      productId: line.productId,
      productName: line.productName,
      purchaseQuantity: line.quantity,
      returnQuantity: rq,
      rate: line.rate,
      amount,
      reason: 'Transit damage / short supply',
      status: 'confirmed',
      createdAt: isoAt(20 - i * 4, 12),
    })
    const bal = Math.max(0, (stockMap.get(line.productId) ?? 0) - rq)
    stockMap.set(line.productId, bal)
    movements.push({
      id: `mov_sb_${movSeq++}`,
      date: isoDate(20 - i * 4),
      productId: line.productId,
      productName: line.productName,
      reference: rno,
      type: 'purchase_return',
      quantityIn: 0,
      quantityOut: rq,
      balance: bal,
      createdAt: isoAt(20 - i * 4, 12),
    })
    const sb = Math.max(0, (supBal.get(purchase.supplierId) ?? 0) - amount)
    supBal.set(purchase.supplierId, sb)
    ledger.push({
      id: `led_sb_${ledSeq++}`,
      date: isoDate(20 - i * 4),
      partyType: 'supplier',
      partyId: purchase.supplierId,
      partyName: purchase.supplierName,
      reference: rno,
      description: `Purchase return · ${purchase.purchaseNo}`,
      debit: amount,
      credit: 0,
      balance: sb,
      createdAt: isoAt(20 - i * 4, 12),
    })
  }

  // Distributor ledger activity
  for (let i = 0; i < 8; i++) {
    const d = pick(rand, distributors)
    const amt = roundMoney(15000 + rand() * 80000)
    const daysAgo = 60 - i * 7
    const next = (distBal.get(d.id) ?? 0) + (i % 2 === 0 ? amt * 0.3 : -amt * 0.2)
    distBal.set(d.id, roundMoney(next))
    ledger.push({
      id: `led_sb_d_${ledSeq++}`,
      date: isoDate(daysAgo),
      partyType: 'distributor',
      partyId: d.id,
      partyName: d.name,
      reference: `DIST-${i + 1}`,
      description: i % 2 === 0 ? 'Distributor stock billing' : 'Collection from distributor',
      debit: i % 2 === 0 ? amt : 0,
      credit: i % 2 === 0 ? 0 : amt,
      balance: distBal.get(d.id)!,
      createdAt: isoAt(daysAgo, 11),
    })
  }

  // Expenses
  for (let i = 0; i < 18; i++) {
    const cat = pick(rand, [...EXPENSE_CATS])
    const daysAgo = 70 - i * 3
    expenses.push({
      id: `exp_sb_${i}`,
      date: isoDate(daysAgo),
      category: cat,
      description: pick(rand, [
        'Godown rent — Sanwer Road',
        'Driver salary — fleet A',
        'Diesel for delivery van',
        'MPPKVVCL electricity bill',
        'Cooler demo stall branding',
        'Office stationery & courier',
        'AC service — showroom',
        'WhatsApp Business ads',
      ]),
      amount: roundMoney(800 + rand() * 45000),
      paymentMethod: pick(rand, [...METHODS]),
      reference: rand() > 0.5 ? `EXP/${2026}${i}` : undefined,
      createdAt: isoAt(daysAgo, 16),
    })
  }

  // Stock adjustments
  for (let i = 0; i < 6; i++) {
    const product = pick(rand, products)
    const qty = 1 + Math.floor(rand() * 5)
    const increase = rand() > 0.4
    const daysAgo = 40 - i * 5
    const bal = (stockMap.get(product.id) ?? 0) + (increase ? qty : -qty)
    stockMap.set(product.id, Math.max(0, bal))
    adjustments.push({
      id: `adj_sb_${i}`,
      date: isoDate(daysAgo),
      productId: product.id,
      productName: product.name,
      adjustmentType: increase ? 'increase' : 'decrease',
      quantity: qty,
      reason: increase ? 'Physical count surplus' : 'Damaged / write-off',
      notes: `ADJ-${adjNo++}`,
      createdAt: isoAt(daysAgo, 17),
    })
    movements.push({
      id: `mov_sb_${movSeq++}`,
      date: isoDate(daysAgo),
      productId: product.id,
      productName: product.name,
      reference: `ADJ-${adjNo}`,
      type: 'adjustment',
      quantityIn: increase ? qty : 0,
      quantityOut: increase ? 0 : qty,
      balance: stockMap.get(product.id)!,
      notes: adjustments[adjustments.length - 1].reason,
      createdAt: isoAt(daysAgo, 17),
    })
  }

  // Apply stock / balances back
  for (const p of products) {
    p.currentStock = Math.max(0, stockMap.get(p.id) ?? p.currentStock)
    p.updatedAt = isoAt(0, 8)
  }
  for (const c of customers) c.currentBalance = roundMoney(custBal.get(c.id) ?? c.currentBalance)
  for (const s of suppliers) s.currentBalance = roundMoney(supBal.get(s.id) ?? s.currentBalance)
  for (const d of distributors) d.currentBalance = roundMoney(distBal.get(d.id) ?? d.currentBalance)

  // Notifications
  const lowStock = products.filter((p) => p.currentStock <= p.minimumStock).slice(0, 5)
  for (const p of lowStock) {
    notifications.push(
      normalizeNotification({
        id: `ntf_sb_ls_${p.id}`,
        type: 'low_stock',
        severity: p.currentStock <= 5 ? 'critical' : 'warning',
        title: p.currentStock <= 5 ? 'Critical stock alert' : 'Low stock alert',
        message: `${p.name} is at ${p.currentStock} (min ${p.minimumStock}).`,
        read: false,
        link: '/inventory/low-stock',
        related: { type: 'product', id: p.id, label: p.sku, href: `/master/products/${p.id}` },
        createdAt: isoAt(1, 8),
      }),
    )
  }
  for (const s of sales.slice(0, 8)) {
    notifications.push(
      normalizeNotification({
        id: `ntf_sb_sale_${s.id}`,
        type: 'new_sale',
        severity: 'success',
        title: 'Sale confirmed',
        message: `Invoice ${s.invoiceNo} for ${s.customerName}`,
        read: rand() > 0.4,
        link: '/transactions/sales',
        related: { type: 'sale', id: s.id, label: s.invoiceNo, href: `/transactions/sales/${s.id}/edit` },
        createdAt: s.createdAt,
      }),
    )
  }
  notifications.push(
    normalizeNotification({
      id: 'ntf_sb_demo',
      type: 'system',
      severity: 'info',
      title: 'Sample business data loaded',
      message: 'Sheetal Cool MP distribution sample — sales, purchases, ledgers, and stock are ready for demo.',
      read: false,
      link: '/admin/demo',
      createdAt: isoAt(0, 7),
    }),
  )
  notifications.push(...clone(seedNotifications).slice(0, 3))

  // Audit trail
  const actors = clone(seedUsers)
  for (let i = 0; i < 48; i++) {
    const user = pick(rand, actors)
    const daysAgo = Math.floor(i * 1.5)
    auditLogs.push({
      id: `aud_sb_${i}`,
      date: isoAt(daysAgo, 8 + (i % 10), (i * 7) % 60),
      userId: user.id,
      userName: user.name,
      module: pick(rand, ['Sales', 'Purchase', 'Payments', 'Stock', 'Auth', 'Customers', 'Reports', 'Admin']),
      action: pick(rand, ['Created', 'Updated', 'Confirmed', 'Cancelled', 'Exported', 'Login', 'Viewed']),
      reference: i % 3 === 0 ? sales[i % sales.length]?.invoiceNo : purchases[i % purchases.length]?.purchaseNo,
      description: pick(rand, [
        'Confirmed sale invoice',
        'Recorded supplier payment',
        'Adjusted warehouse stock',
        'Exported GST summary',
        'Updated customer credit limit',
        'Logged in from Indore office',
        'Approved discount request',
      ]),
    })
  }
  auditLogs.push(...clone(seedAuditLogs).slice(0, 5))

  const settings = clone(seedSettings)
  settings.businessName = 'Sheetal Cool Distribution'
  settings.address = 'Sector E, Sanwer Road Industrial Area, Indore, Madhya Pradesh 452015'
  settings.phone = '0731-4982100'
  settings.email = 'demo@sheetalcool.in'
  settings.gstNumber = '23AADFS9012C1Z6'

  const approvals: ApprovalRequest[] = clone(seedApprovals)

  // Sort newest first for UI
  sales.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  purchases.sort((a, b) => b.date.localeCompare(a.date))
  invoices.sort((a, b) => b.date.localeCompare(a.date))
  payments.sort((a, b) => b.date.localeCompare(a.date))
  movements.sort((a, b) => b.date.localeCompare(a.date))
  ledger.sort((a, b) => b.date.localeCompare(a.date))
  auditLogs.sort((a, b) => b.date.localeCompare(a.date))
  notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    products,
    customers,
    distributors,
    suppliers,
    sales,
    purchases,
    invoices,
    payments,
    expenses: [...expenses, ...clone(seedExpenses)].sort((a, b) => b.date.localeCompare(a.date)),
    salesReturns,
    purchaseReturns,
    stockMovements: movements,
    ledgerEntries: ledger,
    notifications,
    auditLogs,
    users: clone(seedUsers).map((u, idx) => ({
      ...u,
      lastLogin: isoAt(idx === 0 ? 0 : idx * 2, 9 + idx),
    })),
    settings,
    categories: clone(seedCategories),
    brands: clone(seedBrands),
    units: clone(seedUnits),
    gstRates: clone(seedGstRates),
    roles: clone(seedRoles),
    locations: clone(seedLocations),
    adjustments: [...adjustments, ...clone(seedAdjustments)],
    transfers,
    approvals,
    exportJobs: clone(seedExports),
    counters: { ...SAMPLE_BUSINESS_COUNTERS },
  }
}

/** Masters retained; transactional demo data emptied and balances reset to opening. */
export function createClearedDemoDatabase(): MockDatabase {
  const products = clone(seedProducts).map((p) => ({
    ...p,
    currentStock: p.openingStock,
    updatedAt: isoAt(0, 8),
  }))
  const customers = clone(seedCustomers).map((c) => ({ ...c, currentBalance: c.openingBalance }))
  const distributors = clone(seedDistributors).map((d) => ({ ...d, currentBalance: d.openingBalance }))
  const suppliers = clone(seedSuppliers).map((s) => ({ ...s, currentBalance: s.openingBalance }))

  return {
    products,
    customers,
    distributors,
    suppliers,
    sales: [],
    purchases: [],
    invoices: [],
    payments: [],
    expenses: [],
    salesReturns: [],
    purchaseReturns: [],
    stockMovements: [],
    ledgerEntries: [],
    notifications: [
      normalizeNotification({
        id: 'ntf_cleared',
        type: 'system',
        severity: 'info',
        title: 'Demo data cleared',
        message: 'Transactional records were cleared. Masters, users, and roles were kept.',
        read: false,
        link: '/admin/demo',
        createdAt: isoAt(0, 8),
      }),
    ],
    auditLogs: [
      {
        id: 'aud_cleared',
        date: isoAt(0, 8),
        userId: 'system',
        userName: 'System',
        module: 'Admin',
        action: 'Cleared',
        description: 'Demo transactional data cleared',
      },
    ],
    users: clone(seedUsers),
    settings: clone(seedSettings),
    categories: clone(seedCategories),
    brands: clone(seedBrands),
    units: clone(seedUnits),
    gstRates: clone(seedGstRates),
    roles: clone(seedRoles),
    locations: clone(seedLocations),
    adjustments: [],
    transfers: [],
    approvals: [],
    exportJobs: [],
    counters: {
      sale: 1000,
      purchase: 2000,
      payment: 300,
      return: 100,
      transfer: 100,
      adjustment: 10,
      approval: 1000,
    },
  }
}

/** Summary counts for Demo Mode UI. */
export function summarizeDatabase(db: MockDatabase) {
  return {
    products: db.products.length,
    customers: db.customers.length,
    distributors: db.distributors.length,
    suppliers: db.suppliers.length,
    sales: db.sales.length,
    purchases: db.purchases.length,
    invoices: db.invoices.length,
    payments: db.payments.length,
    expenses: db.expenses.length,
    ledger: db.ledgerEntries.length,
    movements: db.stockMovements.length,
    returns: db.salesReturns.length + db.purchaseReturns.length,
    users: db.users.length,
    notifications: db.notifications.length,
    auditLogs: db.auditLogs.length,
  }
}
