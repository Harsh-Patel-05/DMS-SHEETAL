import {
  CreditCard,
  IndianRupee,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
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
import { CHART_COLORS, CHART_GRID_STROKE } from '@/utils/chart-theme'
import { filterConfirmedSales } from '@/utils/dashboard-metrics'
import { buildCustomerActivity } from '@/utils/activity-timeline'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import { format, subMonths } from 'date-fns'

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

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab =
    tabParam && ['overview', 'sales', 'payments', 'ledger', 'returns'].includes(tabParam)
      ? tabParam
      : 'overview'

  const customer = useDmsStore((s) => s.customers.find((c) => c.id === id))
  const allSales = useDmsStore((s) => s.sales)
  const allInvoices = useDmsStore((s) => s.invoices)
  const allPayments = useDmsStore((s) => s.payments)
  const allLedger = useDmsStore((s) => s.ledger)
  const allReturns = useDmsStore((s) => s.salesReturns)

  const sales = useMemo(
    () => filterConfirmedSales(allSales.filter((x) => x.customerId === id)),
    [allSales, id],
  )
  const invoices = useMemo(
    () =>
      allInvoices
        .filter((i) => i.customerId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allInvoices, id],
  )
  const payments = useMemo(
    () =>
      allPayments
        .filter((p) => p.partyId === id && p.partyType === 'customer')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allPayments, id],
  )
  const ledger = useMemo(
    () =>
      allLedger
        .filter((l) => l.partyId === id && l.partyType === 'customer')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allLedger, id],
  )
  const returns = useMemo(
    () => allReturns.filter((r) => r.customerId === id).sort((a, b) => b.date.localeCompare(a.date)),
    [allReturns, id],
  )

  const latestInvoice = invoices[0]

  const kpis = useMemo(() => {
    if (!customer) return null
    const totalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = customer.currentBalance
    const availableCredit = Math.max(0, customer.creditLimit - outstanding)
    return { totalSales, totalPaid, outstanding, creditLimit: customer.creditLimit, availableCredit }
  }, [customer, sales, payments])

  const salesTrend = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, 0]))
    for (const sale of sales) {
      const key = monthKey(sale.date)
      if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + sale.grandTotal)
    }
    return months.map((m) => ({
      name: m.label,
      sales: byMonth.get(m.key) ?? 0,
    }))
  }, [sales])

  const purchaseFrequency = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, 0]))
    for (const sale of sales) {
      const key = monthKey(sale.date)
      if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + 1)
    }
    return months.map((m) => ({
      name: m.label,
      orders: byMonth.get(m.key) ?? 0,
    }))
  }, [sales])

  const topProducts = useMemo(() => {
    const qtyByProduct = new Map<string, { id: string; name: string; qty: number; revenue: number }>()
    for (const sale of sales) {
      for (const item of sale.items) {
        const prev = qtyByProduct.get(item.productId) ?? {
          id: item.productId,
          name: item.productName,
          qty: 0,
          revenue: 0,
        }
        qtyByProduct.set(item.productId, {
          id: item.productId,
          name: item.productName,
          qty: prev.qty + item.quantity,
          revenue: prev.revenue + item.amount,
        })
      }
    }
    return [...qtyByProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 8)
  }, [sales])

  const timeline = useMemo(
    () =>
      buildCustomerActivity({
        customerId: id ?? '',
        sales,
        payments,
        returns,
        invoices: allInvoices,
      }),
    [id, sales, payments, returns, allInvoices],
  )

  const setTab = (value: string) => {
    setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  }

  if (!customer || !kpis) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been deleted or the link is invalid."
        action={
          <Link to="/parties/customers">
            <Button>Back to customers</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={customer.name}
        description="Customer 360 · profile, receivables, and activity"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="party" status={customer.status} />
            <Link to="/parties/customers">
              <Button variant="outline">All customers</Button>
            </Link>
          </div>
        }
      />

      <section className="erp-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Customer profile</h2>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Contact</p>
          <p className="font-medium text-ink">{customer.mobile}</p>
          {customer.email ? <p className="text-sm text-ink-muted">{customer.email}</p> : null}
        </div>
        <div>
          <p className="text-xs text-ink-muted">Location</p>
          <p className="text-sm text-ink">
            {customer.city}, {customer.state}
          </p>
          <p className="text-sm text-ink-muted">{customer.address}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">GST / terms</p>
          <p className="text-sm text-ink">{customer.gstNumber ?? '—'}</p>
          <p className="text-sm text-ink-muted">{customer.paymentTerms}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Member since</p>
          <p className="text-sm text-ink">{formatDate(customer.createdAt.slice(0, 10))}</p>
          <p className="text-xs text-ink-muted">
            Opening balance {formatCurrency(customer.openingBalance)}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total sales" value={formatCurrency(kpis.totalSales)} icon={IndianRupee} />
        <StatCard label="Total paid" value={formatCurrency(kpis.totalPaid)} icon={Wallet} />
        <StatCard label="Outstanding" value={formatCurrency(kpis.outstanding)} icon={Receipt} />
        <StatCard label="Credit limit" value={formatCurrency(kpis.creditLimit)} icon={CreditCard} />
        <StatCard label="Available credit" value={formatCurrency(kpis.availableCredit)} icon={TrendingUp} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface-elevated p-3">
        <Can module="sales" action="create">
          <Link to="/transactions/sales/new" state={{ customerId: customer.id }}>
            <Button size="sm">Create sale</Button>
          </Link>
        </Can>
        <Can module="payments" action="create">
          <Link to={`/transactions/payments/new?partyType=customer&partyId=${customer.id}`}>
            <Button size="sm" variant="outline">
              Receive payment
            </Button>
          </Link>
        </Can>
        {latestInvoice ? (
          <Link to={`/transactions/invoices/${latestInvoice.id}`}>
            <Button size="sm" variant="outline">
              View invoice
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" disabled>
            View invoice
          </Button>
        )}
        <Button size="sm" variant="outline" type="button" onClick={() => setTab('ledger')}>
          View ledger
        </Button>
        <Link to="/reports/customer-ledger">
          <Button size="sm" variant="ghost">
            Full ledger report
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Sales trend" description="Confirmed sales — last 6 months">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => formatNumber(v)} width={48} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Purchase frequency" description="Number of orders per month">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseFrequency}>
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} width={32} />
                  <Tooltip />
                  <Bar dataKey="orders" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between border-b border-border py-2">
                    <div>
                      <Link
                        to={`/transactions/invoices/${inv.id}`}
                        className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                      >
                        {inv.invoiceNo}
                      </Link>
                      <p className="text-xs text-ink-muted">{formatDate(inv.date)}</p>
                    </div>
                    <span className="tabular-nums">{formatCurrency(inv.grandTotal)}</span>
                  </div>
                ))}
                {invoices.length === 0 ? <p className="text-ink-muted">No invoices yet</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent payments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border py-2">
                    <div>
                      <p className="font-medium">{p.paymentNo}</p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(p.date)} · {p.method}
                      </p>
                    </div>
                    <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                {payments.length === 0 ? <p className="text-ink-muted">No payments recorded</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top purchased products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {topProducts.map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border py-2">
                    <Link to={`/master/products/${p.id}`} className="truncate font-medium hover:text-brand-700">
                      {p.name}
                    </Link>
                    <span className="shrink-0 text-ink-muted tabular-nums">
                      {formatNumber(p.qty)} · {formatCurrency(p.revenue)}
                    </span>
                  </div>
                ))}
                {topProducts.length === 0 ? <p className="text-ink-muted">No purchase history</p> : null}
              </CardContent>
            </Card>
          </div>

          <ActivityTimeline events={timeline} maxHeightClassName="max-h-[28rem]" />
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {sales.map((s) => {
                const inv = allInvoices.find((i) => i.saleId === s.id)
                return (
                  <div key={s.id} className="flex items-center justify-between border-b border-border py-2">
                    <div>
                      {inv ? (
                        <Link
                          to={`/transactions/invoices/${inv.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {s.invoiceNo}
                        </Link>
                      ) : (
                        <span>{s.invoiceNo}</span>
                      )}
                      <p className="text-xs text-ink-muted">{formatDate(s.date)} · Due {formatCurrency(s.due)}</p>
                    </div>
                    <span className="tabular-nums">{formatCurrency(s.grandTotal)}</span>
                  </div>
                )
              })}
              {sales.length === 0 ? <p className="text-ink-muted">No sales yet</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-border py-2">
                  <span>
                    {p.paymentNo} · {formatDate(p.date)} · {p.method}
                  </span>
                  <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {payments.length === 0 ? <p className="text-ink-muted">No payments</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ledger</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                    <th className="py-2 pr-2">Date</th>
                    <th className="py-2 pr-2">Reference</th>
                    <th className="py-2 pr-2">Description</th>
                    <th className="py-2 pr-2 text-right">Debit</th>
                    <th className="py-2 pr-2 text-right">Credit</th>
                    <th className="py-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id} className="border-b border-border">
                      <td className="py-2 pr-2">{formatDate(l.date)}</td>
                      <td className="py-2 pr-2">{l.reference}</td>
                      <td className="py-2 pr-2 text-ink-muted">{l.description}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {l.debit ? formatCurrency(l.debit) : '—'}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {l.credit ? formatCurrency(l.credit) : '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(l.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ledger.length === 0 ? <p className="pt-4 text-ink-muted">No ledger entries</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales returns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {returns.map((r) => (
                <div key={r.id} className="flex justify-between border-b border-border py-2">
                  <span>
                    {r.returnNo} · {r.invoiceNo} · {r.productName} · {formatDate(r.date)}
                  </span>
                  <span className="tabular-nums">{formatCurrency(r.amount)}</span>
                </div>
              ))}
              {returns.length === 0 ? <p className="text-ink-muted">No returns</p> : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
