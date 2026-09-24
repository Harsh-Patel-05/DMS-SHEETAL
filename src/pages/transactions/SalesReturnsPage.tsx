import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { SalesReturn } from '@/types'
import { Can } from '@/components/auth/Can'
import { CodeCell } from '@/components/shared/RowActions'
import { DraftBanner } from '@/components/shared/DraftBanner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/components/ui/toast'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { DRAFT_KEYS, formatDraftSavedAt } from '@/utils/draft-autosave'
import { formatCurrency, formatDate } from '@/utils/format'

interface SalesReturnDraft {
  saleId: string
  productId: string
  qty: number
  reason: string
}

export default function SalesReturnsPage() {
  const returns = useDmsStore((s) => s.salesReturns)
  const sales = useDmsStore((s) => s.sales)
  const createSalesReturn = useDmsStore((s) => s.createSalesReturn)
  const createApproval = useDmsStore((s) => s.createApproval)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SalesReturnDraft>({
    saleId: sales[0]?.id ?? '',
    productId: '',
    qty: 1,
    reason: '',
  })
  const [offerRestore, setOfferRestore] = useState(false)
  const [saving, setSaving] = useState(false)

  const draftPayload = useMemo(() => form, [form])
  const { lastSavedLabel, pendingEnvelope, deleteDraft, acknowledgePending, saveNow } =
    useDraftAutosave<SalesReturnDraft>({
      key: DRAFT_KEYS.salesReturn,
      data: draftPayload,
      enabled: open && !offerRestore,
      intervalMs: 3000,
    })

  const isDirty = open && !offerRestore && (Boolean(form.reason) || form.qty !== 1 || Boolean(form.productId))
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)

  useEffect(() => {
    if (!open) return
    if (pendingEnvelope) setOfferRestore(true)
  }, [open, pendingEnvelope])

  const sale = sales.find((s) => s.id === form.saleId)
  const products = sale?.items ?? []
  const line = products.find((p) => p.productId === (form.productId || products[0]?.productId))

  const saleOptions = useMemo(
    () =>
      sales.map((s) => ({
        value: s.id,
        label: s.invoiceNo,
        description: `${s.customerName} · ${formatDate(s.date)}`,
        group: s.customerName || 'Sales',
      })),
    [sales],
  )

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.productId,
        label: p.productName,
        description: `Qty ${p.quantity} · ${formatCurrency(p.amount)}`,
      })),
    [products],
  )

  const openNew = () => {
    setForm({
      saleId: sales[0]?.id ?? '',
      productId: '',
      qty: 1,
      reason: '',
    })
    setOfferRestore(Boolean(pendingEnvelope))
    setOpen(true)
  }

  const restoreDraft = () => {
    const env = acknowledgePending()
    if (!env) return
    setForm({
      saleId: env.data.saleId || sales[0]?.id || '',
      productId: env.data.productId || '',
      qty: env.data.qty ?? 1,
      reason: env.data.reason ?? '',
    })
    setOfferRestore(false)
    toast({ title: 'Draft restored', variant: 'success' })
  }

  const onDeleteDraft = () => {
    deleteDraft()
    setOfferRestore(false)
    setForm({ saleId: sales[0]?.id ?? '', productId: '', qty: 1, reason: '' })
  }

  const closeModal = () => {
    confirmIfDirty(() => {
      if (!offerRestore) saveNow()
      setOpen(false)
    })
  }

  const submit = (asApproval: boolean) => {
    const pid = form.productId || products[0]?.productId || ''
    if (!pid) {
      toast({ title: 'Select a product', variant: 'error' })
      return
    }
    setSaving(true)
    if (asApproval) {
      const amount = line ? (line.amount / line.quantity) * form.qty : 0
      const result = createApproval({
        kind: 'return',
        title: `Sales return approval — ${sale?.invoiceNo ?? 'sale'}`,
        description: form.reason || `Return ${form.qty} units of ${line?.productName ?? 'product'}`,
        amount,
        referenceType: 'sales_return',
        referenceId: form.saleId,
        referenceLabel: sale?.invoiceNo,
        href: '/transactions/sales-returns',
        payload: {
          saleId: form.saleId,
          invoiceNo: sale?.invoiceNo,
          productId: pid,
          productName: line?.productName,
          returnQuantity: form.qty,
          customerId: sale?.customerId,
          customerName: sale?.customerName,
        },
        submit: true,
      })
      setSaving(false)
      if (!result.ok) {
        toast({ title: 'Failed', description: result.message, variant: 'error' })
        return
      }
      toast({ title: 'Return sent for approval', description: result.approval?.requestNo, variant: 'success' })
      deleteDraft()
      setOpen(false)
      return
    }
    const result = createSalesReturn({
      saleId: form.saleId,
      productId: pid,
      returnQuantity: form.qty,
      reason: form.reason,
    })
    setSaving(false)
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Sales return created', variant: 'success' })
    deleteDraft()
    setOpen(false)
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Sales returns"
        description="Returns against confirmed sales invoices"
        actions={
          <Can module="returns" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={openNew}>
              <Plus className="h-4 w-4" /> New return
            </Button>
          </Can>
        }
      />
      <DataTable
        data={returns}
        getRowId={(r: SalesReturn) => r.id}
        emptyModule="salesReturns"
        emptyOnPrimaryClick={openNew}
        columns={[
          {
            id: 'no',
            header: 'Return #',
            accessor: 'returnNo',
            cell: (r) => <CodeCell value={r.returnNo} />,
          },
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'inv', header: 'Invoice', accessor: 'invoiceNo' },
          { id: 'product', header: 'Product', accessor: 'productName' },
          { id: 'qty', header: 'Qty', accessor: 'returnQuantity' },
          { id: 'amt', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
        ]}
      />
      <Modal open={open} onClose={closeModal} title="Create sales return" mobileSheet>
        <div className="space-y-3 mobile-form">
          {offerRestore && pendingEnvelope ? (
            <DraftBanner
              variant="restore"
              showRestore
              savedAtLabel={formatDraftSavedAt(pendingEnvelope.savedAt)}
              onRestore={restoreDraft}
              onDelete={onDeleteDraft}
            />
          ) : lastSavedLabel ? (
            <DraftBanner variant="status" savedAtLabel={lastSavedLabel} onDelete={onDeleteDraft} />
          ) : null}
          <FormSection title="Return details" description="Pick the invoice line to reverse.">
            <div className="space-y-3">
              <FormField label="Sale" required hint="Search by invoice or customer">
                <SearchableSelect
                  value={form.saleId}
                  onChange={(saleId) => setForm((f) => ({ ...f, saleId, productId: '' }))}
                  recentScope="sales-invoices"
                  placeholder="Select sale…"
                  options={saleOptions}
                />
              </FormField>
              <FormField label="Product" required hint="Line items from the selected sale">
                <SearchableSelect
                  value={form.productId || products[0]?.productId || ''}
                  onChange={(productId) => setForm((f) => ({ ...f, productId }))}
                  recentScope="products"
                  placeholder="Select product…"
                  options={productOptions}
                  emptyMessage="No line items on this sale"
                />
              </FormField>
              <FormField label="Quantity" required>
                <Input
                  type="number"
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: Number(e.target.value) || 1 }))}
                />
              </FormField>
              <FormField label="Reason" hint="Optional note for the return">
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </FormField>
            </div>
          </FormSection>
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11 flex-1 touch-manipulation sm:flex-none"
              onClick={() => submit(false)}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Create'}
            </Button>
            <Button
              variant="outline"
              className="min-h-11 flex-1 touch-manipulation sm:flex-none"
              onClick={() => submit(true)}
              disabled={saving}
            >
              Request approval
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
