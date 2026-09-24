import type { Brand, Category, Distributor, Expense, Payment, Product, Purchase, Sale } from '@/types'
import type {
  ReportDefinition,
  ReportFilterCondition,
  ReportGroupBy,
  ReportRow,
  ReportRunResult,
} from '@/types/report-builder'
import { columnsForReportType, resolveVisibleColumnDefs } from '@/config/report-builder'
import { inDateRange } from '@/utils/date-range'
import { isConfirmedDoc } from '@/utils/dashboard-metrics'

export interface ReportBuilderData {
  sales: Sale[]
  purchases: Purchase[]
  payments: Payment[]
  products: Product[]
  expenses: Expense[]
  distributors: Distributor[]
  categories: Category[]
  brands: Brand[]
}

function parseNum(raw: string): number {
  const n = Number(String(raw).replace(/[₹,\s]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function matchFilter(row: ReportRow, filter: ReportFilterCondition): boolean {
  if (!filter.fieldId || filter.value === '') return true
  const raw = row[filter.fieldId]
  const leftText = String(raw ?? '').toLowerCase()
  const rightText = filter.value.trim().toLowerCase()

  switch (filter.operator) {
    case 'equals':
      return leftText === rightText
    case 'contains':
      return leftText.includes(rightText)
    case 'greater_than': {
      const left = typeof raw === 'number' ? raw : parseNum(String(raw ?? ''))
      const right = parseNum(filter.value)
      return !Number.isNaN(left) && !Number.isNaN(right) && left > right
    }
    case 'less_than': {
      const left = typeof raw === 'number' ? raw : parseNum(String(raw ?? ''))
      const right = parseNum(filter.value)
      return !Number.isNaN(left) && !Number.isNaN(right) && left < right
    }
    default:
      return true
  }
}

function applyFilters(rows: ReportRow[], filters: ReportFilterCondition[]) {
  const active = filters.filter((f) => f.fieldId && f.value !== '')
  if (!active.length) return rows
  return rows.filter((row) => active.every((f) => matchFilter(row, f)))
}

function groupKeyFor(row: ReportRow, groupBy: ReportGroupBy, reportType: ReportDefinition['reportType']): string {
  switch (groupBy) {
    case 'customer':
      return String(row.customer ?? '—')
    case 'distributor':
      return String(row.distributor || row.customer || '—')
    case 'supplier':
      return String(row.supplier ?? '—')
    case 'product':
      return String(row.product ?? '—')
    case 'category':
      return String(row.category ?? '—')
    case 'date':
      return String(row.date ?? '—')
    case 'method':
      return String(row.method ?? '—')
    case 'status':
      return String((reportType === 'payments' ? row.type : row.status) ?? '—')
    default:
      return 'all'
  }
}

function aggregateRows(
  rows: ReportRow[],
  groupBy: ReportGroupBy,
  reportType: ReportDefinition['reportType'],
  aggregatableIds: string[],
): ReportRow[] {
  if (groupBy === 'none') return rows

  const map = new Map<string, ReportRow>()
  for (const row of rows) {
    if (groupBy === 'distributor' && !row.distributor) continue
    const key = groupKeyFor(row, groupBy, reportType)
    const existing = map.get(key)
    if (!existing) {
      const next: ReportRow = { count: 1 }
      if (groupBy === 'customer') next.customer = key
      else if (groupBy === 'distributor') next.distributor = key
      else if (groupBy === 'supplier') next.supplier = key
      else if (groupBy === 'product') next.product = key
      else if (groupBy === 'category') next.category = key
      else if (groupBy === 'date') next.date = key
      else if (groupBy === 'method') next.method = key
      else if (groupBy === 'status') {
        if (reportType === 'payments') next.type = key
        else next.status = key
      }
      for (const id of aggregatableIds) {
        const v = row[id]
        next[id] = typeof v === 'number' ? v : 0
      }
      map.set(key, next)
      continue
    }
    existing.count = Number(existing.count ?? 0) + 1
    for (const id of aggregatableIds) {
      const v = row[id]
      existing[id] = Number(existing[id] ?? 0) + (typeof v === 'number' ? v : 0)
    }
  }
  return [...map.values()]
}

function sortRows(rows: ReportRow[], sortBy: string, sortDir: 'asc' | 'desc') {
  if (!sortBy) return rows
  const dir = sortDir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[sortBy]
    const bv = b[sortBy]
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true }) * dir
  })
}

function buildSalesRows(data: ReportBuilderData, expandLines: boolean): ReportRow[] {
  const distributorIds = new Set(data.distributors.map((d) => d.id))
  const rows: ReportRow[] = []

  for (const sale of data.sales) {
    if (!isConfirmedDoc(sale.status)) continue

    const isDistributor = distributorIds.has(sale.customerId)
    const tax = sale.cgst + sale.sgst + sale.igst
    const base = {
      date: sale.date,
      invoiceNo: sale.invoiceNo,
      customer: isDistributor ? '' : sale.customerName,
      distributor: isDistributor ? sale.customerName : '',
      subtotal: sale.subtotal,
      tax,
      grandTotal: sale.grandTotal,
      paid: sale.paid,
      due: sale.due,
      status: sale.status,
      quantity: sale.items.reduce((s, i) => s + i.quantity, 0),
      count: 1,
    }

    if (!expandLines) {
      rows.push({
        ...base,
        product: sale.items[0]?.productName ?? '',
        sku: sale.items[0]?.sku ?? '',
      })
      continue
    }

    for (const line of sale.items) {
      rows.push({
        ...base,
        product: line.productName,
        sku: line.sku,
        quantity: line.quantity,
        subtotal: line.amount,
        tax: (line.amount * line.gstRate) / 100,
        grandTotal: line.amount + (line.amount * line.gstRate) / 100,
        paid: 0,
        due: 0,
      })
    }
  }
  return rows
}

function buildPurchaseRows(data: ReportBuilderData, expandLines: boolean): ReportRow[] {
  const rows: ReportRow[] = []
  for (const purchase of data.purchases) {
    if (purchase.status === 'draft' || purchase.status === 'cancelled') continue
    const base = {
      date: purchase.date,
      purchaseNo: purchase.purchaseNo,
      supplier: purchase.supplierName,
      grandTotal: purchase.grandTotal,
      paid: purchase.paid,
      due: purchase.due,
      status: purchase.status,
      quantity: purchase.items.reduce((s, i) => s + i.quantity, 0),
      count: 1,
    }
    if (!expandLines) {
      rows.push({
        ...base,
        product: purchase.items[0]?.productName ?? '',
      })
      continue
    }
    for (const line of purchase.items) {
      rows.push({
        ...base,
        product: line.productName,
        quantity: line.quantity,
        grandTotal: line.amount,
        paid: 0,
        due: 0,
      })
    }
  }
  return rows
}

function buildPaymentRows(data: ReportBuilderData): ReportRow[] {
  return data.payments.map((p) => ({
    date: p.date,
    paymentNo: p.paymentNo,
    party: p.partyName,
    type: p.type,
    method: p.method,
    amount: p.amount,
    count: 1,
  }))
}

function buildStockRows(data: ReportBuilderData): ReportRow[] {
  const cat = Object.fromEntries(data.categories.map((c) => [c.id, c.name]))
  const brand = Object.fromEntries(data.brands.map((b) => [b.id, b.name]))
  return data.products.map((p) => ({
    sku: p.sku,
    product: p.name,
    category: cat[p.categoryId] ?? '',
    brand: brand[p.brandId] ?? '',
    stock: p.currentStock,
    stockValue: p.currentStock * p.purchasePrice,
    status: p.status,
    count: 1,
  }))
}

function buildExpenseRows(data: ReportBuilderData): ReportRow[] {
  return data.expenses.map((e) => ({
    date: e.date,
    category: e.category,
    description: e.description,
    method: e.paymentMethod,
    amount: e.amount,
    count: 1,
  }))
}

export function runReport(definition: ReportDefinition, data: ReportBuilderData): ReportRunResult {
  const expandLines = definition.groupBy === 'product'
  let rows: ReportRow[] = []

  switch (definition.reportType) {
    case 'sales':
      rows = buildSalesRows(data, expandLines)
      break
    case 'purchases':
      rows = buildPurchaseRows(data, expandLines)
      break
    case 'payments':
      rows = buildPaymentRows(data)
      break
    case 'stock':
      rows = buildStockRows(data)
      break
    case 'expenses':
      rows = buildExpenseRows(data)
      break
  }

  if (definition.reportType !== 'stock') {
    rows = rows.filter((r) => {
      const d = String(r.date ?? '')
      if (!d) return true
      return inDateRange(d, definition.dateFrom, definition.dateTo)
    })
  }

  rows = applyFilters(rows, definition.filters)

  const allCols = columnsForReportType(definition.reportType)
  const aggregatableIds = allCols.filter((c) => c.aggregatable).map((c) => c.id)

  rows = aggregateRows(rows, definition.groupBy, definition.reportType, aggregatableIds)

  const visibleCols = resolveVisibleColumnDefs(
    definition.reportType,
    definition.columns,
    definition.groupBy,
  )

  const sortBy = definition.sortBy || visibleCols[0]?.id || ''
  rows = sortRows(rows, sortBy, definition.sortDir)

  const totals: Record<string, number> = {}
  for (const col of visibleCols) {
    if (!col.aggregatable) continue
    totals[col.id] = rows.reduce((sum, r) => sum + (typeof r[col.id] === 'number' ? Number(r[col.id]) : 0), 0)
  }

  return {
    rows,
    columns: visibleCols,
    totals,
    rowCount: rows.length,
  }
}
