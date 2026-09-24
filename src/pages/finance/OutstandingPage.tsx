import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CalendarDays,
  IndianRupee,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChartCard } from '@/components/ui/chart-card'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { usePermission } from '@/hooks/use-permission'
import { useDmsStore } from '@/store/dms-store'
import { CHART_COLORS, CHART_GRID_STROKE, CHART_TICK, CHART_TOOLTIP } from '@/utils/chart-theme'
import { cn } from '@/utils/cn'
import {
  buildPayableDocuments,
  buildReceivableDocuments,
  type AgingBucketKey,
  type OutstandingDocumentRow,
  type OutstandingSummary,
  summarizeDocuments,
} from '@/utils/outstanding-metrics'
import { formatCurrency, formatDate } from '@/utils/format'

const AGING_LABELS: Record<AgingBucketKey, string> = {
  '0-30': '0–30',
  '31-60': '31–60',
  '61-90': '61–90',
  '90+': '90+',
}

const AGING_COLORS: Record<AgingBucketKey, string> = {
  '0-30': CHART_COLORS[1],
  '31-60': CHART_COLORS[2],
  '61-90': CHART_COLORS[3],
  '90+': CHART_COLORS[4],
}

type AgingFilter = AgingBucketKey | 'all'

function agingChartData(aging: Record<AgingBucketKey, number>) {
  return (Object.keys(AGING_LABELS) as AgingBucketKey[]).map((key) => ({
    key,
    name: AGING_LABELS[key],
    amount: aging[key],
  }))
}

function defaultReminderMessage(doc: OutstandingDocumentRow, businessName: string) {
  const kind = doc.partyType === 'supplier' ? 'payable' : 'receivable'
  if (kind === 'payable') {
    return `Dear ${doc.partyName},\n\nThis is a reminder that ${doc.docNo} for ${formatCurrency(doc.amountDue)} is due on ${formatDate(doc.dueDate, 'long')}.\n\nPlease confirm payment schedule.\n\nRegards,\n${businessName}`
  }
  return `Dear ${doc.partyName},\n\nFriendly reminder: Invoice ${doc.docNo} for ${formatCurrency(doc.amountDue)} was due on ${formatDate(doc.dueDate, 'long')}. Kindly arrange payment at the earliest.\n\nThank you,\n${businessName}`
}

export default function OutstandingPage() {
  const customers = useDmsStore((s) => s.customers)
  const distributors = useDmsStore((s) => s.distributors)
  const suppliers = useDmsStore((s) => s.suppliers)
  const sales = useDmsStore((s) => s.sales)
  const purchases = useDmsStore((s) => s.purchases)
  const invoices = useDmsStore((s) => s.invoices)
  const settings = useDmsStore((s) => s.settings)
  const pushNotification = useDmsStore((s) => s.pushNotification)
  const addAudit = useDmsStore((s) => s.addAudit)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { canCreate: canCreatePayment } = usePermission('payments')
  const { canEdit: canEditSales } = usePermission('sales')
  const { canEdit: canEditPurchase } = usePermission('purchase')

  const [tab, setTab] = useState<'receivables' | 'payables'>('receivables')
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('all')
  const [reminderDoc, setReminderDoc] = useState<OutstandingDocumentRow | null>(null)
  const [reminderChannel, setReminderChannel] = useState<'sms' | 'email' | 'whatsapp'>('whatsapp')
  const [reminderMessage, setReminderMessage] = useState('')

  const receivableDocs = useMemo(
    () => buildReceivableDocuments(sales, invoices, customers, distributors),
    [sales, invoices, customers, distributors],
  )
  const payableDocs = useMemo(
    () => buildPayableDocuments(purchases, suppliers),
    [purchases, suppliers],
  )

  const receivableSummary = useMemo(() => summarizeDocuments(receivableDocs), [receivableDocs])
  const payableSummary = useMemo(() => summarizeDocuments(payableDocs), [payableDocs])

  const filteredReceivables = useMemo(
    () =>
      agingFilter === 'all'
        ? receivableDocs
        : receivableDocs.filter((d) => d.agingBucket === agingFilter),
    [receivableDocs, agingFilter],
  )
  const filteredPayables = useMemo(
    () =>
      agingFilter === 'all' ? payableDocs : payableDocs.filter((d) => d.agingBucket === agingFilter),
    [payableDocs, agingFilter],
  )

  const openReminder = (doc: OutstandingDocumentRow) => {
    setReminderDoc(doc)
    setReminderChannel('whatsapp')
    setReminderMessage(defaultReminderMessage(doc, settings.businessName))
  }

  const sendReminder = () => {
    if (!reminderDoc) return
    const channelLabel =
      reminderChannel === 'sms' ? 'SMS' : reminderChannel === 'email' ? 'Email' : 'WhatsApp'
    addAudit(
      'Finance',
      'Payment Reminder',
      `${channelLabel} reminder for ${reminderDoc.docNo} — ${reminderDoc.partyName} (${formatCurrency(reminderDoc.amountDue)})`,
      reminderDoc.docNo,
    )
    pushNotification({
      type: 'payment_due',
      category: 'payments',
      severity: 'warning',
      priority: 'high',
      title: 'Reminder queued',
      message: `${channelLabel} reminder prepared for ${reminderDoc.partyName} · ${reminderDoc.docNo}`,
      link: '/finance/outstanding',
      related: {
        type: 'document',
        label: reminderDoc.docNo,
        href: '/finance/outstanding',
      },
    })
    toast({
      title: 'Reminder prepared',
      description: `${channelLabel} draft for ${reminderDoc.partyName} · ${reminderDoc.docNo}. Copy and send manually.`,
      variant: 'success',
    })
    setReminderDoc(null)
  }

  return (
    <div>
      <PageHeader
        title="Outstanding management"
        description="Receivables and payables with aging, due dates, and follow-up actions"
        actions={
          <Can module="payments" action="create">
            <Link to="/transactions/payments/new">
              <Button type="button" size="sm" className="gap-1">
                Record payment
              </Button>
            </Link>
          </Can>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as 'receivables' | 'payables')
          setAgingFilter('all')
        }}
      >
        <TabsList>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
        </TabsList>

        <TabsContent value="receivables" className="space-y-4">
          <SummaryCards summary={receivableSummary} />
          <AgingSection
            summary={receivableSummary}
            filter={agingFilter}
            onFilterChange={setAgingFilter}
          />
          <DataTable
                data={filteredReceivables}
                getRowId={(r) => r.id}
                storageKey="outstanding-receivable-docs"
                searchPlaceholder="Search invoice or party…"
                columns={documentColumns({
                  mode: 'receivables',
                  onRemind: openReminder,
                  navigate,
                  canCreatePayment: canCreatePayment(),
                  canEditSales: canEditSales(),
                  canEditPurchase: canEditPurchase(),
                })}
                emptyTitle="No outstanding receivables"
                emptyDescription="All customer and distributor invoices are settled."
                emptyAction={
                  <Can module="sales" action="create">
                    <Link to="/transactions/sales/new">
                      <Button type="button" className="min-h-10">
                        Create Sale
                      </Button>
                    </Link>
                  </Can>
                }
              />
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <SummaryCards summary={payableSummary} />
          <AgingSection
            summary={payableSummary}
            filter={agingFilter}
            onFilterChange={setAgingFilter}
          />
          <DataTable
                data={filteredPayables}
                getRowId={(r) => r.id}
                storageKey="outstanding-payable-docs"
                searchPlaceholder="Search purchase or supplier…"
                columns={documentColumns({
                  mode: 'payables',
                  onRemind: openReminder,
                  navigate,
                  canCreatePayment: canCreatePayment(),
                  canEditSales: canEditSales(),
                  canEditPurchase: canEditPurchase(),
                })}
                emptyTitle="No outstanding payables"
                emptyDescription="All supplier bills are settled."
                emptyAction={
                  <Can module="purchase" action="create">
                    <Link to="/transactions/purchases/new">
                      <Button type="button" className="min-h-10">
                        Create Purchase
                      </Button>
                    </Link>
                  </Can>
                }
              />
        </TabsContent>
      </Tabs>

      <Modal
        open={Boolean(reminderDoc)}
        onClose={() => setReminderDoc(null)}
        title="Prepare reminder"
        description={
          reminderDoc
            ? `${reminderDoc.docNo} · ${reminderDoc.partyName} · ${formatCurrency(reminderDoc.amountDue)}`
            : undefined
        }
        size="lg"
      >
        {reminderDoc ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs">
                <p className="text-ink-muted">Mobile</p>
                <p className="mt-0.5 font-medium text-ink">{reminderDoc.mobile || '—'}</p>
              </div>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs sm:col-span-2">
                <p className="text-ink-muted">Email</p>
                <p className="mt-0.5 font-medium text-ink">{reminderDoc.email || '—'}</p>
              </div>
            </div>

            <FormField label="Channel">
              <Select
                value={reminderChannel}
                onChange={(e) => setReminderChannel(e.target.value as typeof reminderChannel)}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </Select>
            </FormField>

            <FormField label="Message">
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={8}
              />
            </FormField>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" onClick={() => setReminderDoc(null)}>
                Close
              </Button>
              <Button type="button" className="gap-1.5" onClick={sendReminder}>
                {reminderChannel === 'email' ? (
                  <Mail className="h-4 w-4" />
                ) : reminderChannel === 'sms' ? (
                  <Phone className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Prepare reminder
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

function SummaryCards({ summary }: { summary: OutstandingSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total outstanding" value={formatCurrency(summary.total)} icon={IndianRupee} />
      <StatCard label="Overdue" value={formatCurrency(summary.overdue)} icon={AlertCircle} />
      <StatCard label="Due today" value={formatCurrency(summary.dueToday)} icon={CalendarDays} />
      <StatCard label="Due this week" value={formatCurrency(summary.dueThisWeek)} icon={CalendarClock} />
    </div>
  )
}

function AgingSection({
  summary,
  filter,
  onFilterChange,
}: {
  summary: OutstandingSummary
  filter: AgingFilter
  onFilterChange: (v: AgingFilter) => void
}) {
  const chartData = useMemo(() => agingChartData(summary.aging), [summary.aging])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,18rem)]">
      <ChartCard title="Aging buckets" description="Outstanding amount by age of document (₹)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={CHART_TICK} />
            <YAxis tick={CHART_TICK} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} width={40} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v) => formatCurrency(Number(v))} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={AGING_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <Card>
        <CardContent className="space-y-2 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Filter by age</p>
          <button
            type="button"
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
              filter === 'all'
                ? 'border-brand-300 bg-brand-50 font-medium text-brand-900 dark:border-brand-600 dark:bg-brand-100/15 dark:text-brand-200'
                : 'border-border hover:bg-surface',
            )}
            onClick={() => onFilterChange('all')}
          >
            <span>All buckets</span>
            <span className="tabular-nums">{formatCurrency(summary.total)}</span>
          </button>
          {(Object.keys(AGING_LABELS) as AgingBucketKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm',
                filter === key
                  ? 'border-brand-300 bg-brand-50 font-medium text-brand-900 dark:border-brand-600 dark:bg-brand-100/15 dark:text-brand-200'
                  : 'border-border hover:bg-surface',
              )}
              onClick={() => onFilterChange(key)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: AGING_COLORS[key] }}
                  aria-hidden
                />
                {AGING_LABELS[key]} days
              </span>
              <span className="tabular-nums">{formatCurrency(summary.aging[key])}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function documentColumns({
  mode,
  onRemind,
  navigate,
  canCreatePayment,
  canEditSales,
  canEditPurchase,
}: {
  mode: 'receivables' | 'payables'
  onRemind: (doc: OutstandingDocumentRow) => void
  navigate: ReturnType<typeof useNavigate>
  canCreatePayment: boolean
  canEditSales: boolean
  canEditPurchase: boolean
}) {
  return [
    {
      id: 'doc',
      header: mode === 'receivables' ? 'Invoice' : 'Purchase',
      accessor: 'docNo' as const,
      sortable: true,
      sticky: 'left' as const,
      cell: (r: OutstandingDocumentRow) => <CodeCell value={r.docNo} />,
    },
    {
      id: 'party',
      header: mode === 'receivables' ? 'Party' : 'Supplier',
      accessor: 'partyName' as const,
      sortable: true,
    },
    {
      id: 'date',
      header: 'Doc date',
      accessor: 'date' as const,
      sortable: true,
      cell: (r: OutstandingDocumentRow) => formatDate(r.date),
    },
    {
      id: 'dueDate',
      header: 'Due date',
      accessor: 'dueDate' as const,
      sortable: true,
      cell: (r: OutstandingDocumentRow) => (
        <span className={cn(r.isOverdue && 'font-medium text-danger')}>{formatDate(r.dueDate)}</span>
      ),
    },
    {
      id: 'due',
      header: 'Amount due',
      sortable: true,
      cell: (r: OutstandingDocumentRow) => (
        <span className="font-medium tabular-nums">{formatCurrency(r.amountDue)}</span>
      ),
    },
    {
      id: 'age',
      header: 'Age',
      cell: (r: OutstandingDocumentRow) => (
        <span className="text-xs">
          {r.ageDays}d · {AGING_LABELS[r.agingBucket]}
          {r.isDueToday ? (
            <span className="ml-1 text-warning">Today</span>
          ) : r.isOverdue ? (
            <span className="ml-1 text-danger">Overdue</span>
          ) : null}
        </span>
      ),
    },
    {
      id: 'actions',
      header: ACTION_COLUMN_HEADER,
      headerClassName: ACTION_COLUMN_HEADER_CLASS,
      className: ACTION_COLUMN_CLASS,
      hideable: false,
      sticky: 'right' as const,
      cell: (r: OutstandingDocumentRow) => {
        const ledgerPath =
          r.partyType === 'customer'
            ? `/reports/customer-ledger?partyId=${r.partyId}`
            : r.partyType === 'distributor'
              ? `/reports/distributor-ledger?partyId=${r.partyId}`
              : `/reports/supplier-ledger?partyId=${r.partyId}`

        const paymentPath =
          mode === 'receivables'
            ? `/transactions/payments/new?partyType=${r.partyType}&partyId=${r.partyId}`
            : `/transactions/payments/new?partyType=supplier&partyId=${r.partyId}`

        const onView =
          mode === 'receivables'
            ? r.invoiceId
              ? () => navigate(`/transactions/invoices/${r.invoiceId}`)
              : canEditSales && r.saleId
                ? () => navigate(`/transactions/sales/${r.saleId}/edit`)
                : undefined
            : canEditPurchase && r.purchaseId
              ? () => navigate(`/transactions/purchases/${r.purchaseId}/edit`)
              : undefined

        const more = []
        if (canCreatePayment) {
          more.push({
            id: 'payment',
            label: mode === 'receivables' ? 'Receive payment' : 'Make payment',
            onClick: () => navigate(paymentPath),
          })
        }
        more.push({
          id: 'ledger',
          label: 'View ledger',
          onClick: () => navigate(ledgerPath),
        })
        more.push({
          id: 'remind',
          label: 'Reminder',
          icon: <Bell className="h-3.5 w-3.5" />,
          onClick: () => onRemind(r),
        })

        return <RowActions onView={onView} viewLabel="View" more={more} />
      },
    },
  ]
}
