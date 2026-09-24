import {
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import type { LineItemDraft } from '@/components/shared/LineItemsEditor'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { FormSection, FormStepper } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useShortcutAction } from '@/hooks/use-shortcut-action'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { buildSaleActivity } from '@/utils/activity-timeline'
import { calculateInvoiceTotal, calculateLineAmount } from '@/utils/calculations'
import { cn, todayISO } from '@/utils/cn'
import { buildCreditSnapshot } from '@/utils/credit-control'
import {
  evaluateDiscountControl,
  lineDiscountPercent,
} from '@/utils/discount-control'
import { DraftBanner } from '@/components/shared/DraftBanner'
import { formatCurrency } from '@/utils/format'
import { isEditableTarget } from '@/utils/keyboard'
import {
  clearDraft,
  DRAFT_KEYS,
  formatDraftSavedAt,
  readDraftEnvelope,
  writeDraftEnvelope,
} from '@/utils/draft-autosave'
import { validateSaleInput } from '@/utils/validation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const ActivityTimeline = lazy(() =>
  import('@/components/shared/ActivityTimeline').then((m) => ({ default: m.ActivityTimeline })),
)

const DRAFT_KEY = DRAFT_KEYS.sale
const RATE_OVERRIDE_ROLES = new Set(['Super Admin', 'Admin', 'Manager', 'Accountant'])

interface SaleDraft {
  customerId: string
  date: string
  otherCharges: number
  paid: number
  notes: string
  items: LineItemDraft[]
}

function snapshotDraft(state: SaleDraft): string {
  return JSON.stringify(state)
}

export default function SaleFormPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const locationState = location.state as {
    customerId?: string
    items?: LineItemDraft[]
    notes?: string
    duplicateFromInvoiceId?: string
  } | null
  const presetCustomerId = locationState?.customerId
  const presetItems = locationState?.items
  const presetNotes = locationState?.notes
  const existing = useDmsStore((s) => (id ? s.sales.find((p) => p.id === id) : undefined))
  const {
    customers,
    allProducts,
    categories,
    brands,
    gstRates,
    session,
    saveSale,
    invoices,
    payments,
    salesReturns,
    auditLogs,
    createApproval,
    settings,
    approvals,
  } = useDmsStore(
    useShallow((s) => ({
      customers: s.customers,
      allProducts: s.products,
      categories: s.categories,
      brands: s.brands,
      gstRates: s.gstRates,
      session: s.session,
      saveSale: s.saveSale,
      invoices: s.invoices,
      payments: s.payments,
      salesReturns: s.salesReturns,
      auditLogs: s.auditLogs,
      createApproval: s.createApproval,
      settings: s.settings,
      approvals: s.approvals ?? [],
    })),
  )
  const { toast } = useToast()
  const navigate = useNavigate()

  const products = useMemo(() => allProducts.filter((p) => p.status === 'active'), [allProducts])
  const canOverrideRate = RATE_OVERRIDE_ROLES.has(session?.user.roleName ?? '')

  const saleActivity = useMemo(
    () =>
      existing
        ? buildSaleActivity({
            sale: existing,
            invoice: invoices.find((i) => i.saleId === existing.id),
            payments,
            returns: salesReturns,
            auditLogs,
          })
        : [],
    [existing, invoices, payments, salesReturns, auditLogs],
  )

  const [customerId, setCustomerId] = useState(
    existing?.customerId ?? presetCustomerId ?? customers[0]?.id ?? '',
  )
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [otherCharges, setOtherCharges] = useState(existing?.otherCharges ?? 0)
  const [paid, setPaid] = useState(existing?.paid ?? 0)
  const [notes, setNotes] = useState(existing?.notes ?? presetNotes ?? '')
  const [items, setItems] = useState<LineItemDraft[]>(
    existing?.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      quantity: i.quantity,
      rate: i.rate,
      discount: i.discount,
      gstRate: i.gstRate,
      notes: i.notes,
    })) ??
      presetItems ??
      [],
  )
  const [productSearch, setProductSearch] = useState('')
  const debouncedProductSearch = useDebouncedValue(productSearch, 150)
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [searchHighlight, setSearchHighlight] = useState(0)
  const [activeCartIndex, setActiveCartIndex] = useState(0)
  const [pendingDraft, setPendingDraft] = useState<SaleDraft | null>(() => {
    if (id || (presetItems && presetItems.length > 0)) return null
    return readDraftEnvelope<SaleDraft>(DRAFT_KEY)?.data ?? null
  })
  const [pendingSavedAt, setPendingSavedAt] = useState<string | null>(() => {
    if (id || (presetItems && presetItems.length > 0)) return null
    return readDraftEnvelope<SaleDraft>(DRAFT_KEY)?.savedAt ?? null
  })
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const qtyInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const baselineRef = useRef(
    snapshotDraft({
      customerId: existing?.customerId ?? presetCustomerId ?? customers[0]?.id ?? '',
      date: existing?.date ?? todayISO(),
      otherCharges: existing?.otherCharges ?? 0,
      paid: existing?.paid ?? 0,
      notes: existing?.notes ?? presetNotes ?? '',
      items:
        existing?.items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          rate: i.rate,
          discount: i.discount,
          gstRate: i.gstRate,
          notes: i.notes,
        })) ??
        presetItems ??
        [],
    }),
  )

  const formSnapshot = useMemo(
    (): SaleDraft => ({ customerId, date, otherCharges, paid, notes, items }),
    [customerId, date, otherCharges, paid, notes, items],
  )

  const isDirty = useMemo(
    () => snapshotDraft(formSnapshot) !== baselineRef.current,
    [formSnapshot],
  )

  const filteredProducts = useMemo(() => {
    const q = debouncedProductSearch.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false
      if (brandId && p.brandId !== brandId) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [products, debouncedProductSearch, categoryId, brandId])

  const searchResults = useMemo(() => filteredProducts.slice(0, 12), [filteredProducts])

  useEffect(() => {
    setSearchHighlight(0)
  }, [debouncedProductSearch, categoryId, brandId])

  useEffect(() => {
    if (activeCartIndex >= items.length) {
      setActiveCartIndex(Math.max(0, items.length - 1))
    }
  }, [items.length, activeCartIndex])

  const totals = useMemo(
    () =>
      calculateInvoiceTotal({
        lines: items.map((i) => ({
          qty: i.quantity,
          rate: i.rate,
          discount: i.discount,
          gstRate: i.gstRate,
        })),
        otherCharges,
        paid,
      }),
    [items, otherCharges, paid],
  )

  const customer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId],
  )

  const credit = useMemo(() => {
    if (!customer) return null
    return buildCreditSnapshot({
      creditLimit: customer.creditLimit,
      currentOutstanding: customer.currentBalance,
      currentSaleDue: totals.due,
      currentInvoice: totals.grandTotal,
    })
  }, [customer, totals.due, totals.grandTotal])

  const discountControl = useMemo(
    () =>
      evaluateDiscountControl({
        roleName: session?.user.roleName,
        limits: settings.discountLimits,
        discountAmount: totals.discount,
        subtotalAfterDiscount: totals.subtotal,
      }),
    [session?.user.roleName, settings.discountLimits, totals.discount, totals.subtotal],
  )

  const discountApproved = useMemo(() => {
    if (!discountControl.exceeds || !customerId) return true
    return approvals.some(
      (a) =>
        a.kind === 'discount' &&
        (a.status === 'approved' || a.status === 'completed') &&
        a.payload?.customerId === customerId &&
        (a.payload.discountPercent ?? 0) + 0.01 >= discountControl.effectivePercent,
    )
  }, [approvals, customerId, discountControl.exceeds, discountControl.effectivePercent])

  const discountPending = useMemo(() => {
    if (!discountControl.exceeds || !customerId) return false
    return approvals.some(
      (a) =>
        a.kind === 'discount' &&
        a.status === 'pending_approval' &&
        a.payload?.customerId === customerId &&
        (a.payload.discountPercent ?? 0) + 0.01 >= discountControl.effectivePercent,
    )
  }, [approvals, customerId, discountControl.exceeds, discountControl.effectivePercent])

  const creditApproved = useMemo(() => {
    if (!credit?.exceeded || !customerId) return true
    return approvals.some(
      (a) =>
        a.kind === 'credit_limit' &&
        (a.status === 'approved' || a.status === 'completed') &&
        a.payload?.customerId === customerId &&
        (a.payload.creditLimitRequested ?? 0) + 0.01 >= credit.projectedOutstanding,
    )
  }, [approvals, customerId, credit])

  const creditPending = useMemo(() => {
    if (!credit?.exceeded || !customerId) return false
    return approvals.some(
      (a) =>
        a.kind === 'credit_limit' &&
        a.status === 'pending_approval' &&
        a.payload?.customerId === customerId,
    )
  }, [approvals, customerId, credit])

  const discountRequiresApproval = discountControl.exceeds && !discountApproved
  const creditRequiresApproval =
    settings.enforceCreditLimit !== false && Boolean(credit?.exceeded) && !creditApproved

  const canSubmit = useMemo(() => Boolean(customerId && items.length > 0), [customerId, items.length])
  const canConfirm =
    canSubmit && !discountRequiresApproval && !creditRequiresApproval

  const requestDiscountApproval = () => {
    if (!customer || totals.discount <= 0) {
      toast({ title: 'Add a discount first', variant: 'error' })
      return
    }
    const pct = discountControl.effectivePercent
    const result = createApproval({
      kind: 'discount',
      title: `Discount approval — ${existing?.invoiceNo ?? 'new sale'}`,
      description: `Discount of ${formatCurrency(totals.discount)} (${pct.toFixed(1)}%) exceeds ${session?.user.roleName ?? 'role'} limit of ${discountControl.maxLabel} for ${customer.name}`,
      amount: totals.discount,
      referenceType: 'sale',
      referenceId: existing?.id,
      referenceLabel: existing?.invoiceNo,
      href: existing ? `/transactions/sales/${existing.id}/edit` : '/transactions/sales',
      payload: {
        saleId: existing?.id,
        invoiceNo: existing?.invoiceNo,
        customerId: customer.id,
        customerName: customer.name,
        discountAmount: totals.discount,
        discountPercent: Number(pct.toFixed(2)),
      },
      submit: true,
    })
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Discount sent for approval', description: result.approval?.requestNo, variant: 'success' })
  }

  const requestCreditLimitApproval = () => {
    if (!customer || !credit?.exceeded) {
      toast({ title: 'Credit limit is not exceeded', variant: 'error' })
      return
    }
    const requested = Math.ceil((credit.projectedOutstanding * 1.1) / 1000) * 1000
    const result = createApproval({
      kind: 'credit_limit',
      title: `Credit limit increase — ${customer.name}`,
      description: `Raise credit limit from ${formatCurrency(customer.creditLimit)} to ${formatCurrency(requested)} to cover this sale (projected ${formatCurrency(credit.projectedOutstanding)}).`,
      amount: requested,
      referenceType: 'customer',
      referenceId: customer.id,
      referenceLabel: customer.name,
      href: `/parties/customers/${customer.id}`,
      payload: {
        customerId: customer.id,
        customerName: customer.name,
        creditLimitCurrent: customer.creditLimit,
        creditLimitRequested: requested,
      },
      submit: true,
    })
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({
      title: 'Credit limit request submitted',
      description: result.approval?.requestNo,
      variant: 'success',
    })
  }
  const categoryName = useCallback(
    (cid: string) => categories.find((c) => c.id === cid)?.name ?? '—',
    [categories],
  )
  const brandName = useCallback(
    (bid: string) => brands.find((b) => b.id === bid)?.name ?? '—',
    [brands],
  )

  const addProduct = useCallback(
    (productId: string) => {
      const p = products.find((x) => x.id === productId)
      if (!p) return
      const gstRate = gstRates.find((g) => g.id === p.gstRateId)?.rate ?? 18
      setItems((prev) => {
        const existingIdx = prev.findIndex((row) => row.productId === p.id)
        if (existingIdx >= 0) {
          const next = prev.map((row, i) =>
            i === existingIdx ? { ...row, quantity: row.quantity + 1 } : row,
          )
          setActiveCartIndex(existingIdx)
          return next
        }
        const next = [
          ...prev,
          {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantity: 1,
            rate: p.sellingPrice,
            discount: 0,
            gstRate,
            notes: '',
          },
        ]
        setActiveCartIndex(next.length - 1)
        return next
      })
      setProductSearch('')
      searchInputRef.current?.focus()
    },
    [products, gstRates],
  )

  const updateItem = useCallback((index: number, patch: Partial<LineItemDraft>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }, [])

  const bumpQty = useCallback((index: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((row, i) => {
          if (i !== index) return row
          return { ...row, quantity: Math.max(1, row.quantity + delta) }
        })
        .filter(Boolean),
    )
    setActiveCartIndex(index)
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setActiveCartIndex((i) => Math.max(0, Math.min(i, index - 1)))
  }, [])

  const submit = useCallback(
    (confirm: boolean) => {
      if (!canSubmit) return
      const preCheck = validateSaleInput({
        customerId,
        date,
        items,
        otherCharges,
        paid,
      })
      if (!preCheck.ok) {
        toast({ title: 'Invalid sale', description: preCheck.message, variant: 'error' })
        return
      }
      if (confirm && !canConfirm) {
        if (discountRequiresApproval) {
          toast({
            title: 'Approval required',
            description: `Discount ${discountControl.effectivePercent.toFixed(1)}% exceeds your limit of ${discountControl.maxLabel}.`,
            variant: 'error',
          })
          return
        }
        if (creditRequiresApproval) {
          toast({
            title: 'Credit limit exceeded',
            description: 'Request credit limit approval before confirming this sale.',
            variant: 'error',
          })
          return
        }
        return
      }
      const result = saveSale({
        id: existing?.id,
        customerId,
        date,
        items,
        otherCharges,
        paid,
        notes,
        confirm,
      })
      if (!result.ok) {
        toast({ title: 'Could not save sale', description: result.message, variant: 'error' })
        return
      }
      clearDraft(DRAFT_KEY)
      setLastSavedAt(null)
      baselineRef.current = snapshotDraft(formSnapshot)
      toast({ title: confirm ? 'Sale confirmed' : 'Draft saved', variant: 'success' })
      navigate('/transactions/sales')
    },
    [
      canSubmit,
      canConfirm,
      discountRequiresApproval,
      creditRequiresApproval,
      discountControl.effectivePercent,
      discountControl.maxLabel,
      saveSale,
      existing?.id,
      customerId,
      date,
      items,
      otherCharges,
      paid,
      notes,
      toast,
      navigate,
      formSnapshot,
    ],
  )

  useEffect(() => {
    if (!id && isDirty && !pendingDraft) {
      const t = window.setInterval(() => {
        const envelope = writeDraftEnvelope(DRAFT_KEY, formSnapshot)
        setLastSavedAt(envelope.savedAt)
      }, 3000)
      return () => window.clearInterval(t)
    }
    return undefined
  }, [id, isDirty, formSnapshot, pendingDraft])

  const { dialog: unsavedDialog } = useUnsavedChanges(isDirty, {
    onDiscard: () => {
      if (!id) {
        clearDraft(DRAFT_KEY)
        setLastSavedAt(null)
      }
    },
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const editable = isEditableTarget(e.target)
      const inSearch =
        e.target instanceof HTMLElement &&
        (e.target === searchInputRef.current || searchInputRef.current?.contains(e.target))

      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        if (inSearch || document.activeElement === searchInputRef.current) {
          if (searchResults.length > 0) {
            e.preventDefault()
            const pick = searchResults[searchHighlight] ?? searchResults[0]
            if (pick) addProduct(pick.id)
          }
          return
        }
      }

      if (e.key === 'ArrowDown' && (inSearch || document.activeElement === searchInputRef.current)) {
        if (searchResults.length) {
          e.preventDefault()
          setSearchHighlight((i) => (i + 1) % searchResults.length)
        }
        return
      }

      if (e.key === 'ArrowUp' && (inSearch || document.activeElement === searchInputRef.current)) {
        if (searchResults.length) {
          e.preventDefault()
          setSearchHighlight((i) => (i - 1 + searchResults.length) % searchResults.length)
        }
        return
      }

      if (e.key === '/' && !editable) {
        e.preventDefault()
        const idx = items.length ? Math.min(activeCartIndex, items.length - 1) : -1
        if (idx >= 0) {
          qtyInputRefs.current[idx]?.focus()
          qtyInputRefs.current[idx]?.select()
        }
        return
      }

      if (e.key === '-' && !editable && items.length) {
        e.preventDefault()
        const idx = Math.min(activeCartIndex, items.length - 1)
        bumpQty(idx, -1)
        return
      }

      if ((e.key === '+' || e.key === '=') && !editable && items.length) {
        e.preventDefault()
        const idx = Math.min(activeCartIndex, items.length - 1)
        bumpQty(idx, 1)
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !editable && items.length) {
        if (e.key === 'Backspace') return
        e.preventDefault()
        removeItem(Math.min(activeCartIndex, items.length - 1))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    searchResults,
    searchHighlight,
    addProduct,
    items.length,
    activeCartIndex,
    bumpQty,
    removeItem,
  ])

  const onShortcutSave = useCallback(() => {
    if (canSubmit) submit(false)
  }, [canSubmit, submit])

  const onShortcutSubmit = useCallback(() => {
    if (canConfirm) submit(true)
  }, [canConfirm, submit])

  useShortcutAction('save', onShortcutSave, canSubmit)
  useShortcutAction('submit', onShortcutSubmit, canConfirm)

  useEffect(() => {
    if (!id) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [id])

  const restoreDraft = () => {
    if (!pendingDraft) return
    setCustomerId(pendingDraft.customerId)
    setDate(pendingDraft.date)
    setOtherCharges(pendingDraft.otherCharges)
    setPaid(pendingDraft.paid)
    setNotes(pendingDraft.notes)
    setItems(pendingDraft.items)
    baselineRef.current = snapshotDraft(pendingDraft)
    setLastSavedAt(pendingSavedAt)
    setPendingDraft(null)
    setPendingSavedAt(null)
    toast({ title: 'Draft restored', variant: 'success' })
  }

  const discardDraft = () => {
    clearDraft(DRAFT_KEY)
    setPendingDraft(null)
    setPendingSavedAt(null)
    setLastSavedAt(null)
  }

  return (
    <div className="pb-28 md:pb-0">
      {unsavedDialog}
      <PageHeader
        title={existing ? `Edit ${existing.invoiceNo}` : 'New sale'}
        description={isDirty ? 'Unsaved changes · POS workflow' : 'POS / ERP sales entry'}
        actions={
          <Link to="/transactions/sales">
            <Button variant="outline">Back</Button>
          </Link>
        }
      />

      {pendingDraft ? (
        <DraftBanner
          className="mb-4"
          variant="restore"
          showRestore
          savedAtLabel={pendingSavedAt ? formatDraftSavedAt(pendingSavedAt) : null}
          onRestore={restoreDraft}
          onDelete={discardDraft}
        />
      ) : lastSavedAt ? (
        <DraftBanner
          className="mb-4"
          variant="status"
          savedAtLabel={formatDraftSavedAt(lastSavedAt)}
          onDelete={discardDraft}
        />
      ) : null}

      <FormStepper
        className="mb-4 rounded-md border border-border bg-surface-elevated px-2 py-1"
        steps={[
          { id: 'customer', label: 'Customer' },
          { id: 'items', label: 'Items' },
          { id: 'lines', label: 'Lines' },
          { id: 'pricing', label: 'Pricing' },
          { id: 'tax', label: 'Tax' },
          { id: 'payment', label: 'Payment' },
        ]}
        current={items.length === 0 ? 'customer' : 'items'}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {/* 1. Customer */}
          <FormSection
            step={1}
            title="Customer"
            description="Select the billing party and invoice date. Credit limits are checked when you confirm."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Customer"
                required
                hint="Search by name, mobile, or city"
              >
                <SearchableSelect
                  value={customerId}
                  onChange={setCustomerId}
                  recentScope="customers"
                  placeholder="Select customer…"
                  searchPlaceholder="Search customers…"
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    description: [c.city, c.mobile].filter(Boolean).join(' · '),
                    group: c.city || 'Other',
                    keywords: `${c.gstNumber ?? ''} ${c.email ?? ''}`,
                  }))}
                />
              </FormField>
              <FormField label="Invoice date" required>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </FormField>
            </div>
            {credit ? (
              <div
                className={cn(
                  'space-y-2 rounded-md border px-3 py-3 text-sm',
                  credit.exceeded
                    ? 'border-danger/40 bg-danger/5'
                    : 'border-border bg-surface',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Credit check
                  </h3>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-semibold',
                      credit.exceeded
                        ? 'bg-danger/15 text-danger'
                        : 'bg-success/15 text-success',
                    )}
                  >
                    {credit.exceeded ? 'Credit limit exceeded' : 'Within credit limit'}
                  </span>
                </div>
                <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs text-ink-muted">Credit Limit</dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {formatCurrency(credit.creditLimit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Current Outstanding</dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {formatCurrency(credit.currentOutstanding)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Available Credit</dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {formatCurrency(credit.availableCredit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Current Invoice</dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {formatCurrency(credit.currentInvoice)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Current Sale (due)</dt>
                    <dd className="font-medium tabular-nums text-ink">
                      {formatCurrency(totals.due)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-muted">Projected Outstanding</dt>
                    <dd
                      className={cn(
                        'font-semibold tabular-nums',
                        credit.exceeded ? 'text-danger' : 'text-ink',
                      )}
                    >
                      {formatCurrency(credit.projectedOutstanding)}
                    </dd>
                  </div>
                </dl>
                {creditRequiresApproval ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    <span>
                      {creditPending
                        ? 'Credit approval pending — confirm is blocked until approved.'
                        : 'Credit limit exceeded. Approval required before confirming.'}
                    </span>
                    {!creditPending ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={requestCreditLimitApproval}
                      >
                        Request approval
                      </Button>
                    ) : (
                      <Link
                        to="/admin/approvals"
                        className="text-xs font-medium underline underline-offset-2"
                      >
                        View approvals
                      </Link>
                    )}
                  </div>
                ) : null}
                {credit.exceeded && creditApproved ? (
                  <p className="text-xs font-medium text-success">
                    Credit limit approval on file — confirm allowed.
                  </p>
                ) : null}
              </div>
            ) : null}
          </FormSection>

          {/* 2. Product search */}
          <FormSection
            step={2}
            title="Products"
            description="Search the catalog, filter by category or brand, then add lines to the cart."
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
              <FormField label="Search" hint="Enter to select · ↑↓ navigate">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <Input
                    ref={searchInputRef}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Name, SKU, or barcode…"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </FormField>
              <FormField label="Category">
                <SearchableSelect
                  value={categoryId}
                  onChange={setCategoryId}
                  clearable
                  recentScope="categories-filter"
                  placeholder="All categories"
                  searchPlaceholder="Filter category…"
                  options={[
                    { value: '', label: 'All categories' },
                    ...categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                      group: c.parentId ? 'Sub-categories' : 'Categories',
                    })),
                  ]}
                />
              </FormField>
              <FormField label="Brand">
                <SearchableSelect
                  value={brandId}
                  onChange={setBrandId}
                  clearable
                  recentScope="brands-filter"
                  placeholder="All brands"
                  searchPlaceholder="Filter brand…"
                  options={[
                    { value: '', label: 'All brands' },
                    ...brands.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                />
              </FormField>
            </div>

            <div className="max-h-56 overflow-y-auto rounded-md border border-border">
              {searchResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">No products match this search.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {searchResults.map((p, idx) => {
                    const active = idx === searchHighlight
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                            active ? 'bg-brand-600 text-white' : 'hover:bg-surface',
                          )}
                          onMouseEnter={() => setSearchHighlight(idx)}
                          onClick={() => addProduct(p.id)}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{p.name}</span>
                            <span
                              className={cn(
                                'block truncate text-xs',
                                active ? 'text-brand-100' : 'text-ink-muted',
                              )}
                            >
                              {p.sku}
                              {p.barcode ? ` · ${p.barcode}` : ''} · {categoryName(p.categoryId)} ·{' '}
                              {brandName(p.brandId)} · Stock {p.currentStock}
                            </span>
                          </span>
                          <span className={cn('shrink-0 tabular-nums font-semibold', active ? 'text-white' : 'text-ink')}>
                            {formatCurrency(p.sellingPrice)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </FormSection>

          {/* 3. Cart */}
          <FormSection
            step={3}
            title="Cart & pricing"
            description="Adjust quantities, rates, and line discounts. Excess discount may need approval."
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-subtle">
                Max discount for {session?.user.roleName ?? 'you'}:{' '}
                <span className="font-semibold text-ink">{discountControl.maxLabel}</span>
              </p>
            </div>

            {discountRequiresApproval ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-warning">Approval required</p>
                  <p className="text-xs text-ink-muted">
                    Invoice discount {discountControl.effectivePercent.toFixed(1)}% exceeds your
                    allowed {discountControl.maxLabel}. Confirm is blocked — not silently allowed.
                  </p>
                </div>
                {discountPending ? (
                  <Link
                    to="/admin/approvals"
                    className="text-xs font-medium text-brand-700 underline dark:text-brand-300"
                  >
                    Pending approval
                  </Link>
                ) : (
                  <Button type="button" size="sm" onClick={requestDiscountApproval}>
                    Request approval
                  </Button>
                )}
              </div>
            ) : null}
            {discountControl.exceeds && discountApproved ? (
              <p className="rounded-md border border-success-border bg-success-bg px-3 py-2 text-xs font-medium text-success">
                Discount approval on file — confirm allowed.
              </p>
            ) : null}

            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-ink-muted">
                Cart is empty. Search and press Enter to add products.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[860px] text-sm">
                  <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
                    <tr>
                      <th className="px-2 py-2">Product</th>
                      <th className="px-2 py-2 w-28">Qty</th>
                      <th className="px-2 py-2 w-28">Rate</th>
                      <th className="px-2 py-2 w-28">Disc. ₹</th>
                      <th className="px-2 py-2 w-20">GST%</th>
                      <th className="px-2 py-2 min-w-[140px]">Notes</th>
                      <th className="px-2 py-2 w-28 text-right">Amount</th>
                      <th className="px-2 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, index) => {
                      const stock = products.find((p) => p.id === row.productId)?.currentStock
                      const active = index === activeCartIndex
                      const linePct = lineDiscountPercent(row.quantity, row.rate, row.discount)
                      const lineOver =
                        discountControl.maxPercent !== null &&
                        linePct > discountControl.maxPercent + 0.001
                      return (
                        <tr
                          key={`${row.productId}-${index}`}
                          className={cn(
                            'border-t border-border',
                            active ? 'bg-brand-50/80 dark:bg-brand-900/20' : undefined,
                          )}
                          onClick={() => setActiveCartIndex(index)}
                        >
                          <td className="px-2 py-2">
                            <p className="font-medium text-ink">{row.productName}</p>
                            <p className="text-xs text-ink-muted">
                              {row.sku}
                              {stock !== undefined ? ` · Stock ${stock}` : ''}
                            </p>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  bumpQty(index, -1)
                                }}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <Input
                                ref={(el) => {
                                  qtyInputRefs.current[index] = el
                                }}
                                type="number"
                                min={1}
                                value={row.quantity}
                                className="h-8 w-14 px-1 text-center"
                                onFocus={() => setActiveCartIndex(index)}
                                onChange={(e) =>
                                  updateItem(index, { quantity: Math.max(1, Number(e.target.value) || 1) })
                                }
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  bumpQty(index, 1)
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.rate}
                              disabled={!canOverrideRate}
                              title={
                                canOverrideRate
                                  ? 'Rate override allowed'
                                  : 'Rate override requires Manager+ permission'
                              }
                              onFocus={() => setActiveCartIndex(index)}
                              onChange={(e) => updateItem(index, { rate: Number(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.discount}
                              className={cn(lineOver && 'border-warning focus-visible:ring-warning')}
                              title={
                                lineOver
                                  ? `Line discount ${linePct.toFixed(1)}% — approval required`
                                  : undefined
                              }
                              onFocus={() => setActiveCartIndex(index)}
                              onChange={(e) => updateItem(index, { discount: Number(e.target.value) || 0 })}
                            />
                            {lineOver ? (
                              <p className="mt-0.5 text-[10px] font-medium text-warning">
                                {linePct.toFixed(1)}% · Approval required
                              </p>
                            ) : row.discount > 0 ? (
                              <p className="mt-0.5 text-[10px] text-ink-muted">{linePct.toFixed(1)}%</p>
                            ) : null}
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.gstRate}
                              onFocus={() => setActiveCartIndex(index)}
                              onChange={(e) => updateItem(index, { gstRate: Number(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              value={row.notes ?? ''}
                              placeholder="Line note"
                              onFocus={() => setActiveCartIndex(index)}
                              onChange={(e) => updateItem(index, { notes: e.target.value })}
                            />
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums font-medium">
                            {formatCurrency(calculateLineAmount(row.quantity, row.rate, row.discount))}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeItem(index)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-danger" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </FormSection>

          {/* 4–6. Pricing / Tax / Payment */}
          <div className="grid gap-4 lg:grid-cols-3">
            <FormSection step={4} title="Pricing" description="Extra charges and notes on the invoice.">
              <FormField label="Other charges">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                />
              </FormField>
              <FormField label="Invoice notes">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Bill-level notes…"
                  className="min-h-[72px]"
                />
              </FormField>
            </FormSection>

            <FormSection step={5} title="Tax" description="GST breakdown for this invoice.">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Taxable</dt>
                  <dd className="tabular-nums">{formatCurrency(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">CGST</dt>
                  <dd className="tabular-nums">{formatCurrency(totals.cgst)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">SGST</dt>
                  <dd className="tabular-nums">{formatCurrency(totals.sgst)}</dd>
                </div>
                {totals.igst > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">IGST</dt>
                    <dd className="tabular-nums">{formatCurrency(totals.igst)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <dt>Total tax</dt>
                  <dd className="tabular-nums">
                    {formatCurrency(totals.cgst + totals.sgst + totals.igst)}
                  </dd>
                </div>
              </dl>
            </FormSection>

            <FormSection step={6} title="Payment" description="Record amount received against this sale.">
              <FormField label="Amount paid">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paid}
                  onChange={(e) => setPaid(Number(e.target.value) || 0)}
                />
              </FormField>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setPaid(totals.grandTotal)}
                >
                  Pay full
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setPaid(0)}>
                  Credit
                </Button>
              </div>
              <p className="text-xs text-ink-muted">
                Due after payment:{' '}
                <span className="font-semibold tabular-nums text-ink">{formatCurrency(totals.due)}</span>
              </p>
            </FormSection>
          </div>
        </div>

        {/* 7. Invoice preview + actions */}
        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <section className="erp-card space-y-3 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Invoice preview</h2>
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-medium text-ink">{customer?.name ?? 'Select customer'}</p>
              <p className="text-xs text-ink-muted">
                {existing?.invoiceNo ?? 'New invoice'} · {date}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{items.length} line(s)</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Discount</dt>
                <dd
                  className={cn(
                    'tabular-nums',
                    discountRequiresApproval && 'font-semibold text-warning',
                  )}
                >
                  {formatCurrency(totals.discount)}
                  {totals.discount > 0 ? (
                    <span className="ml-1 text-xs text-ink-muted">
                      ({discountControl.effectivePercent.toFixed(1)}%)
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Tax</dt>
                <dd className="tabular-nums">
                  {formatCurrency(totals.cgst + totals.sgst + totals.igst)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Other charges</dt>
                <dd className="tabular-nums">{formatCurrency(totals.otherCharges)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Round off</dt>
                <dd className="tabular-nums">{formatCurrency(totals.roundOff)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-semibold">Grand total</dt>
                <dd className="tabular-nums font-semibold text-brand-700 dark:text-brand-300">
                  {formatCurrency(totals.grandTotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Paid</dt>
                <dd className="tabular-nums">{formatCurrency(totals.paid)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Due</dt>
                <dd className="tabular-nums font-semibold">{formatCurrency(totals.due)}</dd>
              </div>
            </dl>
            <p className="text-xs text-ink-muted">
              <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+S
              </kbd>{' '}
              save draft ·{' '}
              <kbd className="rounded border border-border bg-surface-muted px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl+Enter
              </kbd>{' '}
              confirm sale
            </p>
          </section>
          <Button
            type="button"
            className="w-full"
            disabled={!canConfirm}
            onClick={() => submit(true)}
            title={
              !canConfirm && canSubmit
                ? discountRequiresApproval
                  ? 'Approval required for discount'
                  : creditRequiresApproval
                    ? 'Credit limit exceeded — approval required'
                    : undefined
                : undefined
            }
          >
            Confirm sale
          </Button>
          {!canConfirm && canSubmit ? (
            <p className="text-center text-xs font-medium text-warning">
              {discountRequiresApproval
                ? 'Approval required — reduce discount or get approval'
                : 'Credit limit exceeded — approval required'}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => submit(false)}
          >
            Save draft
          </Button>
          {discountRequiresApproval && !discountPending ? (
            <Button type="button" variant="outline" className="w-full" onClick={requestDiscountApproval}>
              Request discount approval
            </Button>
          ) : null}
          {creditRequiresApproval && !creditPending ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={requestCreditLimitApproval}
            >
              Request credit limit approval
            </Button>
          ) : null}
          {existing ? (
            <Suspense fallback={null}>
              <ActivityTimeline
                events={saleActivity}
                compact
                maxHeightClassName="max-h-64"
                className="print:hidden"
              />
            </Suspense>
          ) : null}
        </aside>
      </div>

      {/* Mobile sticky billing bar */}
      <div className="billing-sticky-bar md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Grand total</p>
            <p className="truncate text-lg font-semibold tabular-nums text-ink">
              {formatCurrency(totals.grandTotal)}
            </p>
            <p className="text-xs text-ink-muted">
              Due {formatCurrency(totals.due)} · {items.length} line(s)
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 touch-manipulation"
              disabled={!canSubmit}
              onClick={() => submit(false)}
            >
              Draft
            </Button>
            <Button
              type="button"
              className="min-h-11 touch-manipulation"
              disabled={!canConfirm}
              onClick={() => submit(true)}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
