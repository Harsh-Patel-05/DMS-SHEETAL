import {
  AlertTriangle,
  ArrowLeft,
  IndianRupee,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
  Warehouse,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, subMonths } from 'date-fns'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActivityTimeline } from '@/components/shared/ActivityTimeline'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { ChartCard } from '@/components/ui/chart-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDmsStore } from '@/store/dms-store'
import { buildProductActivity } from '@/utils/activity-timeline'
import { calculateStockValue } from '@/utils/calculations'
import { CHART_COLORS, CHART_GRID_STROKE } from '@/utils/chart-theme'
import { filterConfirmedPurchases, filterConfirmedSales } from '@/utils/dashboard-metrics'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { stockHealth } from '@/utils/inventory-metrics'
import { cn } from '@/utils/cn'

const TABS = ['overview', 'stock', 'sales', 'purchases', 'movement', 'returns', 'profit', 'activity'] as const
type TabId = (typeof TABS)[number]

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

function lastMonths(count: number, ref = new Date()): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = subMonths(ref, i)
    out.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM yy') })
  }
  return out
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: TabId =
    tabParam && (TABS as readonly string[]).includes(tabParam) ? (tabParam as TabId) : 'overview'

  const product = useDmsStore((s) => s.products.find((p) => p.id === id))
  const categories = useDmsStore((s) => s.categories)
  const brands = useDmsStore((s) => s.brands)
  const units = useDmsStore((s) => s.units)
  const gstRates = useDmsStore((s) => s.gstRates)
  const allMovements = useDmsStore((s) => s.movements)
  const allSales = useDmsStore((s) => s.sales)
  const allPurchases = useDmsStore((s) => s.purchases)
  const allSalesReturns = useDmsStore((s) => s.salesReturns)
  const allPurchaseReturns = useDmsStore((s) => s.purchaseReturns)
  const allAdjustments = useDmsStore((s) => s.adjustments)

  const movements = useMemo(
    () =>
      allMovements
        .filter((m) => m.productId === id)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [allMovements, id],
  )

  const confirmedSales = useMemo(() => filterConfirmedSales(allSales), [allSales])
  const confirmedPurchases = useMemo(() => filterConfirmedPurchases(allPurchases), [allPurchases])

  const saleLines = useMemo(() => {
    const lines: Array<{
      saleId: string
      invoiceNo: string
      date: string
      qty: number
      rate: number
      amount: number
      cost: number
    }> = []
    if (!product) return lines
    for (const sale of confirmedSales) {
      for (const item of sale.items) {
        if (item.productId === id) {
          lines.push({
            saleId: sale.id,
            invoiceNo: sale.invoiceNo,
            date: sale.date,
            qty: item.quantity,
            rate: item.rate,
            amount: item.amount,
            cost: item.quantity * product.purchasePrice,
          })
        }
      }
    }
    return lines.sort((a, b) => b.date.localeCompare(a.date))
  }, [confirmedSales, id, product])

  const purchaseLines = useMemo(() => {
    const lines: Array<{
      purchaseId: string
      purchaseNo: string
      date: string
      qty: number
      rate: number
      amount: number
    }> = []
    for (const purchase of confirmedPurchases) {
      for (const item of purchase.items) {
        if (item.productId === id) {
          lines.push({
            purchaseId: purchase.id,
            purchaseNo: purchase.purchaseNo,
            date: purchase.date,
            qty: item.quantity,
            rate: item.rate,
            amount: item.amount,
          })
        }
      }
    }
    return lines.sort((a, b) => b.date.localeCompare(a.date))
  }, [confirmedPurchases, id])

  const salesReturns = useMemo(
    () =>
      allSalesReturns
        .filter((r) => r.productId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allSalesReturns, id],
  )

  const purchaseReturns = useMemo(
    () =>
      allPurchaseReturns
        .filter((r) => r.productId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allPurchaseReturns, id],
  )

  const salesTrend = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, { qty: 0, amount: 0 }]))
    for (const line of saleLines) {
      const key = monthKey(line.date)
      const row = byMonth.get(key)
      if (row) {
        row.qty += line.qty
        row.amount += line.amount
      }
    }
    return months.map((m) => ({
      name: m.label,
      qty: byMonth.get(m.key)?.qty ?? 0,
      amount: byMonth.get(m.key)?.amount ?? 0,
    }))
  }, [saleLines])

  const purchaseTrend = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, { qty: 0, amount: 0 }]))
    for (const line of purchaseLines) {
      const key = monthKey(line.date)
      const row = byMonth.get(key)
      if (row) {
        row.qty += line.qty
        row.amount += line.amount
      }
    }
    return months.map((m) => ({
      name: m.label,
      qty: byMonth.get(m.key)?.qty ?? 0,
      amount: byMonth.get(m.key)?.amount ?? 0,
    }))
  }, [purchaseLines])

  const movementTrend = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, { inQty: 0, outQty: 0 }]))
    for (const m of movements) {
      const key = monthKey(m.date)
      const row = byMonth.get(key)
      if (row) {
        row.inQty += m.quantityIn
        row.outQty += m.quantityOut
      }
    }
    return months.map((m) => ({
      name: m.label,
      in: byMonth.get(m.key)?.inQty ?? 0,
      out: byMonth.get(m.key)?.outQty ?? 0,
    }))
  }, [movements])

  const profitMetrics = useMemo(() => {
    if (!product) return null
    const revenue = saleLines.reduce((s, l) => s + l.amount, 0)
    const cogs = saleLines.reduce((s, l) => s + l.cost, 0)
    const grossProfit = revenue - cogs
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
    const unitMargin = product.sellingPrice - product.purchasePrice
    const onHandProfit = unitMargin * product.currentStock
    const soldQty = saleLines.reduce((s, l) => s + l.qty, 0)
    return { revenue, cogs, grossProfit, margin, unitMargin, onHandProfit, soldQty }
  }, [product, saleLines])

  const profitByMonth = useMemo(() => {
    if (!product) return []
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, { revenue: 0, cogs: 0 }]))
    for (const line of saleLines) {
      const key = monthKey(line.date)
      const row = byMonth.get(key)
      if (row) {
        row.revenue += line.amount
        row.cogs += line.cost
      }
    }
    return months.map((m) => {
      const row = byMonth.get(m.key)!
      return {
        name: m.label,
        profit: row.revenue - row.cogs,
        revenue: row.revenue,
      }
    })
  }, [saleLines, product])

  const activity = useMemo(
    () =>
      buildProductActivity({
        productId: id ?? '',
        sales: allSales,
        purchases: allPurchases,
        movements: allMovements,
        adjustments: allAdjustments,
        salesReturns: allSalesReturns,
        purchaseReturns: allPurchaseReturns,
      }),
    [id, allSales, allPurchases, allMovements, allAdjustments, allSalesReturns, allPurchaseReturns],
  )

  const setTab = (value: string) => {
    setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  }

  if (!product || !profitMetrics) {
    return (
      <EmptyState
        title="Product not found"
        description="This product may have been deleted or the link is invalid."
        action={
          <Link to="/master/products">
            <Button>Back to products</Button>
          </Link>
        }
      />
    )
  }

  const category = categories.find((c) => c.id === product.categoryId)?.name ?? '—'
  const brand = brands.find((b) => b.id === product.brandId)?.name ?? '—'
  const unit = units.find((u) => u.id === product.unitId)?.shortName ?? '—'
  const gstRate = gstRates.find((g) => g.id === product.gstRateId)?.rate ?? 0
  const stockValue = calculateStockValue(product.currentStock, product.purchasePrice)
  const health = stockHealth(product)
  const isLow = product.currentStock > 0 && product.currentStock <= product.minimumStock
  const isOut = product.currentStock <= 0

  return (
    <div className="space-y-4">
      <PageHeader
        title={product.name}
        description={`Product 360 · SKU ${product.sku} · HSN ${product.hsnCode}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="party" status={product.status} />
            <Link to="/master/products">
              <Button type="button" variant="outline" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Products
              </Button>
            </Link>
          </div>
        }
      />

      {(isLow || isOut) && (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3 text-sm',
            isOut ? 'border-danger/30 bg-danger/10 text-danger' : 'border-warning-border bg-warning-bg text-warning',
          )}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {isOut
              ? 'This product is out of stock.'
              : `Stock is at or below the low-stock threshold (${formatNumber(product.minimumStock)} ${unit}).`}
          </span>
          <Can module="purchase" action="create">
            <Link to="/transactions/purchases/new">
              <Button size="sm" variant="outline">
                Create purchase
              </Button>
            </Link>
          </Can>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Current stock" value={formatNumber(product.currentStock)} icon={Warehouse} />
        <StatCard label="Stock value" value={formatCurrency(stockValue)} icon={IndianRupee} />
        <StatCard label="Purchase price" value={formatCurrency(product.purchasePrice)} icon={ShoppingCart} />
        <StatCard label="Selling price" value={formatCurrency(product.sellingPrice)} icon={Tag} />
        <StatCard label="MRP" value={formatCurrency(product.mrp)} icon={Package} />
        <StatCard label="GST" value={`${gstRate}%`} icon={TrendingUp} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="movement">Movement</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Product profile</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-ink-muted">Category</span>
                  <p className="font-medium">{category}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Brand</span>
                  <p className="font-medium">{brand}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Unit</span>
                  <p className="font-medium">{unit}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Barcode</span>
                  <p className="font-medium">{product.barcode ?? '—'}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Low stock threshold</span>
                  <p className="font-medium tabular-nums">{formatNumber(product.minimumStock)}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Stock health</span>
                  <p className="font-medium capitalize">{health === 'out' ? 'Out of stock' : health}</p>
                </div>
                {product.description ? (
                  <div className="sm:col-span-2">
                    <span className="text-ink-muted">Description</span>
                    <p>{product.description}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pricing snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Purchase</span>
                  <span className="tabular-nums font-medium">{formatCurrency(product.purchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Selling</span>
                  <span className="tabular-nums font-medium">{formatCurrency(product.sellingPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">MRP</span>
                  <span className="tabular-nums font-medium">{formatCurrency(product.mrp)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="text-ink-muted">GST</span>
                  <span className="font-medium">{gstRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Unit margin</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(profitMetrics.unitMargin)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Sales trend" description="Confirmed sales — last 6 months">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Purchase trend" description="Confirmed purchases — last 6 months">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseTrend}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                  <Tooltip />
                  <Bar dataKey="amount" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Stock movement" description="Qty in vs out by month">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementTrend}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={36} />
                  <Tooltip />
                  <Area type="monotone" dataKey="in" stackId="1" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.35} />
                  <Area type="monotone" dataKey="out" stackId="2" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Profit contribution" description="Gross profit from sales (at current cost)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitByMonth}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                  <Tooltip />
                  <Bar dataKey="profit" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Current stock" value={`${formatNumber(product.currentStock)} ${unit}`} />
            <StatCard label="Opening stock" value={formatNumber(product.openingStock)} />
            <StatCard label="Low stock threshold" value={formatNumber(product.minimumStock)} />
            <StatCard label="Stock value" value={formatCurrency(stockValue)} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock health</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-ink-muted">Health band</p>
                <p className="font-semibold capitalize">
                  {health === 'out' ? 'Out of stock' : health}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Units above minimum</p>
                <p className="font-semibold tabular-nums">
                  {formatNumber(Math.max(0, product.currentStock - product.minimumStock))}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Last updated</p>
                <p className="font-semibold">{formatDate(product.updatedAt, 'datetime')}</p>
              </div>
            </CardContent>
          </Card>
          <ChartCard title="Stock movement" description="Monthly in / out quantities">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementTrend}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="in" name="In" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Out" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        <TabsContent value="sales">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Units sold"
              value={formatNumber(saleLines.reduce((s, l) => s + l.qty, 0))}
            />
            <StatCard
              label="Sales value"
              value={formatCurrency(saleLines.reduce((s, l) => s + l.amount, 0))}
            />
            <StatCard label="Sale lines" value={formatNumber(saleLines.length)} />
          </div>
          <ChartCard title="Sales trend" description="Amount by month" className="mb-4" height={256}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrend}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke={CHART_COLORS[1]} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {saleLines.length === 0 ? (
                <p className="text-ink-muted">No sales lines</p>
              ) : (
                saleLines.map((line, i) => (
                  <div key={`${line.saleId}-${i}`} className="flex justify-between border-b border-border py-2">
                    <div>
                      <Link
                        to={`/transactions/sales/${line.saleId}/edit`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {line.invoiceNo}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {formatDate(line.date)} · @ {formatCurrency(line.rate)}
                      </p>
                    </div>
                    <span className="tabular-nums">
                      {formatNumber(line.qty)} · {formatCurrency(line.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Units purchased"
              value={formatNumber(purchaseLines.reduce((s, l) => s + l.qty, 0))}
            />
            <StatCard
              label="Purchase value"
              value={formatCurrency(purchaseLines.reduce((s, l) => s + l.amount, 0))}
            />
            <StatCard label="Purchase lines" value={formatNumber(purchaseLines.length)} />
          </div>
          <ChartCard title="Purchase trend" description="Amount by month" className="mb-4" height={256}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchaseTrend}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                <Tooltip />
                <Bar dataKey="amount" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {purchaseLines.length === 0 ? (
                <p className="text-ink-muted">No purchase lines</p>
              ) : (
                purchaseLines.map((line, i) => (
                  <div key={`${line.purchaseId}-${i}`} className="flex justify-between border-b border-border py-2">
                    <div>
                      <Link
                        to={`/transactions/purchases/${line.purchaseId}/edit`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {line.purchaseNo}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {formatDate(line.date)} · @ {formatCurrency(line.rate)}
                      </p>
                    </div>
                    <span className="tabular-nums">
                      {formatNumber(line.qty)} · {formatCurrency(line.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement">
          <ChartCard title="Stock movement" description="Monthly quantity in / out" className="mb-4" height={256}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementTrend}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="in" name="In" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.4} />
                <Area type="monotone" dataKey="out" name="Out" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movement log</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Type</th>
                    <th className="py-2 pr-2">Reference</th>
                    <th className="py-2 pr-2 text-right">In</th>
                    <th className="py-2 pr-2 text-right">Out</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-2 pr-2">{formatDate(m.date)}</td>
                      <td className="py-2 pr-2 capitalize">{m.type}</td>
                      <td className="py-2 pr-2">{m.reference}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{m.quantityIn || '—'}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{m.quantityOut || '—'}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatNumber(m.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 ? <p className="pt-4 text-ink-muted">No movements</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {salesReturns.length === 0 ? (
                <p className="text-ink-muted">No sales returns</p>
              ) : (
                salesReturns.map((r) => (
                  <div key={r.id} className="flex justify-between border-b border-border py-2">
                    <span>
                      {r.returnNo} · {r.invoiceNo} · {formatDate(r.date)} · qty {formatNumber(r.returnQuantity)}
                    </span>
                    <span className="tabular-nums">{formatCurrency(r.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {purchaseReturns.length === 0 ? (
                <p className="text-ink-muted">No purchase returns</p>
              ) : (
                purchaseReturns.map((r) => (
                  <div key={r.id} className="flex justify-between border-b border-border py-2">
                    <span>
                      {r.returnNo} · {r.purchaseNo} · {formatDate(r.date)} · qty{' '}
                      {formatNumber(r.returnQuantity)}
                    </span>
                    <span className="tabular-nums">{formatCurrency(r.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrency(profitMetrics.revenue)} />
            <StatCard label="COGS" value={formatCurrency(profitMetrics.cogs)} />
            <StatCard label="Gross profit" value={formatCurrency(profitMetrics.grossProfit)} />
            <StatCard label="Margin" value={`${profitMetrics.margin.toFixed(1)}%`} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Unit margin" value={formatCurrency(profitMetrics.unitMargin)} />
            <StatCard label="On-hand profit potential" value={formatCurrency(profitMetrics.onHandProfit)} />
            <StatCard label="Units sold" value={formatNumber(profitMetrics.soldQty)} />
          </div>
          <ChartCard title="Profit contribution" description="Monthly gross profit from this SKU">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitByMonth}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                <Tooltip />
                <Bar dataKey="profit" fill={CHART_COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline events={activity} maxHeightClassName="max-h-[32rem]" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
