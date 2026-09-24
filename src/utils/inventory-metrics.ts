import { differenceInCalendarDays, parseISO, subDays } from 'date-fns'
import type { Product, Sale, StockMovement } from '@/types'
import { filterConfirmedSales } from '@/utils/dashboard-metrics'
import { formatCurrency } from '@/utils/format'

export const FAST_MOVING_QTY_THRESHOLD = 5
export const MOVEMENT_WINDOW_DAYS = 30
export const DEAD_STOCK_DAYS = 90

export type StockHealthBucket = 'healthy' | 'low' | 'critical' | 'out'

export function stockHealth(p: Product): StockHealthBucket {
  if (p.currentStock <= 0) return 'out'
  if (p.currentStock <= p.minimumStock) {
    const criticalCeil = Math.max(1, Math.floor(p.minimumStock * 0.5))
    if (p.currentStock <= criticalCeil) return 'critical'
    return 'low'
  }
  return 'healthy'
}

function lastMovementDate(productId: string, movements: StockMovement[]): string | null {
  let latest: string | null = null
  for (const m of movements) {
    if (m.productId !== productId) continue
    if (!latest || m.date > latest) latest = m.date
  }
  return latest
}

export function saleQtyByProductLastDays(sales: Sale[], days: number, refDate = new Date()): Map<string, number> {
  const from = subDays(refDate, days)
  const fromStr = from.toISOString().slice(0, 10)
  const map = new Map<string, number>()
  for (const sale of filterConfirmedSales(sales)) {
    if (sale.date < fromStr) continue
    for (const item of sale.items) {
      map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity)
    }
  }
  return map
}

export function daysSince(dateIso: string, refDate = new Date()): number {
  return differenceInCalendarDays(refDate, parseISO(dateIso))
}

export interface InventoryOverviewMetrics {
  totalSkus: number
  totalUnits: number
  stockValue: number
  lowStockCount: number
  outOfStockCount: number
  fastMovingCount: number
  slowMovingCount: number
  deadStockCount: number
  deadStockValue: number
  noMovementCount: number
  health: Record<StockHealthBucket, number>
  aging: { bucket: string; count: number }[]
  movement: { fast: number; slow: number; none: number }
}

export type InventoryAlertId = 'low_stock' | 'out_of_stock' | 'dead_sku' | 'dead_value'

export interface InventoryAlert {
  id: InventoryAlertId
  dismissKey: string
  message: string
  viewPath: string
  purchasePath: string
}

export function computeInventoryAlerts(metrics: InventoryOverviewMetrics): InventoryAlert[] {
  const alerts: InventoryAlert[] = []
  if (metrics.lowStockCount > 0) {
    alerts.push({
      id: 'low_stock',
      dismissKey: `low_stock:${metrics.lowStockCount}`,
      message: `${metrics.lowStockCount} product${metrics.lowStockCount === 1 ? '' : 's'} are below minimum stock.`,
      viewPath: '/inventory/low-stock',
      purchasePath: '/transactions/purchases/new',
    })
  }
  if (metrics.outOfStockCount > 0) {
    alerts.push({
      id: 'out_of_stock',
      dismissKey: `out_of_stock:${metrics.outOfStockCount}`,
      message: `${metrics.outOfStockCount} product${metrics.outOfStockCount === 1 ? '' : 's'} are out of stock.`,
      viewPath: '/inventory/stock',
      purchasePath: '/transactions/purchases/new',
    })
  }
  if (metrics.deadStockCount > 0) {
    alerts.push({
      id: 'dead_sku',
      dismissKey: `dead_sku:${metrics.deadStockCount}`,
      message: `${metrics.deadStockCount} product${metrics.deadStockCount === 1 ? '' : 's'} have had no movement for 90+ days.`,
      viewPath: '/inventory/movement',
      purchasePath: '/transactions/purchases/new',
    })
  }
  if (metrics.deadStockValue > 0) {
    alerts.push({
      id: 'dead_value',
      dismissKey: `dead_value:${Math.round(metrics.deadStockValue)}`,
      message: `${formatCurrency(metrics.deadStockValue)} stock has had no movement.`,
      viewPath: '/inventory/stock',
      purchasePath: '/transactions/purchases/new',
    })
  }
  return alerts
}

export function computeInventoryOverview(
  products: Product[],
  sales: Sale[],
  movements: StockMovement[],
  refDate = new Date(),
): InventoryOverviewMetrics {
  const active = products.filter((p) => p.status === 'active')
  const saleQty30 = saleQtyByProductLastDays(sales, MOVEMENT_WINDOW_DAYS, refDate)

  let totalUnits = 0
  let stockValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  let fastMovingCount = 0
  let slowMovingCount = 0
  let deadStockCount = 0
  let deadStockValue = 0
  let noMovementCount = 0
  let movementFast = 0
  let movementSlow = 0
  let movementNone = 0
  const health: Record<StockHealthBucket, number> = {
    healthy: 0,
    low: 0,
    critical: 0,
    out: 0,
  }
  const agingCounts = { d0_30: 0, d31_60: 0, d61_90: 0, d90_plus: 0 }

  for (const p of active) {
    totalUnits += p.currentStock
    stockValue += p.currentStock * p.purchasePrice

    const h = stockHealth(p)
    health[h] += 1

    if (p.currentStock <= 0) outOfStockCount += 1
    else if (p.currentStock <= p.minimumStock) lowStockCount += 1

    const qty30 = saleQty30.get(p.id) ?? 0
    const lastMov = lastMovementDate(p.id, movements)
    const referenceDate = lastMov ?? p.updatedAt.slice(0, 10)
    const idleDays = daysSince(referenceDate, refDate)

    const isDead = p.currentStock > 0 && idleDays > DEAD_STOCK_DAYS
    if (isDead) {
      deadStockCount += 1
      deadStockValue += p.currentStock * p.purchasePrice
    } else if (qty30 >= FAST_MOVING_QTY_THRESHOLD) fastMovingCount += 1
    else if (p.currentStock > 0 && qty30 > 0 && qty30 < FAST_MOVING_QTY_THRESHOLD) slowMovingCount += 1

    if (p.currentStock > 0) {
      if (qty30 >= FAST_MOVING_QTY_THRESHOLD) movementFast += 1
      else if (qty30 > 0) movementSlow += 1
      else {
        movementNone += 1
        noMovementCount += 1
      }

      if (idleDays <= 30) agingCounts.d0_30 += 1
      else if (idleDays <= 60) agingCounts.d31_60 += 1
      else if (idleDays <= 90) agingCounts.d61_90 += 1
      else agingCounts.d90_plus += 1
    }
  }

  return {
    totalSkus: active.length,
    totalUnits,
    stockValue,
    lowStockCount,
    outOfStockCount,
    fastMovingCount,
    slowMovingCount,
    deadStockCount,
    deadStockValue,
    noMovementCount,
    health,
    aging: [
      { bucket: '0–30 Days', count: agingCounts.d0_30 },
      { bucket: '31–60 Days', count: agingCounts.d31_60 },
      { bucket: '61–90 Days', count: agingCounts.d61_90 },
      { bucket: '90+ Days', count: agingCounts.d90_plus },
    ],
    movement: { fast: movementFast, slow: movementSlow, none: movementNone },
  }
}
