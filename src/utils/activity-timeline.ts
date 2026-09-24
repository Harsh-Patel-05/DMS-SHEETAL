import type {
  AuditLog,
  Invoice,
  Payment,
  Purchase,
  PurchaseReturn,
  Sale,
  SalesReturn,
  StockAdjustment,
  StockMovement,
} from '@/types'
import type { ActivityEvent } from '@/types/activity'
import { formatCurrency } from '@/utils/format'

function ts(date: string, createdAt?: string) {
  if (createdAt && createdAt.length >= 16) return createdAt
  if (date.includes('T')) return date
  return `${date}T12:00:00.000Z`
}

function sortEvents(events: ActivityEvent[], limit?: number) {
  const sorted = [...events].sort((a, b) => b.at.localeCompare(a.at))
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export function buildCustomerActivity(input: {
  customerId: string
  sales: Sale[]
  payments: Payment[]
  returns: SalesReturn[]
  invoices: Invoice[]
  auditLogs?: AuditLog[]
  limit?: number
}): ActivityEvent[] {
  const { customerId, sales, payments, returns, invoices, auditLogs = [], limit = 30 } = input
  const events: ActivityEvent[] = []

  for (const sale of sales) {
    if (sale.customerId !== customerId) continue
    const inv = invoices.find((i) => i.saleId === sale.id)
    const verb =
      sale.status === 'draft' ? 'drafted' : sale.status === 'cancelled' ? 'cancelled' : 'created'
    events.push({
      id: `sale-${sale.id}`,
      kind: 'sale',
      at: ts(sale.date, sale.createdAt),
      title: `Sale ${sale.invoiceNo} ${verb}`,
      amount: sale.grandTotal,
      href: inv ? `/transactions/invoices/${inv.id}` : `/transactions/sales/${sale.id}/edit`,
    })
  }

  for (const payment of payments) {
    if (payment.partyId !== customerId || payment.partyType !== 'customer') continue
    events.push({
      id: `pay-${payment.id}`,
      kind: 'payment',
      at: ts(payment.date, payment.createdAt),
      title:
        payment.type === 'received'
          ? `Payment ${formatCurrency(payment.amount)} received`
          : `Payment ${formatCurrency(payment.amount)} recorded`,
      description: `${payment.paymentNo} · ${payment.method}`,
      amount: payment.amount,
      href: '/transactions/payments',
    })
  }

  for (const ret of returns) {
    if (ret.customerId !== customerId) continue
    events.push({
      id: `sret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Sales return ${ret.returnNo} recorded`,
      amount: ret.amount,
    })
  }

  for (const log of auditLogs) {
    if (!log.reference) continue
    const related = sales.some((s) => s.invoiceNo === log.reference && s.customerId === customerId)
    if (!related) continue
    if (log.action === 'Sale Created' || log.action === 'Payment Received') continue
    events.push({
      id: `audit-${log.id}`,
      kind: 'note',
      at: log.date,
      title: log.description,
      description: `${log.module} · ${log.userName}`,
    })
  }

  return sortEvents(events, limit)
}

export function buildDistributorActivity(input: {
  distributorId: string
  sales: Sale[]
  payments: Payment[]
  returns: SalesReturn[]
  invoices: Invoice[]
  limit?: number
}): ActivityEvent[] {
  const { distributorId, sales, payments, returns, invoices, limit = 30 } = input
  const events: ActivityEvent[] = []

  for (const sale of sales) {
    if (sale.customerId !== distributorId) continue
    const inv = invoices.find((i) => i.saleId === sale.id)
    events.push({
      id: `sale-${sale.id}`,
      kind: 'sale',
      at: ts(sale.date, sale.createdAt),
      title: `Sale ${sale.invoiceNo} created`,
      amount: sale.grandTotal,
      href: inv ? `/transactions/invoices/${inv.id}` : `/transactions/sales/${sale.id}/edit`,
    })
  }

  for (const payment of payments) {
    if (payment.partyId !== distributorId || payment.partyType !== 'distributor') continue
    events.push({
      id: `pay-${payment.id}`,
      kind: 'payment',
      at: ts(payment.date, payment.createdAt),
      title:
        payment.type === 'received'
          ? `Payment ${formatCurrency(payment.amount)} received`
          : `Payment ${formatCurrency(payment.amount)} recorded`,
      description: `${payment.paymentNo} · ${payment.method}`,
      amount: payment.amount,
    })
  }

  for (const ret of returns) {
    if (ret.customerId !== distributorId) continue
    events.push({
      id: `sret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Return ${ret.returnNo} recorded`,
      amount: ret.amount,
    })
  }

  return sortEvents(events, limit)
}

export function buildProductActivity(input: {
  productId: string
  sales: Sale[]
  purchases: Purchase[]
  movements: StockMovement[]
  adjustments?: StockAdjustment[]
  salesReturns: SalesReturn[]
  purchaseReturns: PurchaseReturn[]
  limit?: number
}): ActivityEvent[] {
  const {
    productId,
    sales,
    purchases,
    movements,
    adjustments = [],
    salesReturns,
    purchaseReturns,
    limit = 40,
  } = input
  const events: ActivityEvent[] = []

  for (const sale of sales) {
    if (sale.status === 'draft' || sale.status === 'cancelled') continue
    for (const line of sale.items) {
      if (line.productId !== productId) continue
      events.push({
        id: `sale-line-${sale.id}-${line.id}`,
        kind: 'sale',
        at: ts(sale.date, sale.createdAt),
        title: `Sale ${sale.invoiceNo} created`,
        description: `${line.quantity} units · ${sale.customerName}`,
        amount: line.amount,
        href: `/transactions/sales/${sale.id}/edit`,
      })
    }
  }

  for (const purchase of purchases) {
    if (purchase.status === 'draft' || purchase.status === 'cancelled') continue
    for (const line of purchase.items) {
      if (line.productId !== productId) continue
      events.push({
        id: `pur-line-${purchase.id}-${line.id}`,
        kind: 'purchase',
        at: ts(purchase.date, purchase.createdAt),
        title: `Purchase ${purchase.purchaseNo} confirmed`,
        description: `${line.quantity} units · ${purchase.supplierName}`,
        amount: line.amount,
        href: `/transactions/purchases/${purchase.id}/edit`,
      })
    }
  }

  for (const mov of movements) {
    if (mov.productId !== productId) continue
    if (mov.type === 'sale' || mov.type === 'purchase') continue
    events.push({
      id: `mov-${mov.id}`,
      kind: mov.type === 'adjustment' ? 'stock' : 'transfer',
      at: ts(mov.date, mov.createdAt),
      title: mov.type === 'adjustment' ? 'Stock adjusted' : 'Stock transferred',
      description: `${mov.reference} · +${mov.quantityIn} / −${mov.quantityOut}`,
    })
  }

  for (const adj of adjustments) {
    if (adj.productId !== productId) continue
    events.push({
      id: `adj-${adj.id}`,
      kind: 'adjustment',
      at: ts(adj.date, adj.createdAt),
      title: 'Stock adjusted',
      description: `${adj.adjustmentType} ${adj.quantity} · ${adj.reason}`,
    })
  }

  for (const ret of salesReturns) {
    if (ret.productId !== productId) continue
    events.push({
      id: `sret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Sales return ${ret.returnNo}`,
      description: `${ret.returnQuantity} units`,
      amount: ret.amount,
    })
  }

  for (const ret of purchaseReturns) {
    if (ret.productId !== productId) continue
    events.push({
      id: `pret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Purchase return ${ret.returnNo}`,
      description: `${ret.returnQuantity} units`,
      amount: ret.amount,
    })
  }

  return sortEvents(events, limit)
}

export function buildInvoiceActivity(input: {
  invoice: Invoice
  sale?: Sale
  payments: Payment[]
  auditLogs?: AuditLog[]
  limit?: number
}): ActivityEvent[] {
  const { invoice, sale, payments, auditLogs = [], limit = 20 } = input
  const events: ActivityEvent[] = []

  if (sale) {
    events.push({
      id: `sale-linked-${sale.id}`,
      kind: 'sale',
      at: ts(sale.date, sale.createdAt),
      title: `Sale ${sale.invoiceNo} created`,
      amount: sale.grandTotal,
      href: `/transactions/sales/${sale.id}/edit`,
    })
  }

  events.push({
    id: `inv-created-${invoice.id}`,
    kind: 'invoice',
    at: ts(invoice.date, invoice.createdAt),
    title: `Invoice ${invoice.invoiceNo} generated`,
    amount: invoice.grandTotal,
  })

  for (const payment of payments) {
    if (payment.partyId !== invoice.customerId || payment.type !== 'received') continue
    const allocated = payment.allocations?.some(
      (a) => a.saleId === invoice.saleId || a.invoiceNo === invoice.invoiceNo,
    )
    if (payment.allocations && payment.allocations.length > 0 && !allocated) continue
    if (!allocated && payment.date < invoice.date) continue
    events.push({
      id: `pay-${payment.id}`,
      kind: 'payment',
      at: ts(payment.date, payment.createdAt),
      title: `Payment ${formatCurrency(payment.amount)} received`,
      description: payment.paymentNo,
      amount: payment.amount,
    })
  }

  if (invoice.status === 'cancelled') {
    events.push({
      id: `inv-cancel-${invoice.id}`,
      kind: 'invoice',
      at: ts(invoice.date, invoice.createdAt),
      title: `Invoice ${invoice.invoiceNo} cancelled`,
    })
  }

  for (const log of auditLogs) {
    if (log.reference !== invoice.invoiceNo && log.reference !== sale?.invoiceNo) continue
    events.push({
      id: `audit-${log.id}`,
      kind: 'note',
      at: log.date,
      title: log.description,
      description: log.action,
    })
  }

  return sortEvents(events, limit)
}

export function buildSaleActivity(input: {
  sale: Sale
  invoice?: Invoice
  payments: Payment[]
  returns: SalesReturn[]
  auditLogs?: AuditLog[]
  limit?: number
}): ActivityEvent[] {
  const { sale, invoice, payments, returns, auditLogs = [], limit = 25 } = input
  const events: ActivityEvent[] = []

  events.push({
    id: `sale-${sale.id}`,
    kind: 'sale',
    at: ts(sale.date, sale.createdAt),
    title:
      sale.status === 'draft'
        ? `Sale ${sale.invoiceNo} drafted`
        : sale.status === 'cancelled'
          ? `Sale ${sale.invoiceNo} cancelled`
          : `Sale ${sale.invoiceNo} created`,
    amount: sale.grandTotal,
  })

  if (invoice) {
    events.push({
      id: `inv-${invoice.id}`,
      kind: 'invoice',
      at: ts(invoice.date, invoice.createdAt),
      title: `Invoice ${invoice.invoiceNo} generated`,
      href: `/transactions/invoices/${invoice.id}`,
      amount: invoice.grandTotal,
    })
  }

  for (const payment of payments) {
    if (payment.partyId !== sale.customerId || payment.type !== 'received') continue
    const hit =
      payment.allocations?.some((a) => a.saleId === sale.id || a.invoiceNo === sale.invoiceNo) ?? false
    if (payment.allocations && payment.allocations.length > 0 && !hit) continue
    if (!hit && payment.date < sale.date) continue
    events.push({
      id: `pay-${payment.id}`,
      kind: 'payment',
      at: ts(payment.date, payment.createdAt),
      title: `Payment ${formatCurrency(payment.amount)} received`,
      description: payment.paymentNo,
      amount: payment.amount,
    })
  }

  for (const ret of returns) {
    if (ret.saleId !== sale.id) continue
    events.push({
      id: `ret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Return ${ret.returnNo} recorded`,
      amount: ret.amount,
    })
  }

  for (const log of auditLogs) {
    if (log.reference !== sale.invoiceNo) continue
    events.push({
      id: `audit-${log.id}`,
      kind: 'note',
      at: log.date,
      title: log.description,
    })
  }

  return sortEvents(events, limit)
}

export function buildPurchaseActivity(input: {
  purchase: Purchase
  payments: Payment[]
  returns: PurchaseReturn[]
  movements?: StockMovement[]
  auditLogs?: AuditLog[]
  limit?: number
}): ActivityEvent[] {
  const { purchase, payments, returns, movements = [], auditLogs = [], limit = 25 } = input
  const events: ActivityEvent[] = []

  events.push({
    id: `pur-${purchase.id}`,
    kind: 'purchase',
    at: ts(purchase.date, purchase.createdAt),
    title:
      purchase.status === 'draft'
        ? `Purchase ${purchase.purchaseNo} drafted`
        : purchase.status === 'cancelled'
          ? `Purchase ${purchase.purchaseNo} cancelled`
          : `Purchase ${purchase.purchaseNo} confirmed`,
    amount: purchase.grandTotal,
  })

  for (const mov of movements) {
    if (mov.reference !== purchase.purchaseNo) continue
    events.push({
      id: `mov-${mov.id}`,
      kind: 'stock',
      at: ts(mov.date, mov.createdAt),
      title: 'Stock adjusted',
      description: `${mov.productName} · +${mov.quantityIn}`,
    })
  }

  for (const payment of payments) {
    if (payment.partyId !== purchase.supplierId || payment.partyType !== 'supplier') continue
    if (payment.type !== 'paid') continue
    if (payment.date < purchase.date) continue
    events.push({
      id: `pay-${payment.id}`,
      kind: 'payment',
      at: ts(payment.date, payment.createdAt),
      title: `Payment ${formatCurrency(payment.amount)} made`,
      description: payment.paymentNo,
      amount: payment.amount,
    })
  }

  for (const ret of returns) {
    if (ret.purchaseId !== purchase.id) continue
    events.push({
      id: `ret-${ret.id}`,
      kind: 'return',
      at: ts(ret.date, ret.createdAt),
      title: `Return ${ret.returnNo} recorded`,
      amount: ret.amount,
    })
  }

  for (const log of auditLogs) {
    if (log.reference !== purchase.purchaseNo) continue
    events.push({
      id: `audit-${log.id}`,
      kind: 'note',
      at: log.date,
      title: log.description,
    })
  }

  return sortEvents(events, limit)
}
