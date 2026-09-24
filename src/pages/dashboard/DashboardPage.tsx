import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  IndianRupee,
  LayoutGrid,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useShallow } from 'zustand/react/shallow'
import { Can } from '@/components/auth/Can'
import { DatePresetToggle, parseDatePreset } from '@/components/shared/DatePresetToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartCard } from '@/components/ui/chart-card'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { useDmsStore } from '@/store/dms-store'
import {
  DASHBOARD_WIDGET_LABELS,
  DEFAULT_DASHBOARD_WIDGETS,
  usePrefsStore,
} from '@/store/prefs-store'
import {
  CHART_COLORS,
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TICK_SM,
  CHART_TOOLTIP,
} from '@/utils/chart-theme'
import {
  computeCogs,
  countDueInRange,
  filterConfirmedPurchases,
  filterConfirmedSales,
  grossProfitInRange,
  lowStockCount,
  netProfitInRange,
  percentChange,
  previousRange,
  stockValue,
  sumDueInRange,
  sumPurchasesInRange,
  sumSalesInRange,
} from '@/utils/dashboard-metrics'
import { type DatePreset, inDateRange, rangeForPreset } from '@/utils/date-range'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

function allWidgetIds(widgets: string[], hidden: string[]): string[] {
  const seen = new Set<string>()
  const ordered: string[] = []
  for (const id of DEFAULT_DASHBOARD_WIDGETS) {
    if (!seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  for (const id of [...widgets, ...hidden]) {
    if (!seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  return ordered
}

function truncateLabel(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

export default function DashboardPage() {
  const defaultDatePreset = usePrefsStore((s) => s.defaultDatePreset)
  const dashboardWidgets = usePrefsStore((s) => s.dashboardWidgets)
  const dashboardHidden = usePrefsStore((s) => s.dashboardHidden)
  const toggleWidget = usePrefsStore((s) => s.toggleWidget)
  const reorderWidgets = usePrefsStore((s) => s.reorderWidgets)
  const resetDashboard = usePrefsStore((s) => s.resetDashboard)

  const [preset, setPreset] = useState<DatePreset>(() => parseDatePreset(defaultDatePreset))
  const [customizeOpen, setCustomizeOpen] = useState(false)

  const range = useMemo(() => rangeForPreset(preset), [preset])
  const prevRange = useMemo(() => previousRange(range.from, range.to), [range])

  const {
    sales,
    purchases,
    products,
    customers,
    suppliers,
    expenses,
    distributors,
    payments,
    invoices,
  } = useDmsStore(
    useShallow((s) => ({
      sales: s.sales,
      purchases: s.purchases,
      products: s.products,
      customers: s.customers,
      suppliers: s.suppliers,
      expenses: s.expenses,
      distributors: s.distributors,
      payments: s.payments,
      invoices: s.invoices,
    })),
  )

  const confirmedSales = useMemo(() => filterConfirmedSales(sales), [sales])
  const confirmedPurchases = useMemo(() => filterConfirmedPurchases(purchases), [purchases])

  const todayRange = useMemo(() => rangeForPreset('today'), [])
  const yesterdayRange = useMemo(() => rangeForPreset('yesterday'), [])

  const kpi = useMemo(() => {
    const todaySales = sumSalesInRange(confirmedSales, todayRange.from, todayRange.to)
    const yesterdaySales = sumSalesInRange(confirmedSales, yesterdayRange.from, yesterdayRange.to)

    const periodSales = sumSalesInRange(confirmedSales, range.from, range.to)
    const prevPeriodSales = sumSalesInRange(confirmedSales, prevRange.from, prevRange.to)

    const periodPurchase = sumPurchasesInRange(confirmedPurchases, range.from, range.to)
    const prevPeriodPurchase = sumPurchasesInRange(confirmedPurchases, prevRange.from, prevRange.to)

    const gross = grossProfitInRange(confirmedSales, products, range.from, range.to)
    const prevGross = grossProfitInRange(confirmedSales, products, prevRange.from, prevRange.to)

    const net = netProfitInRange(confirmedSales, products, expenses, range.from, range.to)
    const prevNet = netProfitInRange(confirmedSales, products, expenses, prevRange.from, prevRange.to)

    const receivables = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0)
    const payables = suppliers.reduce((sum, x) => sum + Math.max(0, x.currentBalance), 0)
    const stock = stockValue(products)
    const lowStock = lowStockCount(products)

    const overdueCount = countDueInRange(confirmedSales, range.from, range.to)
    const prevOverdueCount = countDueInRange(confirmedSales, prevRange.from, prevRange.to)
    const overdueDueSum = sumDueInRange(confirmedSales, range.from, range.to)

    const thisMonth = rangeForPreset('this_month')
    const lastMonth = rangeForPreset('last_month')
    const monthlySales = sumSalesInRange(confirmedSales, thisMonth.from, thisMonth.to)
    const prevMonthlySales = sumSalesInRange(confirmedSales, lastMonth.from, lastMonth.to)

    return {
      todaySales,
      yesterdaySales,
      monthlySales,
      prevMonthlySales,
      periodSales,
      prevPeriodSales,
      periodPurchase,
      prevPeriodPurchase,
      gross,
      prevGross,
      net,
      prevNet,
      receivables,
      payables,
      stock,
      lowStock,
      overdueCount,
      prevOverdueCount,
      overdueDueSum,
    }
  }, [
    confirmedSales,
    confirmedPurchases,
    products,
    customers,
    suppliers,
    expenses,
    distributors,
    payments,
    invoices,
    range,
    prevRange,
    todayRange,
    yesterdayRange,
  ])

  const salesByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of confirmedSales) {
      if (!inDateRange(s.date, range.from, range.to)) continue
      map.set(s.date, (map.get(s.date) ?? 0) + s.grandTotal)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date: formatDate(date), total }))
  }, [confirmedSales, range])

  const purchasesByDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of confirmedPurchases) {
      if (!inDateRange(p.date, range.from, range.to)) continue
      map.set(p.date, (map.get(p.date) ?? 0) + p.grandTotal)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date: formatDate(date), total }))
  }, [confirmedPurchases, range])

  const salesVsPurchase = useMemo(() => {
    const keys = new Set<string>()
    salesByDay.forEach((d) => keys.add(d.date))
    purchasesByDay.forEach((d) => keys.add(d.date))
    const salesMap = Object.fromEntries(salesByDay.map((d) => [d.date, d.total]))
    const purMap = Object.fromEntries(purchasesByDay.map((d) => [d.date, d.total]))
    return [...keys].sort().map((date) => ({
      date,
      sales: salesMap[date] ?? 0,
      purchase: purMap[date] ?? 0,
    }))
  }, [salesByDay, purchasesByDay])

  const topProducts = useMemo(() => {
    const qty = new Map<string, { name: string; q: number }>()
    for (const s of confirmedSales) {
      if (!inDateRange(s.date, range.from, range.to)) continue
      for (const item of s.items) {
        const cur = qty.get(item.productId) ?? { name: item.productName, q: 0 }
        cur.q += item.quantity
        qty.set(item.productId, cur)
      }
    }
    return [...qty.values()]
      .sort((a, b) => b.q - a.q)
      .slice(0, 8)
      .map((x) => ({ name: truncateLabel(x.name, 18), quantity: x.q }))
  }, [confirmedSales, range])

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of confirmedSales) {
      if (!inDateRange(s.date, range.from, range.to)) continue
      map.set(s.customerName, (map.get(s.customerName) ?? 0) + s.grandTotal)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, total]) => ({ name: truncateLabel(name, 16), total }))
  }, [confirmedSales, range])

  const topDistributors = useMemo(
    () =>
      [...distributors]
        .filter((d) => d.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance)
        .slice(0, 8)
        .map((d) => ({ name: truncateLabel(d.name, 16), total: d.currentBalance })),
    [distributors],
  )

  const topReceivables = useMemo(
    () =>
      [...customers]
        .filter((c) => c.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance)
        .slice(0, 8)
        .map((c) => ({ name: truncateLabel(c.name, 16), balance: c.currentBalance })),
    [customers],
  )

  const topPayables = useMemo(
    () =>
      [...suppliers]
        .filter((s) => s.currentBalance > 0)
        .sort((a, b) => b.currentBalance - a.currentBalance)
        .slice(0, 8)
        .map((s) => ({ name: truncateLabel(s.name, 16), balance: s.currentBalance })),
    [suppliers],
  )

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.status === 'active' && p.currentStock <= p.minimumStock)
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, 10),
    [products],
  )

  const recentTransactions = useMemo(() => {
    const rows: { id: string; date: string; type: 'Sale' | 'Purchase'; party: string; amount: number }[] =
      []
    for (const s of confirmedSales) {
      rows.push({
        id: s.id,
        date: s.date,
        type: 'Sale',
        party: s.customerName,
        amount: s.grandTotal,
      })
    }
    for (const p of confirmedPurchases) {
      rows.push({
        id: p.id,
        date: p.date,
        type: 'Purchase',
        party: p.supplierName,
        amount: p.grandTotal,
      })
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 12)
  }, [confirmedSales, confirmedPurchases])

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .slice(0, 12),
    [payments],
  )

  const recentInvoices = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
        .slice(0, 12),
    [invoices],
  )

  const expenseOverview = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      if (!inDateRange(e.date, range.from, range.to)) continue
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    }
    return [...map.entries()].map(([category, amount]) => ({ category, amount }))
  }, [expenses, range])

  const grossProfitByDay = useMemo(() => {
    const dates = new Set<string>()
    for (const s of confirmedSales) {
      if (inDateRange(s.date, range.from, range.to)) dates.add(s.date)
    }
    return [...dates]
      .sort()
      .map((date) => ({
        date: formatDate(date),
        profit: grossProfitInRange(
          confirmedSales.filter((s) => s.date === date),
          products,
          date,
          date,
        ),
      }))
  }, [confirmedSales, products, range])

  const periodRevenue = sumSalesInRange(confirmedSales, range.from, range.to)
  const periodCogs = computeCogs(confirmedSales, products, range.from, range.to)
  const grossMarginPct = periodRevenue > 0 ? ((kpi.gross / periodRevenue) * 100) : 0

  const visibleWidgets = useMemo(
    () => dashboardWidgets.filter((id) => !dashboardHidden.includes(id)),
    [dashboardWidgets, dashboardHidden],
  )

  const customizeWidgetIds = useMemo(
    () => allWidgetIds(dashboardWidgets, dashboardHidden),
    [dashboardWidgets, dashboardHidden],
  )

  const currencyTooltip = (v: number | string | undefined) => formatCurrency(Number(v ?? 0))

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'sales_overview':
        return (
          <ChartCard key={widgetId} title="Sales Overview">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="date" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="total" fill={CHART_COLORS[5]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'purchase_overview':
        return (
          <ChartCard key={widgetId} title="Purchase Overview">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={purchasesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="date" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="total" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'sales_vs_purchase':
        return (
          <ChartCard key={widgetId} title="Sales vs Purchase">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={salesVsPurchase}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="date" tick={CHART_TICK} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke={CHART_COLORS[5]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="purchase" stroke={CHART_COLORS[2]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'top_products':
        return (
          <ChartCard key={widgetId} title="Top Selling Products">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis type="number" tick={CHART_TICK} />
                <YAxis type="category" dataKey="name" width={100} tick={CHART_TICK_SM} />
                <Tooltip {...CHART_TOOLTIP} />
                <Bar dataKey="quantity" fill={CHART_COLORS[3]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'top_customers':
        return (
          <ChartCard key={widgetId} title="Top Customers">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topCustomers}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="name" tick={CHART_TICK_SM} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="total" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'top_distributors':
        return (
          <ChartCard key={widgetId} title="Top Distributors">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topDistributors}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis dataKey="name" tick={CHART_TICK_SM} />
                <YAxis tick={CHART_TICK} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="total" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'outstanding_receivables':
        return (
          <ChartCard key={widgetId} title="Outstanding Receivables">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topReceivables} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis type="number" tick={CHART_TICK} />
                <YAxis type="category" dataKey="name" width={100} tick={CHART_TICK_SM} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="balance" fill={CHART_COLORS[1]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'outstanding_payables':
        return (
          <ChartCard key={widgetId} title="Outstanding Payables">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topPayables} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                <XAxis type="number" tick={CHART_TICK} />
                <YAxis type="category" dataKey="name" width={100} tick={CHART_TICK_SM} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                <Bar dataKey="balance" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )
      case 'low_stock':
        return (
          <ChartCard key={widgetId} title="Low Stock Products">
            {lowStockProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">All products are above minimum stock.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                      <th className="py-2 pr-2 font-medium">Product</th>
                      <th className="py-2 pr-2 font-medium">SKU</th>
                      <th className="py-2 pr-2 font-medium text-right">Stock</th>
                      <th className="py-2 font-medium text-right">Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id} className="border-b border-border/60">
                        <td className="py-2 pr-2 text-ink">{truncateLabel(p.name, 28)}</td>
                        <td className="py-2 pr-2 text-ink-muted">{p.sku}</td>
                        <td className="py-2 pr-2 text-right tabular-nums text-danger">{p.currentStock}</td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">{p.minimumStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-3 border-t border-border pt-3">
              <Can module="stock" action="view">
                <Link to="/inventory/low-stock" className="text-sm font-medium text-brand-700 hover:underline">
                  View all low stock →
                </Link>
              </Can>
            </div>
          </ChartCard>
        )
      case 'recent_transactions':
        return (
          <ChartCard key={widgetId} title="Recent Transactions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                    <th className="py-2 pr-2 font-medium">Date</th>
                    <th className="py-2 pr-2 font-medium">Type</th>
                    <th className="py-2 pr-2 font-medium">Party</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((row) => (
                    <tr key={`${row.type}-${row.id}`} className="border-b border-border/60">
                      <td className="py-2 pr-2 tabular-nums text-ink-muted">{formatDate(row.date)}</td>
                      <td className="py-2 pr-2">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-xs font-medium',
                            row.type === 'Sale' ? 'bg-success-bg text-success' : 'bg-info-bg text-info',
                          )}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-ink">{truncateLabel(row.party, 22)}</td>
                      <td className="py-2 text-right tabular-nums text-ink">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )
      case 'expense_overview':
        return (
          <ChartCard key={widgetId} title="Expense Overview" className="lg:col-span-2">
            {expenseOverview.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">No expenses in this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={expenseOverview}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(props) => String(props.name ?? '')}
                  >
                    {expenseOverview.map((_, i) => (
                      <Cell key={i} fill={Object.values(CHART_COLORS)[i % 5]} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        )
      case 'recent_payments':
        return (
          <ChartCard key={widgetId} title="Recent Payments">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                    <th className="py-2 pr-2 font-medium">Date</th>
                    <th className="py-2 pr-2 font-medium">Type</th>
                    <th className="py-2 pr-2 font-medium">Party</th>
                    <th className="py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-2 tabular-nums text-ink-muted">{formatDate(row.date)}</td>
                      <td className="py-2 pr-2 text-ink">{row.type === 'received' ? 'Received' : 'Paid'}</td>
                      <td className="py-2 pr-2 text-ink">{truncateLabel(row.partyName, 24)}</td>
                      <td className="py-2 text-right tabular-nums text-ink">{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )
      case 'recent_invoices':
        return (
          <ChartCard key={widgetId} title="Recent Invoices">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                    <th className="py-2 pr-2 font-medium">Date</th>
                    <th className="py-2 pr-2 font-medium">Invoice</th>
                    <th className="py-2 pr-2 font-medium">Customer</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2 pr-2 tabular-nums text-ink-muted">{formatDate(row.date)}</td>
                      <td className="py-2 pr-2 text-ink">{row.invoiceNo}</td>
                      <td className="py-2 pr-2 text-ink">{truncateLabel(row.customerName, 24)}</td>
                      <td className="py-2 text-right tabular-nums text-ink">{formatCurrency(row.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )
      case 'gross_profit':
        return (
          <Card key={widgetId} className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Gross Profit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Gross profit</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums">{formatCurrency(kpi.gross)}</p>
                  {percentChange(kpi.gross, kpi.prevGross) !== undefined ? (
                    <p className="mt-1 text-xs text-ink-muted">
                      vs {formatCurrency(kpi.prevGross)} prior period
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">Revenue</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                    {formatCurrency(periodRevenue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-muted">COGS / margin</p>
                  <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                    {formatCurrency(periodCogs)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{formatNumber(grossMarginPct, 1)}% gross margin</p>
                </div>
              </div>
              {grossProfitByDay.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={grossProfitByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
                    <XAxis dataKey="date" tick={CHART_TICK_SM} />
                    <YAxis tick={CHART_TICK_SM} />
                    <Tooltip {...CHART_TOOLTIP} formatter={(v) => currencyTooltip(v as number)} />
                    <Line type="monotone" dataKey="profit" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </CardContent>
          </Card>
        )
      case 'net_profit':
        return (
          <Card key={widgetId}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Net Profit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-2xl font-semibold tabular-nums text-ink">{formatCurrency(kpi.net)}</p>
              <p className="text-sm text-ink-muted">
                Expenses in period: {formatCurrency(expenses.filter((e) => inDateRange(e.date, range.from, range.to)).reduce((s, e) => s + e.amount, 0))}
              </p>
              <p className="text-xs text-ink-subtle">
                {percentChange(kpi.net, kpi.prevNet) !== undefined
                  ? `${formatNumber(percentChange(kpi.net, kpi.prevNet) ?? 0, 1)}% vs previous period`
                  : 'Previous period baseline unavailable'}
              </p>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  const todaySalesChange = percentChange(kpi.todaySales, kpi.yesterdaySales)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Performance overview · ${formatDate(range.from, 'long')} – ${formatDate(range.to, 'long')}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCustomizeOpen(true)}>
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Customize
            </Button>
            <DatePresetToggle value={preset} onChange={setPreset} compact />
          </div>
        }
      />

      {kpi.lowStock > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <span>
              <strong>{formatNumber(kpi.lowStock)}</strong> products are below minimum stock
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Can module="stock" action="view">
              <Link to="/inventory/low-stock">
                <Button variant="outline" size="sm" type="button">
                  View Products
                </Button>
              </Link>
            </Can>
            <Can module="purchase" action="create">
              <Link to="/transactions/purchases/new">
                <Button variant="primary" size="sm" type="button">
                  Create Purchase
                </Button>
              </Link>
            </Can>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(kpi.todaySales)}
          icon={IndianRupee}
          changePercent={todaySalesChange}
          trendDirection={
            todaySalesChange === undefined ? 'flat' : todaySalesChange >= 0 ? 'up' : 'down'
          }
          previousValue={formatCurrency(kpi.yesterdaySales)}
        />
        <StatCard
          label="Monthly Sales"
          value={formatCurrency(kpi.monthlySales)}
          icon={ShoppingBag}
          changePercent={percentChange(kpi.monthlySales, kpi.prevMonthlySales)}
          previousValue={formatCurrency(kpi.prevMonthlySales)}
        />
        <StatCard
          label="Period Purchase"
          value={formatCurrency(kpi.periodPurchase)}
          icon={Truck}
          changePercent={percentChange(kpi.periodPurchase, kpi.prevPeriodPurchase)}
          previousValue={formatCurrency(kpi.prevPeriodPurchase)}
        />
        <StatCard
          label="Gross Profit"
          value={formatCurrency(kpi.gross)}
          icon={TrendingUp}
          changePercent={percentChange(kpi.gross, kpi.prevGross)}
          previousValue={formatCurrency(kpi.prevGross)}
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(kpi.net)}
          icon={TrendingUp}
          changePercent={percentChange(kpi.net, kpi.prevNet)}
          previousValue={formatCurrency(kpi.prevNet)}
        />
        <StatCard label="Receivables" value={formatCurrency(kpi.receivables)} icon={Wallet} trendDirection="flat" />
        <StatCard label="Payables" value={formatCurrency(kpi.payables)} icon={Wallet} trendDirection="flat" />
        <StatCard label="Stock Value" value={formatCurrency(kpi.stock)} icon={Package} trendDirection="flat" />
        <StatCard label="Low Stock" value={formatNumber(kpi.lowStock)} icon={AlertTriangle} trendDirection="flat" />
        <StatCard
          label={`Overdue Payments · ${formatCurrency(kpi.overdueDueSum)} due`}
          value={formatNumber(kpi.overdueCount)}
          icon={AlertTriangle}
          changePercent={percentChange(kpi.overdueCount, kpi.prevOverdueCount)}
          previousValue={formatNumber(kpi.prevOverdueCount)}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">{visibleWidgets.map((id) => renderWidget(id))}</div>

      <Modal open={customizeOpen} onClose={() => setCustomizeOpen(false)} title="Customize dashboard" size="md">
        <p className="mb-4 text-sm text-ink-muted">Choose which charts and tables appear on your dashboard.</p>
        <ul className="space-y-2">
          {customizeWidgetIds.map((id, index) => {
            const visible = dashboardWidgets.includes(id)
            return (
              <li key={id}>
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-surface">
                  <label className="flex min-w-0 grow cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-strong accent-brand-700"
                      checked={visible}
                      onChange={() => toggleWidget(id)}
                    />
                    <span className="truncate text-sm font-medium text-ink">{DASHBOARD_WIDGET_LABELS[id] ?? id}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      aria-label={`Move ${DASHBOARD_WIDGET_LABELS[id] ?? id} up`}
                      disabled={index === 0}
                      onClick={() => {
                        if (index === 0) return
                        const reordered = [...customizeWidgetIds]
                        const temp = reordered[index - 1]
                        reordered[index - 1] = reordered[index]
                        reordered[index] = temp
                        reorderWidgets(reordered.filter((x) => dashboardWidgets.includes(x)))
                      }}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      aria-label={`Move ${DASHBOARD_WIDGET_LABELS[id] ?? id} down`}
                      disabled={index === customizeWidgetIds.length - 1}
                      onClick={() => {
                        if (index === customizeWidgetIds.length - 1) return
                        const reordered = [...customizeWidgetIds]
                        const temp = reordered[index + 1]
                        reordered[index + 1] = reordered[index]
                        reordered[index] = temp
                        reorderWidgets(reordered.filter((x) => dashboardWidgets.includes(x)))
                      }}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              resetDashboard()
            }}
          >
            Reset layout
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => setCustomizeOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  )
}
