import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

interface PurchaseReturnDraft {
  purchaseId: string
  productId: string
  qty: number
  reason: string
}

export default function PurchaseReturnsPage() {
  const returns = useDmsStore((s) => s.purchaseReturns)
  const purchases = useDmsStore((s) => s.purchases)
  const createPurchaseReturn = useDmsStore((s) => s.createPurchaseReturn)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PurchaseReturnDraft>({
    purchaseId: purchases[0]?.id ?? '',
    productId: '',
    qty: 1,
    reason: '',
  })
  const [offerRestore, setOfferRestore] = useState(false)
  const [saving, setSaving] = useState(false)

  const draftPayload = useMemo(() => form, [form])
  const { lastSavedLabel, pendingEnvelope, deleteDraft, acknowledgePending, saveNow } =
    useDraftAutosave<PurchaseReturnDraft>({
      key: DRAFT_KEYS.purchaseReturn,
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

  const purchase = purchases.find((p) => p.id === form.purchaseId)
  const products = purchase?.items ?? []

  const purchaseOptions = useMemo(
    () =>
      purchases.map((p) => ({
        value: p.id,
        label: p.purchaseNo,
        description: `${p.supplierName} · ${formatDate(p.date)}`,
        group: p.supplierName || 'Purchases',
      })),
    [purchases],
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
      purchaseId: purchases[0]?.id ?? '',
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
      purchaseId: env.data.purchaseId || purchases[0]?.id || '',
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
    setForm({ purchaseId: purchases[0]?.id ?? '', productId: '', qty: 1, reason: '' })
  }

  const closeModal = () => {
    confirmIfDirty(() => {
      if (!offerRestore) saveNow()
      setOpen(false)
    })
  }

  const submit = () => {
    const pid = form.productId || products[0]?.productId || ''
    if (!pid) {
      toast({ title: 'Select a product', variant: 'error' })
      return
    }
    setSaving(true)
    const result = createPurchaseReturn({
      purchaseId: form.purchaseId,
      productId: pid,
      returnQuantity: form.qty,
      reason: form.reason,
    })
    setSaving(false)
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Purchase return created', variant: 'success' })
    deleteDraft()
    setOpen(false)
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Purchase returns"
        description="Returns against purchase bills"
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
        getRowId={(r) => r.id}
        emptyModule="purchaseReturns"
        emptyOnPrimaryClick={openNew}
        columns={[
          {
            id: 'no',
            header: 'Return #',
            accessor: 'returnNo',
            cell: (r) => <CodeCell value={r.returnNo} />,
          },
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'po', header: 'PO', accessor: 'purchaseNo' },
          { id: 'product', header: 'Product', accessor: 'productName' },
          { id: 'amt', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
        ]}
      />
      <Modal open={open} onClose={closeModal} title="Create purchase return" mobileSheet>
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
          <FormSection title="Return details" description="Pick the purchase line to reverse.">
            <div className="space-y-3">
              <FormField label="Purchase" required hint="Search by bill or supplier">
                <SearchableSelect
                  value={form.purchaseId}
                  onChange={(purchaseId) => setForm((f) => ({ ...f, purchaseId, productId: '' }))}
                  recentScope="purchase-bills"
                  placeholder="Select purchase…"
                  options={purchaseOptions}
                />
              </FormField>
              <FormField label="Product" required hint="Line items from the selected purchase">
                <SearchableSelect
                  value={form.productId || products[0]?.productId || ''}
                  onChange={(productId) => setForm((f) => ({ ...f, productId }))}
                  recentScope="products"
                  placeholder="Select product…"
                  options={productOptions}
                  emptyMessage="No line items on this purchase"
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
          <Button
            className="min-h-11 w-full touch-manipulation sm:w-auto"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
