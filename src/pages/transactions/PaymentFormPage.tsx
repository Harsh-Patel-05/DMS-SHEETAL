import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Eraser, Sparkles } from 'lucide-react'
import type { PartyType, PaymentMethod, PaymentType, Sale } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useShortcutAction } from '@/hooks/use-shortcut-action'
import { useUnsavedChanges, formSnapshot } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { cn, todayISO } from '@/utils/cn'
import { formatCurrency, formatDate } from '@/utils/format'
import { validatePaymentInput } from '@/utils/validation'

function roundMoney(n: number) {
  return Math.round(n * 100) / 100
}

/** FIFO auto-allocate payment across outstanding invoices (oldest first). */
function buildAutoAllocations(invoices: Sale[], paymentAmount: number): Record<string, number> {
  let remaining = roundMoney(Math.max(0, paymentAmount))
  const next: Record<string, number> = {}
  const ordered = [...invoices].sort((a, b) => a.date.localeCompare(b.date) || a.invoiceNo.localeCompare(b.invoiceNo))
  for (const inv of ordered) {
    if (remaining <= 0) {
      next[inv.id] = 0
      continue
    }
    const apply = roundMoney(Math.min(inv.due, remaining))
    next[inv.id] = apply
    remaining = roundMoney(remaining - apply)
  }
  return next
}

export default function PaymentFormPage() {
  const recordPayment = useDmsStore((s) => s.recordPayment)
  const customers = useDmsStore((s) => s.customers)
  const suppliers = useDmsStore((s) => s.suppliers)
  const distributors = useDmsStore((s) => s.distributors)
  const allSales = useDmsStore((s) => s.sales)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialPartyType = (searchParams.get('partyType') as PartyType | null) ?? 'customer'
  const initialPartyId = searchParams.get('partyId') ?? customers[0]?.id ?? ''

  const [type, setType] = useState<PaymentType>('received')
  const [partyType, setPartyType] = useState<PartyType>(initialPartyType)
  const [partyId, setPartyId] = useState(initialPartyId || customers[0]?.id || '')
  const [date, setDate] = useState(todayISO())
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [allocations, setAllocations] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)
  const [baseline] = useState(() =>
    formSnapshot({
      type: 'received' as PaymentType,
      partyType: initialPartyType,
      partyId: initialPartyId || customers[0]?.id || '',
      amount: 0,
      method: 'upi' as PaymentMethod,
      reference: '',
      notes: '',
    }),
  )

  const isDirty = useMemo(
    () =>
      formSnapshot({ type, partyType, partyId, amount, method, reference, notes }) !== baseline ||
      Object.values(allocations).some((n) => n > 0),
    [type, partyType, partyId, amount, method, reference, notes, allocations, baseline],
  )
  const { dialog: unsavedDialog } = useUnsavedChanges(isDirty)
  const parties = partyType === 'customer' ? customers : partyType === 'supplier' ? suppliers : distributors
  const selectedParty = parties.find((p) => p.id === partyId)

  const showAllocation =
    type === 'received' && (partyType === 'customer' || partyType === 'distributor')

  const outstandingInvoices = useMemo(() => {
    if (!showAllocation) return []
    return allSales
      .filter(
        (s) =>
          s.customerId === partyId &&
          s.due > 0 &&
          s.status !== 'cancelled' &&
          s.status !== 'draft',
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.invoiceNo.localeCompare(b.invoiceNo))
  }, [allSales, partyId, showAllocation])

  const totalOutstanding = useMemo(
    () => roundMoney(outstandingInvoices.reduce((sum, s) => sum + s.due, 0)),
    [outstandingInvoices],
  )

  useEffect(() => {
    setAllocations({})
  }, [partyId, type, partyType])

  const totalAllocated = useMemo(
    () => roundMoney(Object.values(allocations).reduce((sum, n) => sum + (Number(n) || 0), 0)),
    [allocations],
  )
  const unallocated = roundMoney(Math.max(0, amount - totalAllocated))
  const remaining = unallocated
  const remainingInvoiceDue = useMemo(
    () =>
      roundMoney(
        outstandingInvoices.reduce((sum, s) => {
          const alloc = allocations[s.id] ?? 0
          return sum + Math.max(0, s.due - alloc)
        }, 0),
      ),
    [outstandingInvoices, allocations],
  )

  const setAllocation = (saleId: string, value: number, maxDue: number) => {
    const others = roundMoney(
      Object.entries(allocations).reduce((sum, [id, n]) => (id === saleId ? sum : sum + (Number(n) || 0)), 0),
    )
    const maxFromPayment = roundMoney(Math.max(0, amount - others))
    const clamped = roundMoney(Math.min(Math.max(0, value), maxDue, maxFromPayment))
    setAllocations((prev) => ({ ...prev, [saleId]: clamped }))
  }

  const autoAllocate = () => {
    if (amount <= 0) {
      toast({ title: 'Enter payment amount first', variant: 'error' })
      return
    }
    setAllocations(buildAutoAllocations(outstandingInvoices, amount))
    toast({ title: 'Auto-allocated to oldest invoices', variant: 'success' })
  }

  const clearAllocations = () => setAllocations({})

  const fillDue = (sale: Sale) => {
    setAllocation(sale.id, sale.due, sale.due)
  }

  const submit = useCallback(() => {
    const preCheck = validatePaymentInput({ partyId, date, amount })
    if (!preCheck.ok) {
      toast({ title: 'Invalid payment', description: preCheck.message, variant: 'error' })
      return
    }
    if (amount <= 0) {
      toast({ title: 'Enter a payment amount', variant: 'error' })
      return
    }
    if (showAllocation && totalAllocated > amount + 0.001) {
      toast({ title: 'Invalid allocation', description: 'Allocated total exceeds payment amount.', variant: 'error' })
      return
    }
    for (const s of outstandingInvoices) {
      const alloc = allocations[s.id] ?? 0
      if (alloc > s.due + 0.001) {
        toast({
          title: 'Invalid allocation',
          description: `${s.invoiceNo}: allocation exceeds due.`,
          variant: 'error',
        })
        return
      }
    }

    const allocationRows = showAllocation
      ? outstandingInvoices
          .map((s) => ({ saleId: s.id, amount: allocations[s.id] ?? 0 }))
          .filter((a) => a.amount > 0)
      : undefined

    setSaving(true)
    const result = recordPayment({
      type,
      partyType,
      partyId,
      date,
      amount,
      method,
      reference,
      notes,
      allocations: allocationRows,
    })
    setSaving(false)
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }

    const allocated = allocationRows?.reduce((s, a) => s + a.amount, 0) ?? 0
    toast({
      title: 'Payment recorded',
      description:
        showAllocation && allocated > 0
          ? `Allocated ${formatCurrency(allocated)} · Unallocated ${formatCurrency(Math.max(0, amount - allocated))}`
          : undefined,
      variant: 'success',
    })
    navigate('/transactions/payments')
  }, [
    amount,
    showAllocation,
    totalAllocated,
    outstandingInvoices,
    allocations,
    recordPayment,
    type,
    partyType,
    partyId,
    date,
    method,
    reference,
    notes,
    toast,
    navigate,
  ])

  useShortcutAction('submit', submit, amount > 0)
  useShortcutAction('save', submit, amount > 0)

  return (
    <div className="pb-28 md:pb-0">
      {unsavedDialog}
      <PageHeader
        title="Record payment"
        description="Receive payment and allocate against outstanding invoices"
        actions={
          <Link to="/transactions/payments">
            <Button type="button" variant="outline">
              Back
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,22rem)_1fr]">
        <FormSection
          title="Payment details"
          description="Who paid, how much, and which method."
          className="mobile-form h-fit space-y-3 [&>div:first-child]:mb-1"
        >
            <FormField label="Type" required>
              <Select value={type} onChange={(e) => setType(e.target.value as PaymentType)}>
                <option value="received">Received</option>
                <option value="paid">Paid</option>
              </Select>
            </FormField>
            <FormField label="Party type">
              <Select
                value={partyType}
                onChange={(e) => {
                  const pt = e.target.value as PartyType
                  setPartyType(pt)
                  const list = pt === 'customer' ? customers : pt === 'supplier' ? suppliers : distributors
                  setPartyId(list[0]?.id ?? '')
                }}
              >
                <option value="customer">Customer</option>
                <option value="distributor">Distributor</option>
                <option value="supplier">Supplier</option>
              </Select>
            </FormField>
            <FormField label="Party" required hint="Search by name or contact">
              <SearchableSelect
                value={partyId}
                onChange={setPartyId}
                recentScope={`party-${partyType}`}
                placeholder="Select party…"
                searchPlaceholder={`Search ${partyType}s…`}
                options={parties.map((p) => ({
                  value: p.id,
                  label: p.name,
                  description:
                    'mobile' in p && p.mobile
                      ? `${p.mobile}${('city' in p && p.city) ? ` · ${p.city}` : ''}`
                      : undefined,
                  group: 'city' in p && p.city ? p.city : undefined,
                }))}
              />
            </FormField>
            {selectedParty ? (
              <p className="text-xs text-ink-muted">
                Party balance:{' '}
                <span className="font-medium text-ink tabular-nums">
                  {formatCurrency(selectedParty.currentBalance)}
                </span>
              </p>
            ) : null}
            <FormField label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField
              label="Payment amount"
              required
              hint="Must be greater than zero"
              error={amount < 0 ? 'Amount cannot be negative' : undefined}
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                className="tabular-nums text-base font-semibold"
                value={amount || ''}
                placeholder="0"
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Method" required>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </Select>
            </FormField>
            <FormField label="Reference" hint="UTR, cheque number, or transaction ID">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / cheque no." />
            </FormField>
            <FormField label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </FormField>
            <Button type="button" className="hidden w-full md:inline-flex" onClick={submit} disabled={saving || amount <= 0}>
              {saving ? 'Saving…' : 'Save payment'}
            </Button>
        </FormSection>

        {showAllocation ? (
          <Card className="min-w-0">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Allocate to outstanding invoices</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  {outstandingInvoices.length === 0
                    ? 'No open invoices for this party.'
                    : `${outstandingInvoices.length} invoice(s) · Total due ${formatCurrency(totalOutstanding)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={autoAllocate}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-allocate
                </Button>
                <Button type="button" size="sm" variant="ghost" className="gap-1.5" onClick={clearAllocations}>
                  <Eraser className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <SummaryTile label="Allocated" value={totalAllocated} tone="success" />
                <SummaryTile label="Unallocated" value={unallocated} tone={unallocated > 0 ? 'warning' : 'muted'} />
                <SummaryTile label="Remaining" value={remaining} tone={remaining > 0 ? 'warning' : 'muted'} hint="Left to allocate from payment" />
              </div>

              {amount > 0 ? (
                <p className="text-xs text-ink-muted">
                  Payment <strong className="text-ink tabular-nums">{formatCurrency(amount)}</strong>
                  {totalAllocated > 0 ? (
                    <>
                      {' '}
                      → applying{' '}
                      <strong className="text-ink tabular-nums">{formatCurrency(totalAllocated)}</strong> to invoices
                      {unallocated > 0 ? (
                        <>
                          , leaving{' '}
                          <strong className="text-ink tabular-nums">{formatCurrency(unallocated)}</strong> as advance /
                          unallocated
                        </>
                      ) : null}
                    </>
                  ) : (
                    <> — enter amounts below or use Auto-allocate</>
                  )}
                  {totalAllocated > 0 ? (
                    <>
                      . Invoice due after this:{' '}
                      <strong className="text-ink tabular-nums">{formatCurrency(remainingInvoiceDue)}</strong>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="text-xs text-ink-muted">Enter a payment amount to begin allocation.</p>
              )}

              {outstandingInvoices.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-ink-muted">
                  No outstanding invoices to allocate.
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {outstandingInvoices.map((sale) => {
                    const alloc = allocations[sale.id] ?? 0
                    const afterDue = roundMoney(Math.max(0, sale.due - alloc))
                    const fullyCovered = alloc > 0 && afterDue <= 0
                    return (
                      <li
                        key={sale.id}
                        className={cn(
                          'flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                          fullyCovered && 'bg-success-bg/50',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-ink">Invoice {sale.invoiceNo}</span>
                            <span className="text-ink-muted">—</span>
                            <span className="font-semibold tabular-nums text-ink">{formatCurrency(sale.due)}</span>
                            {fullyCovered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Covered
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {formatDate(sale.date)} · Paid {formatCurrency(sale.paid)}
                            {alloc > 0 ? ` · After alloc due ${formatCurrency(afterDue)}` : null}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => fillDue(sale)}
                            disabled={amount <= 0}
                          >
                            Full due
                          </Button>
                          <div className="w-32">
                            <Input
                              type="number"
                              min={0}
                              max={sale.due}
                              step="0.01"
                              className="tabular-nums"
                              value={alloc || ''}
                              placeholder="0"
                              aria-label={`Allocate to ${sale.invoiceNo}`}
                              onChange={(e) => setAllocation(sale.id, Number(e.target.value) || 0, sale.due)}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {totalAllocated > 0 ? (
                <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Allocation preview</p>
                  <ul className="mt-2 space-y-1">
                    {outstandingInvoices
                      .filter((s) => (allocations[s.id] ?? 0) > 0)
                      .map((s) => (
                        <li key={s.id} className="flex justify-between gap-3 tabular-nums">
                          <span>
                            {s.invoiceNo} → {formatCurrency(allocations[s.id] ?? 0)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-sm text-ink-muted">
              Invoice allocation is available when recording a <strong>received</strong> payment for a{' '}
              <strong>customer</strong> or <strong>distributor</strong>.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="billing-sticky-bar md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Payment amount</p>
            <p className="truncate text-lg font-semibold tabular-nums text-ink">
              {formatCurrency(amount)}
            </p>
            {showAllocation ? (
              <p className="text-xs text-ink-muted">
                Allocated {formatCurrency(totalAllocated)}
                {unallocated > 0 ? ` · ${formatCurrency(unallocated)} unallocated` : ''}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            className="min-h-11 shrink-0 touch-manipulation"
            onClick={submit}
            disabled={saving || amount <= 0}
          >
            {saving ? 'Saving…' : 'Save payment'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SummaryTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string
  value: number
  tone: 'success' | 'warning' | 'muted'
  hint?: string
}) {
  return (
    <div
      className={cn(
        'rounded-md border px-3 py-2.5',
        tone === 'success' && 'border-success-border bg-success-bg',
        tone === 'warning' && 'border-warning-border bg-warning-bg',
        tone === 'muted' && 'border-border bg-surface',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{formatCurrency(value)}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-ink-muted">{hint}</p> : null}
    </div>
  )
}
