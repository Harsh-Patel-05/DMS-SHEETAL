import {
  AlertTriangle,
  Archive,
  Boxes,
  PackageX,
  TrendingDown,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { InventoryStockAlerts } from '@/components/inventory/InventoryStockAlerts'
import { ChartCard } from '@/components/ui/chart-card'
import { StatCard } from '@/components/ui/stat-card'
import { useDmsStore } from '@/store/dms-store'
import { CHART_COLORS, CHART_GRID_STROKE } from '@/utils/chart-theme'
import { formatCurrency, formatNumber } from '@/utils/format'
import { computeInventoryAlerts, computeInventoryOverview, MOVEMENT_WINDOW_DAYS } from '@/utils/inventory-metrics'

const HEALTH_COLORS: Record<string, string> = {
  Healthy: CHART_COLORS[1],
  Low: CHART_COLORS[3],
  Critical: CHART_COLORS[4],
  'Out of Stock': CHART_COLORS[5],
}

const MOVEMENT_COLORS = [CHART_COLORS[1], CHART_COLORS[3], CHART_COLORS[5]]

export default function InventoryOverviewPage() {
  const products = useDmsStore((s) => s.products)
  const sales = useDmsStore((s) => s.sales)
  const movements = useDmsStore((s) => s.movements)

  const metrics = useMemo(
    () => computeInventoryOverview(products, sales, movements),
    [products, sales, movements],
  )

  const alerts = useMemo(() => computeInventoryAlerts(metrics), [metrics])

  const healthChart = useMemo(
    () =>
      [
        { name: 'Healthy', value: metrics.health.healthy },
        { name: 'Low', value: metrics.health.low },
        { name: 'Critical', value: metrics.health.critical },
        { name: 'Out of Stock', value: metrics.health.out },
      ].filter((d) => d.value > 0),
    [metrics.health],
  )

  const agingChart = useMemo(
    () => metrics.aging.map((a) => ({ name: a.bucket, count: a.count })),
    [metrics.aging],
  )

  const movementChart = useMemo(
    () => [
      { name: 'Fast moving', count: metrics.movement.fast },
      { name: 'Slow moving', count: metrics.movement.slow },
      { name: 'No movement', count: metrics.movement.none },
    ],
    [metrics.movement],
  )

  return (
    <div className="space-y-6">
      <InventoryStockAlerts alerts={alerts} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total SKUs" value={formatNumber(metrics.totalSkus)} icon={Boxes} />
        <StatCard label="Total units" value={formatNumber(metrics.totalUnits)} icon={Warehouse} />
        <StatCard label="Stock value" value={formatCurrency(metrics.stockValue)} icon={TrendingUp} />
        <StatCard label="Low stock" value={formatNumber(metrics.lowStockCount)} icon={AlertTriangle} />
        <StatCard label="Out of stock" value={formatNumber(metrics.outOfStockCount)} icon={PackageX} />
        <StatCard label="Fast moving" value={formatNumber(metrics.fastMovingCount)} icon={TrendingUp} />
        <StatCard label="Slow moving" value={formatNumber(metrics.slowMovingCount)} icon={TrendingDown} />
        <StatCard label="Dead stock" value={formatNumber(metrics.deadStockCount)} icon={Archive} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Stock health" description="Active SKUs by replenishment band">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={healthChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90}>
                {healthChart.map((entry) => (
                  <Cell key={entry.name} fill={HEALTH_COLORS[entry.name] ?? CHART_COLORS[2]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock aging" description="Days since last stock movement (in-stock SKUs)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={agingChart}>
              <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Product movement"
          description={`Sales velocity in the last ${MOVEMENT_WINDOW_DAYS} days (in-stock SKUs)`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={movementChart} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {movementChart.map((entry, index) => (
                  <Cell key={entry.name} fill={MOVEMENT_COLORS[index] ?? CHART_COLORS[2]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="erp-card space-y-4 p-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Stock health summary</h3>
            <p className="text-xs text-ink-muted">Counts by category</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-surface px-3 py-2">
              <dt className="text-xs text-ink-muted">Healthy</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatNumber(metrics.health.healthy)}</dd>
            </div>
            <div className="rounded-md border border-border bg-surface px-3 py-2">
              <dt className="text-xs text-ink-muted">Low</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatNumber(metrics.health.low)}</dd>
            </div>
            <div className="rounded-md border border-border bg-surface px-3 py-2">
              <dt className="text-xs text-ink-muted">Critical</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatNumber(metrics.health.critical)}</dd>
            </div>
            <div className="rounded-md border border-border bg-surface px-3 py-2">
              <dt className="text-xs text-ink-muted">Out of stock</dt>
              <dd className="text-lg font-semibold tabular-nums text-ink">{formatNumber(metrics.health.out)}</dd>
            </div>
          </dl>
          <div className="border-t border-border pt-3 text-sm">
            <p className="text-ink-muted">Dead stock value (90+ days idle)</p>
            <p className="font-semibold tabular-nums text-ink">{formatCurrency(metrics.deadStockValue)}</p>
            <p className="mt-1 text-xs text-ink-subtle">
              {formatNumber(metrics.noMovementCount)} SKU(s) with no sales in the last 30 days
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
