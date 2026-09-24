import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Banknote,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { ChartCard } from '@/components/ui/chart-card'
import { Card, CardContent } from '@/components/ui/card'
import { DatePresetToggle, parseDatePreset } from '@/components/shared/DatePresetToggle'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDmsStore } from '@/store/dms-store'
import { usePrefsStore } from '@/store/prefs-store'
import { cn } from '@/utils/cn'
import { CHART_COLORS, CHART_GRID_STROKE, CHART_TICK, CHART_TOOLTIP } from '@/utils/chart-theme'
import { type DatePreset, rangeForPreset } from '@/utils/date-range'
import {
  buildFinancialTrends,
  computeFinancialKpis,
  profitByCategory,
  profitByCustomer,
  profitByDistributor,
  profitByProduct,
  type ProfitBreakdownRow,
} from '@/utils/financial-summary-metrics'
import { formatCurrency, formatDate } from '@/utils/format'

export default function FinancialSummaryPage() {
  const sales = useDmsStore((s) => s.sales)
  const products = useDmsStore((s) => s.products)
  const expenses = useDmsStore((s) => s.expenses)
  const salesReturns = useDmsStore((s) => s.salesReturns)
  const categories = useDmsStore((s) => s.categories)
  const distributors = useDmsStore((s) => s.distributors)
  const defaultDatePreset = usePrefsStore((s) => s.defaultDatePreset)

  const [preset, setPreset] = useState<DatePreset>(() => parseDatePreset(defaultDatePreset))
  const [breakdown, setBreakdown] = useState<'product' | 'category' | 'customer' | 'distributor'>(
    'product',
  )

  const range = useMemo(() => rangeForPreset(preset), [preset])

  const kpis = useMemo(
    () => computeFinancialKpis(sales, products, expenses, salesReturns, range.from, range.to),
    [sales, products, expenses, salesReturns, range],
  )

  const trends = useMemo(
    () => buildFinancialTrends(sales, products, expenses, salesReturns, range.from, range.to),
    [sales, products, expenses, salesReturns, range],
  )

  const byProduct = useMemo(
    () => profitByProduct(sales, products, range.from, range.to),
    [sales, products, range],
  )
  const byCategory = useMemo(
    () => profitByCategory(sales, products, categories, range.from, range.to),
    [sales, products, categories, range],
  )
  const byCustomer = useMemo(
    () => profitByCustomer(sales, products, distributors, range.from, range.to),
    [sales, products, distributors, range],
  )
  const byDistributor = useMemo(
    () => profitByDistributor(sales, products, distributors, range.from, range.to),
    [sales, products, distributors, range],
  )

  const activeBreakdown =
    breakdown === 'product'
      ? byProduct
      : breakdown === 'category'
        ? byCategory
        : breakdown === 'customer'
          ? byCustomer
          : byDistributor

  return (
    <div>
      <PageHeader
        title="Financial summary"
        description={`${formatDate(range.from, 'long')} – ${formatDate(range.to, 'long')}`}
        actions={<DatePresetToggle value={preset} onChange={setPreset} compact />}
      />

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Revenue" value={formatCurrency(kpis.revenue)} icon={Banknote} />
          <StatCard label="COGS" value={formatCurrency(kpis.cogs)} icon={Receipt} />
          <StatCard
            label="Gross profit"
            value={formatCurrency(kpis.grossProfit)}
            icon={TrendingUp}
            trend={{
              value: `Margin ${kpis.grossMarginPct}%`,
              positive: kpis.grossProfit >= 0,
            }}
          />
          <StatCard label="Expenses" value={formatCurrency(kpis.expenses)} icon={Wallet} />
          <StatCard
            label="Net profit"
            value={formatCurrency(kpis.netProfit)}
            icon={kpis.netProfit >= 0 ? TrendingUp : TrendingDown}
            trend={{
              value: `Margin ${kpis.netMarginPct}%`,
              positive: kpis.netProfit >= 0,
            }}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard title="Revenue trend" description="Net sales over the selected period">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={CHART_TICK} interval="preserveStartEnd" />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} width={40} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={CHART_COLORS[1]}
                  fill={CHART_COLORS[1]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Profit trend" description="Gross and net profit">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={CHART_TICK} interval="preserveStartEnd" />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} width={40} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross profit"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net profit"
                  stroke={CHART_COLORS[3]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Expense trend" description="Operating expenses">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={CHART_TICK} interval="preserveStartEnd" />
                <YAxis tick={CHART_TICK} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} width={40} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke={CHART_COLORS[4]}
                  fill={CHART_COLORS[4]}
                  fillOpacity={0.18}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-4">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Profit by</h2>
              <p className="text-sm text-ink-muted">
                Gross profit contribution ranked for the selected period
              </p>
            </div>

            <Tabs
              value={breakdown}
              onValueChange={(v) =>
                setBreakdown(v as 'product' | 'category' | 'customer' | 'distributor')
              }
            >
              <TabsList>
                <TabsTrigger value="product">Product</TabsTrigger>
                <TabsTrigger value="category">Category</TabsTrigger>
                <TabsTrigger value="customer">Customer</TabsTrigger>
                <TabsTrigger value="distributor">Distributor</TabsTrigger>
              </TabsList>

              <TabsContent value={breakdown} className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard
                    title={`${breakdownLabel(breakdown)} profit`}
                    description="Top contributors by gross profit"
                    height={300}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeBreakdown.slice(0, 8)} layout="vertical" margin={{ left: 8 }}>
                        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                        <XAxis type="number" tick={CHART_TICK} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={110}
                          tick={CHART_TICK}
                        />
                        <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
                        <Bar dataKey="grossProfit" name="Gross profit" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <BreakdownTable rows={activeBreakdown} showQty={breakdown === 'product' || breakdown === 'category'} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function breakdownLabel(kind: string) {
  switch (kind) {
    case 'product':
      return 'Product'
    case 'category':
      return 'Category'
    case 'customer':
      return 'Customer'
    case 'distributor':
      return 'Distributor'
    default:
      return kind
  }
}

function BreakdownTable({
  rows,
  showQty,
}: {
  rows: ProfitBreakdownRow[]
  showQty?: boolean
}) {
  if (rows.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed border-border text-sm text-ink-muted">
        No profit data in this period.
      </div>
    )
  }

  return (
    <div className="max-h-[300px] overflow-x-auto overflow-y-auto rounded-md border border-border">
      <table className="erp-table w-full min-w-[520px] text-sm">
        <caption className="sr-only">Profit breakdown by name</caption>
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
            <th scope="col" className="px-3 py-2 font-semibold">Name</th>
            {showQty ? <th scope="col" className="px-3 py-2 text-right font-semibold">Qty</th> : null}
            <th scope="col" className="px-3 py-2 text-right font-semibold">Revenue</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">COGS</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Gross profit</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/70">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              {showQty ? (
                <td className="px-3 py-2 text-right tabular-nums">{row.quantity ?? 0}</td>
              ) : null}
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.cogs)}</td>
              <td
                className={cn(
                  'px-3 py-2 text-right font-medium tabular-nums',
                  row.grossProfit < 0 && 'text-danger',
                )}
              >
                {formatCurrency(row.grossProfit)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-ink-muted">{row.marginPct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
