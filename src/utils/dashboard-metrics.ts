import type { Expense, Product, Purchase, Sale } from '@/types'
import { inDateRange } from '@/utils/date-range'
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'

export function isConfirmedDoc(status: string): boolean {
  return status !== 'cancelled' && status !== 'draft'
}

export function previousRange(from: string, to: string): { from: string; to: string } {
  const spanDays = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1
  const prevTo = format(subDays(parseISO(from), 1), 'yyyy-MM-dd')
  const prevFrom = format(subDays(parseISO(from), spanDays), 'yyyy-MM-dd')
  return { from: prevFrom, to: prevTo }
}

export function percentChange(current: number, previous: number): number | undefined {
  if (previous === 0) {
    if (current === 0) return 0
    return undefined
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export function filterConfirmedSales(sales: Sale[]): Sale[] {
  return sales.filter((s) => isConfirmedDoc(s.status))
}

export function filterConfirmedPurchases(purchases: Purchase[]): Purchase[] {
  return purchases.filter((p) => isConfirmedDoc(p.status))
}

export function sumSalesInRange(sales: Sale[], from: string, to: string): number {
  return sales
    .filter((s) => inDateRange(s.date, from, to))
    .reduce((sum, s) => sum + s.grandTotal, 0)
}

export function sumPurchasesInRange(purchases: Purchase[], from: string, to: string): number {
  return purchases
    .filter((p) => inDateRange(p.date, from, to))
    .reduce((sum, p) => sum + p.grandTotal, 0)
}

export function sumExpensesInRange(expenses: Expense[], from: string, to: string): number {
  return expenses
    .filter((e) => inDateRange(e.date, from, to))
    .reduce((sum, e) => sum + e.amount, 0)
}

export function computeCogs(
  sales: Sale[],
  products: Product[],
  from: string,
  to: string,
): number {
  const priceByProduct = new Map(products.map((p) => [p.id, p.purchasePrice]))
  let total = 0
  for (const sale of sales) {
    if (!inDateRange(sale.date, from, to)) continue
    for (const item of sale.items) {
      total += (priceByProduct.get(item.productId) ?? 0) * item.quantity
    }
  }
  return total
}

export function grossProfitInRange(
  sales: Sale[],
  products: Product[],
  from: string,
  to: string,
): number {
  const revenue = sumSalesInRange(sales, from, to)
  const cogs = computeCogs(sales, products, from, to)
  return revenue - cogs
}

export function netProfitInRange(
  sales: Sale[],
  products: Product[],
  expenses: Expense[],
  from: string,
  to: string,
): number {
  return grossProfitInRange(sales, products, from, to) - sumExpensesInRange(expenses, from, to)
}

export function stockValue(products: Product[]): number {
  return products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0)
}

export function lowStockCount(products: Product[]): number {
  return products.filter((p) => p.status === 'active' && p.currentStock <= p.minimumStock).length
}

export function salesWithDueInRange(sales: Sale[], from: string, to: string): Sale[] {
  return sales.filter((s) => inDateRange(s.date, from, to) && s.due > 0)
}

export function sumDueInRange(sales: Sale[], from: string, to: string): number {
  return salesWithDueInRange(sales, from, to).reduce((sum, s) => sum + s.due, 0)
}

export function countDueInRange(sales: Sale[], from: string, to: string): number {
  return salesWithDueInRange(sales, from, to).length
}
