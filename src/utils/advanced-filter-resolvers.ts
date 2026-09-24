import type { Customer, Invoice, Payment, Product, Purchase, Sale } from '@/types'
import { isConfirmedDoc } from '@/utils/dashboard-metrics'
import type { ReceivablePartyRow } from '@/utils/outstanding-metrics'

export interface ProductSalesAggregate {
  units: number
  amount: number
}

export function buildProductSalesMap(sales: Sale[]): Map<string, ProductSalesAggregate> {
  const map = new Map<string, ProductSalesAggregate>()
  for (const sale of sales) {
    if (!isConfirmedDoc(sale.status)) continue
    for (const line of sale.items) {
      const cur = map.get(line.productId) ?? { units: 0, amount: 0 }
      cur.units += line.quantity
      cur.amount += line.amount
      map.set(line.productId, cur)
    }
  }
  return map
}

export function buildCustomerSalesTotals(sales: Sale[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const sale of sales) {
    if (!isConfirmedDoc(sale.status)) continue
    map.set(sale.customerId, (map.get(sale.customerId) ?? 0) + sale.grandTotal)
  }
  return map
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function resolveProductFilterValue(
  row: Product,
  fieldId: string,
  ctx: {
    categoryName: string
    brandName: string
    salesMap: Map<string, ProductSalesAggregate>
  },
) {
  switch (fieldId) {
    case 'product':
      return row.name
    case 'sku':
      return row.sku
    case 'category':
      return ctx.categoryName
    case 'brand':
      return ctx.brandName
    case 'stock':
      return row.currentStock
    case 'minimumStock':
      return row.minimumStock
    case 'lowStock':
      return row.currentStock < row.minimumStock ? 'yes' : 'no'
    case 'sales':
      return ctx.salesMap.get(row.id)?.amount ?? 0
    case 'salesUnits':
      return ctx.salesMap.get(row.id)?.units ?? 0
    case 'status':
      return row.status
    default:
      return ''
  }
}

export function resolveCustomerFilterValue(
  row: Customer,
  fieldId: string,
  salesTotals: Map<string, number>,
) {
  switch (fieldId) {
    case 'name':
      return row.name
    case 'city':
      return row.city
    case 'balance':
      return row.currentBalance
    case 'creditLimit':
      return row.creditLimit
    case 'totalSales':
      return salesTotals.get(row.id) ?? 0
    case 'status':
      return row.status
    default:
      return ''
  }
}

export function resolveSaleFilterValue(row: Sale, fieldId: string) {
  switch (fieldId) {
    case 'invoice':
      return row.invoiceNo
    case 'customer':
      return row.customerName
    case 'total':
      return row.grandTotal
    case 'due':
      return row.due
    case 'status':
      return row.status
    default:
      return ''
  }
}

export function resolveInvoiceFilterValue(row: Invoice, fieldId: string) {
  switch (fieldId) {
    case 'invoice':
      return row.invoiceNo
    case 'customer':
      return row.customerName
    case 'total':
      return row.grandTotal
    case 'balance':
      return row.balance
    case 'status':
      return row.status
    default:
      return ''
  }
}

export function resolveReceivableFilterValue(row: ReceivablePartyRow, fieldId: string) {
  switch (fieldId) {
    case 'party':
      return row.name
    case 'balance':
      return row.balance
    case 'ageDays':
      return row.ageDays
    case 'partyType':
      return row.partyType
    default:
      return ''
  }
}

export function resolvePurchaseFilterValue(row: Purchase, fieldId: string) {
  switch (fieldId) {
    case 'purchaseNo':
      return row.purchaseNo
    case 'supplier':
      return row.supplierName
    case 'total':
      return row.grandTotal
    case 'date':
      return row.date
    case 'isToday':
      return row.date === todayIso() ? 'yes' : 'no'
    case 'status':
      return row.status
    default:
      return ''
  }
}

export function resolvePaymentFilterValue(row: Payment, fieldId: string) {
  switch (fieldId) {
    case 'paymentNo':
      return row.paymentNo
    case 'party':
      return row.partyName
    case 'amount':
      return row.amount
    case 'date':
      return row.date
    case 'type':
      return row.type
    case 'method':
      return row.method
    default:
      return ''
  }
}
