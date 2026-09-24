import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDmsStore } from '@/store/dms-store'
import { formatCurrency, formatDate } from '@/utils/format'

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const row = useDmsStore((s) => s.suppliers.find((c) => c.id === id))
  const allPurchases = useDmsStore((s) => s.purchases)
  const allPayments = useDmsStore((s) => s.payments)

  const purchases = useMemo(() => allPurchases.filter((x) => x.supplierId === id), [allPurchases, id])
  const payments = useMemo(
    () => allPayments.filter((p) => p.partyId === id && p.partyType === 'supplier'),
    [allPayments, id],
  )

  if (!row) {
    return (
      <EmptyState
        title="Supplier not found"
        description="This supplier may have been deleted or the link is invalid."
        action={
          <Link to="/parties/suppliers">
            <Button>Back to suppliers</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={row.name}
        description={[row.city, row.mobile].filter(Boolean).join(' · ') || 'Supplier profile'}
        actions={
          <div className="flex flex-wrap gap-2">
            <Can module="purchase" action="create">
              <Link to={`/transactions/purchases/new`}>
                <Button size="sm">New purchase</Button>
              </Link>
            </Can>
            <Can module="payments" action="create">
              <Link to={`/transactions/payments/new?partyType=supplier&partyId=${row.id}`}>
                <Button size="sm" variant="outline">
                  Record payment
                </Button>
              </Link>
            </Can>
            <Link to="/parties/suppliers">
              <Button variant="outline">All suppliers</Button>
            </Link>
          </div>
        }
      />
      <Card>
        <CardContent className="flex flex-wrap gap-6 py-4 text-sm">
          <div>
            <p className="text-ink-muted">Payable</p>
            <p className="font-semibold tabular-nums">{formatCurrency(row.currentBalance)}</p>
          </div>
          {row.gstNumber ? (
            <div>
              <p className="text-ink-muted">GSTIN</p>
              <p className="font-medium">{row.gstNumber}</p>
            </div>
          ) : null}
          <StatusBadge kind="party" status={row.status} />
        </CardContent>
      </Card>
      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases">
          <Card>
            <CardContent className="space-y-2 pt-4 text-sm">
              {purchases.length === 0 ? (
                <EmptyState
                  className="border-0 bg-transparent py-8"
                  title="No purchases yet"
                  description="Record a bill against this supplier."
                  action={
                    <Can module="purchase" action="create">
                      <Link to="/transactions/purchases/new">
                        <Button size="sm">New purchase</Button>
                      </Link>
                    </Can>
                  }
                />
              ) : (
                purchases.map((p) => (
                  <div key={p.id} className="flex justify-between gap-3">
                    <span>
                      {p.purchaseNo} · {formatDate(p.date)}
                    </span>
                    <span className="tabular-nums">{formatCurrency(p.grandTotal)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card>
            <CardContent className="space-y-2 pt-4 text-sm">
              {payments.length === 0 ? (
                <EmptyState
                  className="border-0 bg-transparent py-8"
                  title="No payments yet"
                  description="Record a payment to this supplier."
                  action={
                    <Can module="payments" action="create">
                      <Link to={`/transactions/payments/new?partyType=supplier&partyId=${row.id}`}>
                        <Button size="sm">Record payment</Button>
                      </Link>
                    </Can>
                  }
                />
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="flex justify-between gap-3">
                    <span>{p.paymentNo}</span>
                    <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
