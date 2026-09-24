/**
 * Relationship consistency helpers for mock transactional graphs.
 *
 * Sale → Customer → Items → Product → Invoice → Payment/Ledger → Stock Movement
 * Purchase → Supplier → Items → Product → Stock Movement → Ledger
 * Return → Original TX → Product → Stock → Ledger (+ due/invoice sync)
 */
import type {
  Customer,
  DocStatus,
  Invoice,
  LedgerEntry,
  Product,
  Purchase,
  Sale,
  SalesReturn,
  PurchaseReturn,
  StockMovement,
  Supplier,
} from '@/types'
import { generateId, nowISO, todayISO } from '@/utils/cn'
import { roundMoney } from '@/utils/calculations'

export function deriveDocStatus(paid: number, due: number, fallback: DocStatus = 'confirmed'): DocStatus {
  if (due <= 0.001) return 'paid'
  if (paid > 0.001) return 'partial'
  if (fallback === 'draft' || fallback === 'cancelled') return fallback
  return 'confirmed'
}

export function partyBalanceUpdate<T extends { id: string; currentBalance: number; updatedAt: string }>(
  list: T[],
  id: string,
  delta: number,
): T[] {
  return list.map((p) =>
    p.id === id ? { ...p, currentBalance: roundMoney(p.currentBalance + delta), updatedAt: nowISO() } : p,
  )
}

export function applyStock(
  products: Product[],
  productId: string,
  delta: number,
  allowNegative: boolean,
): { products: Product[]; ok: boolean; message?: string; product?: Product } {
  const idx = products.findIndex((p) => p.id === productId)
  if (idx < 0) return { products, ok: false, message: 'Product not found' }
  const product = products[idx]
  const next = product.currentStock + delta
  if (!allowNegative && next < 0) {
    return {
      products,
      ok: false,
      message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`,
    }
  }
  const updated = { ...product, currentStock: next, updatedAt: nowISO() }
  const copy = [...products]
  copy[idx] = updated
  return { products: copy, ok: true, product: updated }
}

export function buildInvoiceFromSale(sale: Sale, customer: Customer, existingId?: string): Invoice {
  return {
    id: existingId ?? generateId('inv'),
    invoiceNo: sale.invoiceNo,
    saleId: sale.id,
    date: sale.date,
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
    createdAt: sale.createdAt,
  }
}

/** Keep invoice payment fields aligned with its parent sale. */
export function syncInvoiceFromSale(invoices: Invoice[], sale: Sale): Invoice[] {
  return invoices.map((inv) =>
    inv.saleId === sale.id
      ? {
          ...inv,
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
          date: sale.date,
          customerId: sale.customerId,
          customerName: sale.customerName,
        }
      : inv,
  )
}

export function makeMovement(input: {
  date: string
  productId: string
  productName: string
  reference: string
  type: StockMovement['type']
  quantityIn: number
  quantityOut: number
  balance: number
  notes?: string
}): StockMovement {
  return {
    id: generateId('mov'),
    date: input.date,
    productId: input.productId,
    productName: input.productName,
    reference: input.reference,
    type: input.type,
    quantityIn: input.quantityIn,
    quantityOut: input.quantityOut,
    balance: input.balance,
    notes: input.notes,
    createdAt: nowISO(),
  }
}

export function makeLedger(input: {
  date: string
  partyType: LedgerEntry['partyType']
  partyId: string
  partyName: string
  reference: string
  description: string
  debit: number
  credit: number
  balance: number
}): LedgerEntry {
  return {
    id: generateId('led'),
    date: input.date,
    partyType: input.partyType,
    partyId: input.partyId,
    partyName: input.partyName,
    reference: input.reference,
    description: input.description,
    debit: input.debit,
    credit: input.credit,
    balance: input.balance,
    createdAt: nowISO(),
  }
}

/** Apply a credit-note style adjustment to sale paid/due after a return. */
export function applyReturnToSaleBalances(sale: Sale, returnAmount: number): Sale {
  let due = sale.due
  let paid = sale.paid
  let remaining = roundMoney(returnAmount)

  if (due > 0) {
    const againstDue = Math.min(due, remaining)
    due = roundMoney(due - againstDue)
    remaining = roundMoney(remaining - againstDue)
  }
  if (remaining > 0 && paid > 0) {
    const againstPaid = Math.min(paid, remaining)
    paid = roundMoney(paid - againstPaid)
  }

  const status = sale.status === 'cancelled' ? sale.status : deriveDocStatus(paid, due, sale.status)
  return { ...sale, due, paid, status, updatedAt: nowISO() }
}

export function applyReturnToPurchaseBalances(purchase: Purchase, returnAmount: number): Purchase {
  let due = purchase.due
  let paid = purchase.paid
  let remaining = roundMoney(returnAmount)

  if (due > 0) {
    const againstDue = Math.min(due, remaining)
    due = roundMoney(due - againstDue)
    remaining = roundMoney(remaining - againstDue)
  }
  if (remaining > 0 && paid > 0) {
    paid = roundMoney(paid - Math.min(paid, remaining))
  }

  const status =
    purchase.status === 'cancelled' ? purchase.status : deriveDocStatus(paid, due, purchase.status)
  return { ...purchase, due, paid, status, updatedAt: nowISO() }
}

export function returnedQtyForSaleProduct(
  returns: SalesReturn[],
  saleId: string,
  productId: string,
): number {
  return returns
    .filter((r) => r.saleId === saleId && r.productId === productId && r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.returnQuantity, 0)
}

export function returnedQtyForPurchaseProduct(
  returns: PurchaseReturn[],
  purchaseId: string,
  productId: string,
): number {
  return returns
    .filter((r) => r.purchaseId === purchaseId && r.productId === productId && r.status !== 'cancelled')
    .reduce((sum, r) => sum + r.returnQuantity, 0)
}

export function cancelSaleSideEffects(input: {
  sale: Sale
  products: Product[]
  movements: StockMovement[]
  customers: Customer[]
  invoices: Invoice[]
  ledger: LedgerEntry[]
  allowNegativeStock: boolean
}): {
  ok: boolean
  message?: string
  products: Product[]
  movements: StockMovement[]
  customers: Customer[]
  invoices: Invoice[]
  ledger: LedgerEntry[]
  salesPatch: Partial<Sale>
} {
  const { sale } = input
  let { products, movements, customers, invoices, ledger } = input
  const ts = nowISO()
  const date = todayISO()

  if (sale.status !== 'draft') {
    for (const line of sale.items) {
      const res = applyStock(products, line.productId, line.quantity, true)
      if (!res.ok) return { ok: false, message: res.message, products, movements, customers, invoices, ledger, salesPatch: {} }
      products = res.products
      movements = [
        makeMovement({
          date,
          productId: line.productId,
          productName: line.productName,
          reference: sale.invoiceNo,
          type: 'sales_return',
          quantityIn: line.quantity,
          quantityOut: 0,
          balance: res.product!.currentStock,
          notes: 'Sale cancelled — stock restored',
        }),
        ...movements,
      ]
    }

    // Reverse outstanding only (matches confirm which added +due)
    customers = partyBalanceUpdate(customers, sale.customerId, -sale.due)
    const bal = customers.find((c) => c.id === sale.customerId)?.currentBalance ?? 0

    ledger = [
      makeLedger({
        date,
        partyType: 'customer',
        partyId: sale.customerId,
        partyName: sale.customerName,
        reference: sale.invoiceNo,
        description: 'Sale cancelled — reverse invoice',
        debit: 0,
        credit: sale.grandTotal,
        balance: bal,
      }),
      ...ledger,
    ]
    if (sale.paid > 0) {
      ledger = [
        makeLedger({
          date,
          partyType: 'customer',
          partyId: sale.customerId,
          partyName: sale.customerName,
          reference: sale.invoiceNo,
          description: 'Sale cancelled — reverse payment allocation',
          debit: sale.paid,
          credit: 0,
          balance: bal,
        }),
        ...ledger,
      ]
    }

    invoices = invoices.map((i) =>
      i.saleId === sale.id ? { ...i, status: 'cancelled' as DocStatus, balance: 0 } : i,
    )
  }

  return {
    ok: true,
    products,
    movements,
    customers,
    invoices,
    ledger,
    salesPatch: { status: 'cancelled', due: 0, updatedAt: ts },
  }
}

export function cancelPurchaseSideEffects(input: {
  purchase: Purchase
  products: Product[]
  movements: StockMovement[]
  suppliers: Supplier[]
  ledger: LedgerEntry[]
  allowNegativeStock: boolean
}): {
  ok: boolean
  message?: string
  products: Product[]
  movements: StockMovement[]
  suppliers: Supplier[]
  ledger: LedgerEntry[]
  purchasePatch: Partial<Purchase>
} {
  const { purchase } = input
  let { products, movements, suppliers, ledger } = input
  const ts = nowISO()
  const date = todayISO()

  if (purchase.status !== 'draft') {
    for (const line of purchase.items) {
      const res = applyStock(products, line.productId, -line.quantity, input.allowNegativeStock)
      if (!res.ok) {
        return { ok: false, message: res.message, products, movements, suppliers, ledger, purchasePatch: {} }
      }
      products = res.products
      movements = [
        makeMovement({
          date,
          productId: line.productId,
          productName: line.productName,
          reference: purchase.purchaseNo,
          type: 'purchase_return',
          quantityIn: 0,
          quantityOut: line.quantity,
          balance: res.product!.currentStock,
          notes: 'Purchase cancelled — stock reversed',
        }),
        ...movements,
      ]
    }

    suppliers = partyBalanceUpdate(suppliers, purchase.supplierId, -purchase.due)
    const bal = suppliers.find((s) => s.id === purchase.supplierId)?.currentBalance ?? 0

    ledger = [
      makeLedger({
        date,
        partyType: 'supplier',
        partyId: purchase.supplierId,
        partyName: purchase.supplierName,
        reference: purchase.purchaseNo,
        description: 'Purchase cancelled — reverse invoice',
        debit: purchase.grandTotal,
        credit: 0,
        balance: bal,
      }),
      ...ledger,
    ]
    if (purchase.paid > 0) {
      ledger = [
        makeLedger({
          date,
          partyType: 'supplier',
          partyId: purchase.supplierId,
          partyName: purchase.supplierName,
          reference: purchase.purchaseNo,
          description: 'Purchase cancelled — reverse payment allocation',
          debit: 0,
          credit: purchase.paid,
          balance: bal,
        }),
        ...ledger,
      ]
    }
  }

  return {
    ok: true,
    products,
    movements,
    suppliers,
    ledger,
    purchasePatch: { status: 'cancelled', due: 0, updatedAt: ts },
  }
}
