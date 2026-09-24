import { eachDayOfInterval, eachMonthOfInterval, format, parseISO } from 'date-fns'
import type {
  Category,
  Distributor,
  Expense,
  Product,
  Sale,
  SalesReturn,
} from '@/types'
import { calculateProfit, roundMoney } from '@/utils/calculations'
import { isConfirmedDoc } from '@/utils/dashboard-metrics'
import { inDateRange } from '@/utils/date-range'

export interface FinancialKpis {
  revenue: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
  grossMarginPct: number
  netMarginPct: number
}

export interface FinancialTrendPoint {
  key: string
  label: string
  revenue: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
}

export interface ProfitBreakdownRow {
  id: string
  name: string
  revenue: number
  cogs: number
  grossProfit: number
  marginPct: number
  quantity?: number
}

function confirmedSalesInRange(sales: Sale[], from: string, to: string) {
  return sales.filter(
    (s) => isConfirmedDoc(s.status) && inDateRange(s.date, from, to),
  )
}

function unitCost(product: Product | undefined, rate: number) {
  return product?.purchasePrice ?? rate * 0.7
}

export function computeFinancialKpis(
  sales: Sale[],
  products: Product[],
  expenses: Expense[],
  salesReturns: SalesReturn[],
  from: string,
  to: string,
): FinancialKpis {
  const salesInRange = confirmedSalesInRange(sales, from, to)
  const returnsAmt = roundMoney(
    salesReturns
      .filter((r) => inDateRange(r.date, from, to))
      .reduce((sum, r) => sum + r.amount, 0),
  )

  const grossSales = roundMoney(salesInRange.reduce((sum, s) => sum + s.grandTotal, 0))
  const revenue = roundMoney(grossSales - returnsAmt)

  const priceByProduct = new Map(products.map((p) => [p.id, p]))
  let cogs = 0
  for (const sale of salesInRange) {
    for (const item of sale.items) {
      cogs += unitCost(priceByProduct.get(item.productId), item.rate) * item.quantity
    }
  }
  cogs = roundMoney(cogs)

  const expenseTotal = roundMoney(
    expenses.filter((e) => inDateRange(e.date, from, to)).reduce((sum, e) => sum + e.amount, 0),
  )

  const { grossProfit, netProfit } = calculateProfit(revenue, cogs, expenseTotal)
  const grossMarginPct = revenue > 0 ? roundMoney((grossProfit / revenue) * 100) : 0
  const netMarginPct = revenue > 0 ? roundMoney((netProfit / revenue) * 100) : 0

  return {
    revenue,
    cogs,
    grossProfit,
    expenses: expenseTotal,
    netProfit,
    grossMarginPct,
    netMarginPct,
  }
}

function bucketKey(dateStr: string, granularity: 'day' | 'month') {
  return granularity === 'month' ? dateStr.slice(0, 7) : dateStr
}

function bucketLabel(key: string, granularity: 'day' | 'month') {
  if (granularity === 'month') {
    try {
      return format(parseISO(`${key}-01`), 'MMM yyyy')
    } catch {
      return key
    }
  }
  try {
    return format(parseISO(key), 'dd MMM')
  } catch {
    return key
  }
}

export function buildFinancialTrends(
  sales: Sale[],
  products: Product[],
  expenses: Expense[],
  salesReturns: SalesReturn[],
  from: string,
  to: string,
): FinancialTrendPoint[] {
  const fromDate = parseISO(from)
  const toDate = parseISO(to)
  const daySpan =
    Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1)
  const granularity: 'day' | 'month' = daySpan > 62 ? 'month' : 'day'

  const keys =
    granularity === 'month'
      ? eachMonthOfInterval({ start: fromDate, end: toDate }).map((d) => format(d, 'yyyy-MM'))
      : eachDayOfInterval({ start: fromDate, end: toDate }).map((d) => format(d, 'yyyy-MM-dd'))

  const priceByProduct = new Map(products.map((p) => [p.id, p]))
  const points = new Map<string, FinancialTrendPoint>()
  for (const key of keys) {
    points.set(key, {
      key,
      label: bucketLabel(key, granularity),
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      expenses: 0,
      netProfit: 0,
    })
  }

  for (const sale of confirmedSalesInRange(sales, from, to)) {
    const key = bucketKey(sale.date, granularity)
    const point = points.get(key)
    if (!point) continue
    point.revenue += sale.grandTotal
    for (const item of sale.items) {
      point.cogs += unitCost(priceByProduct.get(item.productId), item.rate) * item.quantity
    }
  }

  for (const ret of salesReturns) {
    if (!inDateRange(ret.date, from, to)) continue
    const key = bucketKey(ret.date, granularity)
    const point = points.get(key)
    if (!point) continue
    point.revenue -= ret.amount
  }

  for (const expense of expenses) {
    if (!inDateRange(expense.date, from, to)) continue
    const key = bucketKey(expense.date, granularity)
    const point = points.get(key)
    if (!point) continue
    point.expenses += expense.amount
  }

  return keys.map((key) => {
    const point = points.get(key)!
    point.revenue = roundMoney(point.revenue)
    point.cogs = roundMoney(point.cogs)
    point.expenses = roundMoney(point.expenses)
    point.grossProfit = roundMoney(point.revenue - point.cogs)
    point.netProfit = roundMoney(point.grossProfit - point.expenses)
    return point
  })
}

function finalizeBreakdown(map: Map<string, ProfitBreakdownRow>, limit = 12): ProfitBreakdownRow[] {
  return [...map.values()]
    .map((row) => ({
      ...row,
      revenue: roundMoney(row.revenue),
      cogs: roundMoney(row.cogs),
      grossProfit: roundMoney(row.revenue - row.cogs),
      marginPct:
        row.revenue > 0 ? roundMoney(((row.revenue - row.cogs) / row.revenue) * 100) : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, limit)
}

export function profitByProduct(
  sales: Sale[],
  products: Product[],
  from: string,
  to: string,
): ProfitBreakdownRow[] {
  const priceByProduct = new Map(products.map((p) => [p.id, p]))
  const map = new Map<string, ProfitBreakdownRow>()

  for (const sale of confirmedSalesInRange(sales, from, to)) {
    for (const item of sale.items) {
      const product = priceByProduct.get(item.productId)
      const existing = map.get(item.productId) ?? {
        id: item.productId,
        name: item.productName,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        marginPct: 0,
        quantity: 0,
      }
      existing.revenue += item.amount
      existing.cogs += unitCost(product, item.rate) * item.quantity
      existing.quantity = (existing.quantity ?? 0) + item.quantity
      map.set(item.productId, existing)
    }
  }

  return finalizeBreakdown(map)
}

export function profitByCategory(
  sales: Sale[],
  products: Product[],
  categories: Category[],
  from: string,
  to: string,
): ProfitBreakdownRow[] {
  const productMap = new Map(products.map((p) => [p.id, p]))
  const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const map = new Map<string, ProfitBreakdownRow>()

  for (const sale of confirmedSalesInRange(sales, from, to)) {
    for (const item of sale.items) {
      const product = productMap.get(item.productId)
      const catId = product?.categoryId ?? 'uncategorized'
      const existing = map.get(catId) ?? {
        id: catId,
        name: categoryName[catId] ?? 'Uncategorized',
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        marginPct: 0,
        quantity: 0,
      }
      existing.revenue += item.amount
      existing.cogs += unitCost(product, item.rate) * item.quantity
      existing.quantity = (existing.quantity ?? 0) + item.quantity
      map.set(catId, existing)
    }
  }

  return finalizeBreakdown(map)
}

export function profitByCustomer(
  sales: Sale[],
  products: Product[],
  distributors: Distributor[],
  from: string,
  to: string,
): ProfitBreakdownRow[] {
  const distributorIds = new Set(distributors.map((d) => d.id))
  const priceByProduct = new Map(products.map((p) => [p.id, p]))
  const map = new Map<string, ProfitBreakdownRow>()

  for (const sale of confirmedSalesInRange(sales, from, to)) {
    if (distributorIds.has(sale.customerId)) continue
    const existing = map.get(sale.customerId) ?? {
      id: sale.customerId,
      name: sale.customerName,
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      marginPct: 0,
    }
    existing.revenue += sale.grandTotal
    for (const item of sale.items) {
      existing.cogs += unitCost(priceByProduct.get(item.productId), item.rate) * item.quantity
    }
    map.set(sale.customerId, existing)
  }

  return finalizeBreakdown(map)
}

export function profitByDistributor(
  sales: Sale[],
  products: Product[],
  distributors: Distributor[],
  from: string,
  to: string,
): ProfitBreakdownRow[] {
  const distributorIds = new Set(distributors.map((d) => d.id))
  const distributorName = Object.fromEntries(
    distributors.map((d) => [d.id, d.companyName || d.name]),
  )
  const priceByProduct = new Map(products.map((p) => [p.id, p]))
  const map = new Map<string, ProfitBreakdownRow>()

  for (const sale of confirmedSalesInRange(sales, from, to)) {
    if (!distributorIds.has(sale.customerId)) continue
    const existing = map.get(sale.customerId) ?? {
      id: sale.customerId,
      name: distributorName[sale.customerId] ?? sale.customerName,
      revenue: 0,
      cogs: 0,
      grossProfit: 0,
      marginPct: 0,
    }
    existing.revenue += sale.grandTotal
    for (const item of sale.items) {
      existing.cogs += unitCost(priceByProduct.get(item.productId), item.rate) * item.quantity
    }
    map.set(sale.customerId, existing)
  }

  return finalizeBreakdown(map)
}
