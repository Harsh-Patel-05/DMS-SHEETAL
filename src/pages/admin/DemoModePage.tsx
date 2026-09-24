import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Database,
  Eraser,
  Factory,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'

type DemoAction = 'reset' | 'sample' | 'clear' | null

export default function DemoModePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pending, setPending] = useState<DemoAction>(null)

  const products = useDmsStore((s) => s.products)
  const customers = useDmsStore((s) => s.customers)
  const sales = useDmsStore((s) => s.sales)
  const purchases = useDmsStore((s) => s.purchases)
  const invoices = useDmsStore((s) => s.invoices)
  const payments = useDmsStore((s) => s.payments)
  const ledger = useDmsStore((s) => s.ledger)
  const movements = useDmsStore((s) => s.movements)
  const expenses = useDmsStore((s) => s.expenses)
  const salesReturns = useDmsStore((s) => s.salesReturns)
  const purchaseReturns = useDmsStore((s) => s.purchaseReturns)
  const users = useDmsStore((s) => s.users)
  const settings = useDmsStore((s) => s.settings)

  const resetDemoData = useDmsStore((s) => s.resetDemoData)
  const loadSampleBusinessData = useDmsStore((s) => s.loadSampleBusinessData)
  const clearDemoData = useDmsStore((s) => s.clearDemoData)

  const stats = useMemo(
    () => [
      { label: 'Products', value: products.length },
      { label: 'Customers', value: customers.length },
      { label: 'Sales', value: sales.length },
      { label: 'Purchases', value: purchases.length },
      { label: 'Invoices', value: invoices.length },
      { label: 'Payments', value: payments.length },
      { label: 'Ledger rows', value: ledger.length },
      { label: 'Stock moves', value: movements.length },
      { label: 'Expenses', value: expenses.length },
      { label: 'Returns', value: salesReturns.length + purchaseReturns.length },
      { label: 'Users', value: users.length },
    ],
    [
      products.length,
      customers.length,
      sales.length,
      purchases.length,
      invoices.length,
      payments.length,
      ledger.length,
      movements.length,
      expenses.length,
      salesReturns.length,
      purchaseReturns.length,
      users.length,
    ],
  )

  const run = () => {
    if (pending === 'reset') {
      resetDemoData()
      toast({ title: 'Demo data reset', description: 'Standard seed restored. Please sign in again.', variant: 'info' })
      setPending(null)
      navigate('/login')
      return
    }
    if (pending === 'sample') {
      loadSampleBusinessData()
      toast({
        title: 'Sample business loaded',
        description: 'Sheetal Cool MP distribution dataset is ready for tables, charts, and ledgers.',
        variant: 'success',
      })
      setPending(null)
      return
    }
    if (pending === 'clear') {
      clearDemoData()
      toast({ title: 'Demo data cleared', description: 'Transactions removed; masters and users kept.', variant: 'info' })
      setPending(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Mode"
        description={`${settings.businessName} — load, reset, or clear frontend demo datasets without a backend.`}
      />

      <div className="rounded-md border border-border bg-gradient-to-br from-brand-50/80 via-surface-elevated to-surface p-5 dark:from-brand-900/40">
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-ink">Indian distribution demo</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Simulate Sheetal Cool’s Indore / Madhya Pradesh cooling-products distribution: parties across MP cities,
              GST invoices, supplier payables, stock movements, and ledgers that fill dashboards and reports.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DemoActionCard
          icon={RotateCcw}
          title="Reset Demo Data"
          body="Restore the standard seed snapshot (compact starter set). Signs you out so session matches seed users."
          actionLabel="Reset to seed"
          variant="outline"
          onClick={() => setPending('reset')}
        />
        <DemoActionCard
          icon={Factory}
          title="Load Sample Business Data"
          body="Load a rich Sheetal Cool dataset — ~50 sales, purchases, payments, ledgers, returns, and activity for realistic UI demos."
          actionLabel="Load sample data"
          variant="primary"
          onClick={() => setPending('sample')}
        />
        <DemoActionCard
          icon={Eraser}
          title="Clear Demo Data"
          body="Remove sales, purchases, invoices, payments, ledger, and stock movements. Keep products, parties, users, and roles."
          actionLabel="Clear transactions"
          variant="danger"
          onClick={() => setPending('clear')}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink">Current dataset</h3>
          <Link to="/admin" className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300">
            Admin Control Center
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={Database} />
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={
          pending === 'reset'
            ? 'Reset demo data?'
            : pending === 'sample'
              ? 'Load sample business data?'
              : 'Clear demo transactions?'
        }
        description={
          pending === 'reset'
            ? 'This replaces all local data with the standard seed and signs you out.'
            : pending === 'sample'
              ? 'This replaces current transactional and master party data with the rich sample business set.'
              : 'Sales, purchases, invoices, payments, ledger, and movements will be emptied. Masters stay.'
        }
        variant={pending === 'clear' || pending === 'reset' ? 'danger' : 'default'}
        confirmLabel={
          pending === 'reset' ? 'Reset' : pending === 'sample' ? 'Load sample' : 'Clear'
        }
        onConfirm={run}
      />
    </div>
  )
}

function DemoActionCard({
  icon: Icon,
  title,
  body,
  actionLabel,
  variant,
  onClick,
}: {
  icon: typeof RotateCcw
  title: string
  body: string
  actionLabel: string
  variant: 'primary' | 'outline' | 'danger'
  onClick: () => void
}) {
  return (
    <div className="flex flex-col rounded-md border border-border bg-surface-elevated p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-brand-700 dark:text-brand-300">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <h3 className="mt-3 font-semibold text-ink">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-muted">{body}</p>
      <Button className="mt-4 w-full" variant={variant === 'danger' ? 'danger' : variant} onClick={onClick}>
        {actionLabel}
      </Button>
    </div>
  )
}
