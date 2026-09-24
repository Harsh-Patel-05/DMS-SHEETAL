import {
  CreditCard,
  IndianRupee,
  Package,
  Receipt,
  ShoppingCart,
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
import { buildDistributorActivity } from '@/utils/activity-timeline'
import { CHART_COLORS, CHART_GRID_STROKE } from '@/utils/chart-theme'
import { filterConfirmedSales } from '@/utils/dashboard-metrics'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

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

export default function DistributorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab =
    tabParam && ['overview', 'purchases', 'payments', 'ledger', 'returns'].includes(tabParam)
      ? tabParam
      : 'overview'

  const distributor = useDmsStore((s) => s.distributors.find((d) => d.id === id))
  const allSales = useDmsStore((s) => s.sales)
  const allInvoices = useDmsStore((s) => s.invoices)
  const allPayments = useDmsStore((s) => s.payments)
  const allLedger = useDmsStore((s) => s.ledger)
  const allReturns = useDmsStore((s) => s.salesReturns)

  const nameKeys = useMemo(() => {
    if (!distributor) return new Set<string>()
    return new Set(
      [distributor.name, distributor.companyName]
        .filter(Boolean)
        .map((n) => n.trim().toLowerCase()),
    )
  }, [distributor])

  const purchases = useMemo(
    () =>
      filterConfirmedSales(
        allSales.filter(
          (s) => s.customerId === id || nameKeys.has(s.customerName.trim().toLowerCase()),
        ),
      ).sort((a, b) => b.date.localeCompare(a.date)),
    [allSales, id, nameKeys],
  )

  const invoices = useMemo(
    () =>
      allInvoices
        .filter(
          (i) => i.customerId === id || nameKeys.has(i.customerName.trim().toLowerCase()),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allInvoices, id, nameKeys],
  )

  const payments = useMemo(
    () =>
      allPayments
        .filter((p) => p.partyId === id && p.partyType === 'distributor')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allPayments, id],
  )

  const ledger = useMemo(
    () =>
      allLedger
        .filter((l) => l.partyId === id && l.partyType === 'distributor')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allLedger, id],
  )

  const returns = useMemo(
    () =>
      allReturns
        .filter(
          (r) =>
            r.customerId === id ||
            nameKeys.has(r.customerName.trim().toLowerCase()) ||
            purchases.some((p) => p.id === r.saleId),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allReturns, id, nameKeys, purchases],
  )

  const kpis = useMemo(() => {
    if (!distributor) return null
    const totalBusiness = purchases.reduce((sum, s) => sum + s.grandTotal, 0)
    const totalPurchases = purchases.reduce((sum, s) => sum + s.subtotal, 0)
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const outstanding = distributor.currentBalance
    return {
      totalBusiness,
      totalPurchases,
      totalPayments,
      outstanding,
      creditLimit: distributor.creditLimit,
      availableCredit: Math.max(0, distributor.creditLimit - outstanding),
    }
  }, [distributor, purchases, payments])

  const purchaseTrend = useMemo(() => {
    const months = lastMonths(6)
    const byMonth = new Map(months.map((m) => [m.key, 0]))
    for (const sale of purchases) {
      const key = monthKey(sale.date)
      if (byMonth.has(key)) byMonth.set(key, (byMonth.get(key) ?? 0) + sale.grandTotal)
    }
    return months.map((m) => ({
      name: m.label,
      amount: byMonth.get(m.key) ?? 0,
    }))
  }, [purchases])

  const productPurchases = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty: number; amount: number }>()
    for (const sale of purchases) {
      for (const item of sale.items) {
        const prev = map.get(item.productId) ?? {
          id: item.productId,
          name: item.productName,
          qty: 0,
          amount: 0,
        }
        map.set(item.productId, {
          id: item.productId,
          name: item.productName,
          qty: prev.qty + item.quantity,
          amount: prev.amount + item.amount,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, 8)
  }, [purchases])

  const timeline = useMemo(
    () =>
      buildDistributorActivity({
        distributorId: id ?? '',
        sales: allSales,
        payments: allPayments,
        returns: allReturns,
        invoices: allInvoices,
      }),
    [id, allSales, allPayments, allReturns, allInvoices],
  )

  const setTab = (value: string) => {
    setSearchParams(value === 'overview' ? {} : { tab: value }, { replace: true })
  }

  if (!distributor || !kpis) {
    return (
      <EmptyState
        title="Distributor not found"
        description="This distributor may have been deleted or the link is invalid."
        action={
          <Link to="/parties/distributors">
            <Button>Back to distributors</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={distributor.companyName}
        description="Distributor 360 · business, purchases, and receivables"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="party" status={distributor.status} />
            <Link to="/parties/distributors">
              <Button variant="outline">All distributors</Button>
            </Link>
          </div>
        }
      />

      <section className="erp-card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Distributor profile
          </h2>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Contact person</p>
          <p className="font-medium text-ink">{distributor.contactPerson}</p>
          <p className="text-sm text-ink-muted">{distributor.mobile}</p>
          {distributor.email ? <p className="text-sm text-ink-muted">{distributor.email}</p> : null}
        </div>
        <div>
          <p className="text-xs text-ink-muted">Location</p>
          <p className="text-sm text-ink">
            {distributor.city}, {distributor.state}
          </p>
          <p className="text-sm text-ink-muted">{distributor.address}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">GST / PAN</p>
          <p className="text-sm text-ink">{distributor.gstNumber ?? '—'}</p>
          <p className="text-sm text-ink-muted">{distributor.pan ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Terms</p>
          <p className="text-sm text-ink">{distributor.paymentTerms}</p>
          <p className="text-xs text-ink-muted">
            Since {formatDate(distributor.createdAt.slice(0, 10))}
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total business" value={formatCurrency(kpis.totalBusiness)} icon={IndianRupee} />
        <StatCard label="Total orders" value={formatCurrency(kpis.totalPurchases)} icon={ShoppingCart} />
        <StatCard label="Total payments" value={formatCurrency(kpis.totalPayments)} icon={Wallet} />
        <StatCard label="Outstanding" value={formatCurrency(kpis.outstanding)} icon={Receipt} />
        <StatCard label="Credit limit" value={formatCurrency(kpis.creditLimit)} icon={CreditCard} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface-elevated p-3">
        <Can module="sales" action="create">
          <Link to="/transactions/sales/new" state={{ distributorId: distributor.id, partyName: distributor.name }}>
            <Button size="sm">New sale</Button>
          </Link>
        </Can>
        <Can module="payments" action="create">
          <Link to={`/transactions/payments/new?partyType=distributor&partyId=${distributor.id}`}>
            <Button size="sm" variant="outline">
              Make payment
            </Button>
          </Link>
        </Can>
        <Button size="sm" variant="outline" type="button" onClick={() => setTab('ledger')}>
          View ledger
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => setTab('purchases')}>
          View transactions
        </Button>
        <Link to="/reports/distributor-ledger">
          <Button size="sm" variant="ghost">
            Full ledger report
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchases">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Purchase trend" description="Orders placed with us — last 6 months">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={purchaseTrend}>
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

            <ChartCard title="Product-wise purchases" description="Top products by value">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productPurchases.map((p) => ({
                    name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
                    amount: p.amount,
                  }))}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatNumber(v)} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent purchases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {purchases.slice(0, 5).map((s) => {
                  const inv = invoices.find((i) => i.saleId === s.id)
                  return (
                    <div key={s.id} className="flex items-center justify-between border-b border-border py-2">
                      <div>
                        {inv ? (
                          <Link
                            to={`/transactions/invoices/${inv.id}`}
                            className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                          >
                            {s.invoiceNo}
                          </Link>
                        ) : (
                          <Link
                            to={`/transactions/sales/${s.id}/edit`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {s.invoiceNo}
                          </Link>
                        )}
                        <p className="text-xs text-ink-muted">{formatDate(s.date)}</p>
                      </div>
                      <span className="tabular-nums">{formatCurrency(s.grandTotal)}</span>
                    </div>
                  )
                })}
                {purchases.length === 0 ? <p className="text-ink-muted">No purchases yet</p> : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment history</CardTitle>
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
              <CardHeader className="flex flex-row items-center gap-2">
                <Package className="h-4 w-4 text-brand-600" aria-hidden />
                <CardTitle className="text-base">Top products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {productPurchases.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-border py-2">
                    <Link to={`/master/products/${p.id}`} className="truncate font-medium hover:text-brand-700">
                      {p.name}
                    </Link>
                    <span className="shrink-0 text-ink-muted tabular-nums">
                      {formatNumber(p.qty)} · {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
                {productPurchases.length === 0 ? (
                  <p className="text-ink-muted">No product history</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <ActivityTimeline events={timeline} title="Recent activity" maxHeightClassName="max-h-[28rem]" />
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase / sales transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {purchases.map((s) => {
                const inv = invoices.find((i) => i.saleId === s.id)
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
                        <Link
                          to={`/transactions/sales/${s.id}/edit`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {s.invoiceNo}
                        </Link>
                      )}
                      <p className="text-xs text-ink-muted">
                        {formatDate(s.date)} · Due {formatCurrency(s.due)}
                      </p>
                    </div>
                    <span className="tabular-nums">{formatCurrency(s.grandTotal)}</span>
                  </div>
                )
              })}
              {purchases.length === 0 ? <p className="text-ink-muted">No transactions yet</p> : null}
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
                      <td className="py-2 text-right tabular-nums font-medium">
                        {formatCurrency(l.balance)}
                      </td>
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
              <CardTitle className="text-base">Returns</CardTitle>
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
