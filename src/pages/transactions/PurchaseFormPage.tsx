import {
  Minus,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import type { Product } from '@/types'
import { buildPurchaseActivity } from '@/utils/activity-timeline'
import { calculateInvoiceTotal, calculateLineAmount, roundMoney } from '@/utils/calculations'
import { cn, todayISO } from '@/utils/cn'
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
import { validatePurchaseInput } from '@/utils/validation'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const ActivityTimeline = lazy(() =>
  import('@/components/shared/ActivityTimeline').then((m) => ({ default: m.ActivityTimeline })),
)

const DRAFT_KEY = DRAFT_KEYS.purchase
const RATE_OVERRIDE_ROLES = new Set(['Super Admin', 'Admin', 'Manager', 'Accountant'])

interface PurchaseDraft {
  supplierId: string
  date: string
  invoiceNo: string
  otherCharges: number
  roundOff: number
  autoRoundOff: boolean
  paid: number
  notes: string
  items: LineItemDraft[]
}

function readDraft(): PurchaseDraft | null {
  const env = readDraftEnvelope<PurchaseDraft>(DRAFT_KEY)
  if (!env) return null
  return {
    ...env.data,
    autoRoundOff: env.data.autoRoundOff ?? true,
    roundOff: env.data.roundOff ?? 0,
  }
}

function snapshotDraft(state: PurchaseDraft): string {
  return JSON.stringify(state)
}

function findProductByToken(products: Product[], token: string): Product | undefined {
  const t = token.trim().toLowerCase()
  if (!t) return undefined
  return products.find(
    (p) =>
      p.sku.toLowerCase() === t ||
      p.name.toLowerCase() === t ||
      p.barcode?.toLowerCase() === t,
  )
}

function parseBulkEntry(text: string, products: Product[]): { product: Product; quantity: number }[] {
  const rows: { product: Product; quantity: number }[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.includes(',')
      ? trimmed.split(',').map((s) => s.trim())
      : trimmed.split(/\s+/).filter(Boolean)
    if (!parts.length) continue
    const product = findProductByToken(products, parts[0])
    if (!product) continue
    const qty = parts.length > 1 ? Math.max(1, Number(parts[1]) || 1) : 1
    rows.push({ product, quantity: qty })
  }
  return rows
}

export default function PurchaseFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const existing = useDmsStore((s) => (id ? s.purchases.find((p) => p.id === id) : undefined))
  const {
    suppliers,
    allProducts,
    categories,
    brands,
    gstRates,
    session,
    savePurchase,
    payments,
    purchaseReturns,
    movements,
    auditLogs,
    createApproval,
  } = useDmsStore(
    useShallow((s) => ({
      suppliers: s.suppliers,
      allProducts: s.products,
      categories: s.categories,
      brands: s.brands,
      gstRates: s.gstRates,
      session: s.session,
      savePurchase: s.savePurchase,
      payments: s.payments,
      purchaseReturns: s.purchaseReturns,
      movements: s.movements,
      auditLogs: s.auditLogs,
      createApproval: s.createApproval,
    })),
  )
  const { toast } = useToast()
  const navigate = useNavigate()

  const products = useMemo(() => allProducts.filter((p) => p.status === 'active'), [allProducts])
  const canOverrideRate = RATE_OVERRIDE_ROLES.has(session?.user.roleName ?? '')

  const purchaseActivity = useMemo(
    () =>
      existing
        ? buildPurchaseActivity({
            purchase: existing,
            payments,
            returns: purchaseReturns,
            movements,
            auditLogs,
          })
        : [],
    [existing, payments, purchaseReturns, movements, auditLogs],
  )

  const requestPurchaseApproval = () => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    if (!canSubmit) {
      toast({ title: 'Add line items first', variant: 'error' })
      return
    }
    const result = createApproval({
      kind: 'purchase',
      title: `Purchase ${existing?.purchaseNo ?? 'draft'} approval`,
      description: `Purchase from ${supplier?.name ?? 'supplier'} for ${formatCurrency(totals.grandTotal)} requires approval.`,
      amount: totals.grandTotal,
      referenceType: 'purchase',
      referenceId: existing?.id,
      referenceLabel: existing?.purchaseNo ?? (invoiceNo || 'New purchase'),
      href: existing ? `/transactions/purchases/${existing.id}/edit` : '/transactions/purchases',
      payload: {
        purchaseId: existing?.id,
        purchaseNo: existing?.purchaseNo,
        supplierId,
        supplierName: supplier?.name,
      },
      submit: true,
    })
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Purchase sent for approval', description: result.approval?.requestNo, variant: 'success' })
  }

  const [supplierId, setSupplierId] = useState(existing?.supplierId ?? suppliers[0]?.id ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [invoiceNo, setInvoiceNo] = useState(existing?.invoiceNo ?? '')
  const [otherCharges, setOtherCharges] = useState(existing?.otherCharges ?? 0)
  const [autoRoundOff, setAutoRoundOff] = useState(true)
  const [roundOff, setRoundOff] = useState(existing?.roundOff ?? 0)
  const [paid, setPaid] = useState(existing?.paid ?? 0)
  const [notes, setNotes] = useState(existing?.notes ?? '')
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
    })) ?? [],
  )
  const [productSearch, setProductSearch] = useState('')
  const debouncedProductSearch = useDebouncedValue(productSearch, 150)
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [searchHighlight, setSearchHighlight] = useState(0)
  const [activeLineIndex, setActiveLineIndex] = useState(0)
  const [bulkText, setBulkText] = useState('')
  const [pendingDraft, setPendingDraft] = useState<PurchaseDraft | null>(() => (!id ? readDraft() : null))
  const [pendingSavedAt, setPendingSavedAt] = useState<string | null>(() =>
    !id ? (readDraftEnvelope<PurchaseDraft>(DRAFT_KEY)?.savedAt ?? null) : null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const baselineRef = useRef(
    snapshotDraft({
      supplierId: existing?.supplierId ?? suppliers[0]?.id ?? '',
      date: existing?.date ?? todayISO(),
      invoiceNo: existing?.invoiceNo ?? '',
      otherCharges: existing?.otherCharges ?? 0,
      roundOff: existing?.roundOff ?? 0,
      autoRoundOff: true,
      paid: existing?.paid ?? 0,
      notes: existing?.notes ?? '',
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
        })) ?? [],
    }),
  )

  const formSnapshot = useMemo(
    (): PurchaseDraft => ({
      supplierId,
      date,
      invoiceNo,
      otherCharges,
      roundOff,
      autoRoundOff,
      paid,
      notes,
      items,
    }),
    [supplierId, date, invoiceNo, otherCharges, roundOff, autoRoundOff, paid, notes, items],
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
    if (activeLineIndex >= items.length) {
      setActiveLineIndex(Math.max(0, items.length - 1))
    }
  }, [items.length, activeLineIndex])

  const totalsAuto = useMemo(
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

  const totals = useMemo(() => {
    if (autoRoundOff) return totalsAuto
    return calculateInvoiceTotal({
      lines: items.map((i) => ({
        qty: i.quantity,
        rate: i.rate,
        discount: i.discount,
        gstRate: i.gstRate,
      })),
      otherCharges,
      roundOff,
      paid,
    })
  }, [autoRoundOff, totalsAuto, items, otherCharges, roundOff, paid])

  useEffect(() => {
    if (autoRoundOff) setRoundOff(totalsAuto.roundOff)
  }, [autoRoundOff, totalsAuto.roundOff])

  const supplier = useMemo(
    () => suppliers.find((s) => s.id === supplierId),
    [suppliers, supplierId],
  )

  const canSubmit = useMemo(() => Boolean(supplierId && items.length > 0), [supplierId, items.length])

  const categoryName = useCallback(
    (cid: string) => categories.find((c) => c.id === cid)?.name ?? '—',
    [categories],
  )

  const addProduct = useCallback(
    (productId: string, quantity = 1) => {
      const p = products.find((x) => x.id === productId)
      if (!p) return
      const gstRate = gstRates.find((g) => g.id === p.gstRateId)?.rate ?? 18
      setItems((prev) => {
        const idx = prev.findIndex((row) => row.productId === p.id)
        if (idx >= 0) {
          const next = prev.map((row, i) =>
            i === idx ? { ...row, quantity: row.quantity + quantity } : row,
          )
          setActiveLineIndex(idx)
          return next
        }
        const next = [
          ...prev,
          {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantity,
            rate: p.purchasePrice,
            discount: 0,
            gstRate,
            notes: '',
          },
        ]
        setActiveLineIndex(next.length - 1)
        return next
      })
      setProductSearch('')
      searchInputRef.current?.focus()
    },
    [products, gstRates],
  )

  const mergeBulkRows = useCallback(
    (rows: { product: Product; quantity: number }[]) => {
      if (!rows.length) {
        toast({ title: 'No valid lines', description: 'Check SKU or barcode in bulk text.', variant: 'error' })
        return
      }
      setItems((prev) => {
        const next = [...prev]
        for (const { product: p, quantity } of rows) {
          const gstRate = gstRates.find((g) => g.id === p.gstRateId)?.rate ?? 18
          const idx = next.findIndex((r) => r.productId === p.id)
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity }
          } else {
            next.push({
              productId: p.id,
              productName: p.name,
              sku: p.sku,
              quantity,
              rate: p.purchasePrice,
              discount: 0,
              gstRate,
              notes: '',
            })
          }
        }
        return next
      })
      toast({ title: 'Bulk lines added', description: `${rows.length} product row(s) processed.`, variant: 'success' })
      setBulkText('')
    },
    [gstRates, toast],
  )

  const updateItem = useCallback((index: number, patch: Partial<LineItemDraft>) => {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }, [])

  const bumpQty = useCallback((index: number, delta: number) => {
    setItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, quantity: Math.max(1, row.quantity + delta) } : row,
      ),
    )
    setActiveLineIndex(index)
  }, [])

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
    setActiveLineIndex((i) => Math.max(0, Math.min(i, index - 1)))
  }, [])

  const submit = useCallback(
    (confirm: boolean) => {
      if (!canSubmit) return
      const preCheck = validatePurchaseInput({
        supplierId,
        date,
        items,
        otherCharges,
        roundOff: autoRoundOff ? 0 : roundOff,
        paid,
      })
      if (!preCheck.ok) {
        toast({ title: 'Invalid purchase', description: preCheck.message, variant: 'error' })
        return
      }
      const result = savePurchase({
        id: existing?.id,
        supplierId,
        date,
        invoiceNo,
        items,
        otherCharges,
        roundOff: autoRoundOff ? undefined : roundOff,
        paid,
        notes,
        confirm,
      })
      if (!result.ok) {
        toast({ title: 'Could not save purchase', description: result.message, variant: 'error' })
        return
      }
      clearDraft(DRAFT_KEY)
      setLastSavedAt(null)
      baselineRef.current = snapshotDraft(formSnapshot)
      toast({ title: confirm ? 'Purchase confirmed — stock updated' : 'Draft saved', variant: 'success' })
      navigate('/transactions/purchases')
    },
    [
      canSubmit,
      savePurchase,
      existing?.id,
      supplierId,
      date,
      invoiceNo,
      items,
      otherCharges,
      autoRoundOff,
      roundOff,
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
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchResults, searchHighlight, addProduct])

  const onShortcutSave = useCallback(() => {
    if (canSubmit) submit(false)
  }, [canSubmit, submit])

  const onShortcutSubmit = useCallback(() => {
    if (canSubmit) submit(true)
  }, [canSubmit, submit])

  useShortcutAction('save', onShortcutSave, canSubmit)
  useShortcutAction('submit', onShortcutSubmit, canSubmit)

  useEffect(() => {
    if (!id) {
      const t = window.setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => window.clearTimeout(t)
    }
    return undefined
  }, [id])

  const restoreDraft = () => {
    if (!pendingDraft) return
    setSupplierId(pendingDraft.supplierId)
    setDate(pendingDraft.date)
    setInvoiceNo(pendingDraft.invoiceNo)
    setOtherCharges(pendingDraft.otherCharges)
    setAutoRoundOff(pendingDraft.autoRoundOff)
    setRoundOff(pendingDraft.roundOff)
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
        title={isEdit ? `Edit ${existing?.purchaseNo ?? 'purchase'}` : 'New purchase'}
        description={isDirty ? 'Unsaved changes · autosave every 3s' : 'Purchase entry'}
        actions={
          <Link to="/transactions/purchases">
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
          { id: 'supplier', label: 'Supplier' },
          { id: 'catalog', label: 'Catalog' },
          { id: 'charges', label: 'Charges' },
          { id: 'lines', label: 'Lines' },
          { id: 'payment', label: 'Payment' },
        ]}
        current={items.length === 0 ? 'supplier' : 'catalog'}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <FormSection
            step={1}
            title="Supplier"
            description="Choose the supplier and bill details for this purchase."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Supplier"
                required
                hint="Search by name, mobile, or GSTIN"
                className="sm:col-span-2"
              >
                <SearchableSelect
                  value={supplierId}
                  onChange={setSupplierId}
                  recentScope="suppliers"
                  placeholder="Select supplier…"
                  searchPlaceholder="Search suppliers…"
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    description: [s.city, s.mobile, s.gstNumber].filter(Boolean).join(' · '),
                    group: s.city || 'Other',
                    keywords: `${s.companyName ?? ''} ${s.gstNumber ?? ''}`,
                  }))}
                />
              </FormField>
              <FormField label="Bill date" required>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </FormField>
              <FormField label="Supplier invoice #" hint="Optional reference from the supplier bill">
                <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Supplier bill no." />
              </FormField>
            </div>
            {supplier ? (
              <p className="text-xs text-ink-muted">
                {supplier.mobile}
                {supplier.gstNumber ? ` · GST ${supplier.gstNumber}` : ''} · Balance{' '}
                {formatCurrency(supplier.currentBalance)}
              </p>
            ) : null}
          </FormSection>

          <FormSection
            step={2}
            title="Products"
            description="Search and add products received in this purchase."
          >
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
              <FormField label="Search">
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
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Brand">
                <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="">All brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              {searchResults.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">No products match.</p>
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
                              {p.barcode ? ` · ${p.barcode}` : ''} · {categoryName(p.categoryId)}
                            </span>
                          </span>
                          <span className={cn('shrink-0 tabular-nums font-semibold', active ? 'text-white' : 'text-ink')}>
                            {formatCurrency(p.purchasePrice)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={searchResults.length === 0}
              onClick={() => mergeBulkRows(searchResults.map((p) => ({ product: p, quantity: 1 })))}
            >
              Add all visible ({searchResults.length})
            </Button>
          </FormSection>

          <FormSection
            step={3}
            title="Bulk product entry"
            description="Paste SKU and quantity lines for fast warehouse receiving."
          >
            <p className="text-xs text-ink-muted">
              One product per line: <code className="rounded bg-surface px-1">SKU, quantity</code> or{' '}
              <code className="rounded bg-surface px-1">SKU quantity</code> (barcode supported).
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'SC-DC-70, 5\n8901001001002 3\n# comment lines ignored'}
              className="min-h-[100px] font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => mergeBulkRows(parseBulkEntry(bulkText, products))}
            >
              Apply bulk lines
            </Button>
          </FormSection>

          <FormSection step={4} title="Line items" description="Review quantities and purchase rates.">
            {items.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-ink-muted">
                No products yet. Search, bulk entry, or press Enter on a product.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
                    <tr>
                      <th className="px-2 py-2">Product</th>
                      <th className="px-2 py-2 w-28">Qty</th>
                      <th className="px-2 py-2 w-28">Rate</th>
                      <th className="px-2 py-2 w-24">Disc.</th>
                      <th className="px-2 py-2 w-20">GST%</th>
                      <th className="px-2 py-2 w-28 text-right">Amount</th>
                      <th className="px-2 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, index) => {
                      const active = index === activeLineIndex
                      return (
                        <tr
                          key={`${row.productId}-${index}`}
                          className={cn(
                            'border-t border-border',
                            active ? 'bg-brand-50/80 dark:bg-brand-900/20' : undefined,
                          )}
                          onClick={() => setActiveLineIndex(index)}
                        >
                          <td className="px-2 py-2">
                            <p className="font-medium text-ink">{row.productName}</p>
                            <p className="text-xs text-ink-muted">{row.sku}</p>
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
                                type="number"
                                min={1}
                                value={row.quantity}
                                className="h-8 w-14 px-1 text-center"
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
                              onChange={(e) => updateItem(index, { rate: Number(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={row.discount}
                              onChange={(e) => updateItem(index, { discount: Number(e.target.value) || 0 })}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <Input
                              type="number"
                              min={0}
                              value={row.gstRate}
                              onChange={(e) => updateItem(index, { gstRate: Number(e.target.value) || 0 })}
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

          <div className="grid gap-4 lg:grid-cols-2">
            <FormSection step={5} title="Charges" description="Freight, round-off, and other bill charges.">
              <FormField label="Other charges">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <input
                  id="auto-round"
                  type="checkbox"
                  checked={autoRoundOff}
                  onChange={(e) => setAutoRoundOff(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="auto-round" className="text-sm text-ink">
                  Auto round off to nearest rupee
                </label>
              </div>
              <FormField label="Round off">
                <Input
                  type="number"
                  step="0.01"
                  value={roundOff}
                  disabled={autoRoundOff}
                  onChange={(e) => setRoundOff(roundMoney(Number(e.target.value) || 0))}
                />
              </FormField>
              <FormField label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[72px]" />
              </FormField>
            </FormSection>

            <FormSection step={6} title="Payment" description="Amount paid to the supplier against this bill.">
              <FormField label="Paid amount">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={paid}
                  onChange={(e) => setPaid(Number(e.target.value) || 0)}
                />
              </FormField>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setPaid(totals.grandTotal)}>
                  Pay full
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setPaid(0)}>
                  On credit
                </Button>
              </div>
            </FormSection>
          </div>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <section className="erp-card space-y-3 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Purchase summary</h2>
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <p className="font-medium text-ink">{supplier?.name ?? 'Select supplier'}</p>
              <p className="text-xs text-ink-muted">
                {existing?.purchaseNo ?? 'New PO'} · {date}
                {invoiceNo ? ` · Bill ${invoiceNo}` : ''}
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</dd>
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
              confirm
            </p>
          </section>
          <Button type="button" className="w-full" disabled={!canSubmit} onClick={() => submit(true)}>
            Confirm &amp; update stock
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled={!canSubmit} onClick={() => submit(false)}>
            Save draft
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={!canSubmit}
            onClick={requestPurchaseApproval}
          >
            Submit for approval
          </Button>
          {existing ? (
            <Suspense fallback={null}>
              <ActivityTimeline
                events={purchaseActivity}
                compact
                maxHeightClassName="max-h-64"
                className="print:hidden"
              />
            </Suspense>
          ) : null}
        </aside>
      </div>

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
              disabled={!canSubmit}
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
