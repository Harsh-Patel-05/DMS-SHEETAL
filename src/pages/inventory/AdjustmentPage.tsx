import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { AdjustmentType } from '@/types'
import { Can } from '@/components/auth/Can'
import { DraftBanner } from '@/components/shared/DraftBanner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { DRAFT_KEYS, formatDraftSavedAt } from '@/utils/draft-autosave'
import { formatDate, formatNumber } from '@/utils/format'

interface AdjustmentDraft {
  productId: string
  adjustmentType: AdjustmentType
  quantity: number
  reason: string
}

const emptyDraft = (productId = ''): AdjustmentDraft => ({
  productId,
  adjustmentType: 'increase',
  quantity: 1,
  reason: '',
})

export default function AdjustmentPage() {
  const adjustments = useDmsStore((s) => s.adjustments)
  const products = useDmsStore((s) => s.products)
  const adjustStock = useDmsStore((s) => s.adjustStock)
  const createApproval = useDmsStore((s) => s.createApproval)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AdjustmentDraft>(() => emptyDraft(products[0]?.id ?? ''))
  const [offerRestore, setOfferRestore] = useState(false)
  const [saving, setSaving] = useState(false)

  const draftPayload = useMemo(() => form, [form])
  const { lastSavedLabel, pendingEnvelope, deleteDraft, acknowledgePending, saveNow } =
    useDraftAutosave<AdjustmentDraft>({
      key: DRAFT_KEYS.adjustment,
      data: draftPayload,
      enabled: open && !offerRestore,
      intervalMs: 3000,
    })

  const isDirty =
    open &&
    !offerRestore &&
    (form.quantity !== 1 || Boolean(form.reason) || form.adjustmentType !== 'increase')
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)

  useEffect(() => {
    if (!open) return
    if (pendingEnvelope) {
      setOfferRestore(true)
    }
  }, [open, pendingEnvelope])

  const product = products.find((p) => p.id === form.productId)

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        description: `${p.sku} · Stock ${formatNumber(p.currentStock)}`,
        group: p.status === 'active' ? 'Active' : 'Inactive',
        keywords: p.sku,
      })),
    [products],
  )

  const resetForm = () => setForm(emptyDraft(products[0]?.id ?? ''))

  const openNew = () => {
    const env = pendingEnvelope
    if (env) {
      setOfferRestore(true)
      setOpen(true)
      return
    }
    resetForm()
    setOfferRestore(false)
    setOpen(true)
  }

  const restoreDraft = () => {
    const env = acknowledgePending()
    if (!env) return
    setForm({
      productId: env.data.productId || products[0]?.id || '',
      adjustmentType: env.data.adjustmentType ?? 'increase',
      quantity: env.data.quantity ?? 1,
      reason: env.data.reason ?? '',
    })
    setOfferRestore(false)
    toast({ title: 'Draft restored', variant: 'success' })
  }

  const onDeleteDraft = () => {
    deleteDraft()
    setOfferRestore(false)
    resetForm()
  }

  const closeModal = () => {
    confirmIfDirty(() => {
      if (!offerRestore) saveNow()
      setOpen(false)
    })
  }

  const submit = (asApproval: boolean) => {
    if (!product) {
      toast({ title: 'Select a product', variant: 'error' })
      return
    }
    if (form.quantity <= 0) {
      toast({ title: 'Enter a quantity', variant: 'error' })
      return
    }
    setSaving(true)
    if (asApproval) {
      const result = createApproval({
        kind: 'stock_adjustment',
        title: `Stock adjustment — ${product.name}`,
        description: `${form.adjustmentType} ${form.quantity} units. ${form.reason || 'No reason provided.'}`,
        referenceType: 'adjustment',
        referenceLabel: product.sku,
        href: '/inventory/adjustment',
        payload: {
          productId: product.id,
          productName: product.name,
          adjustmentType: form.adjustmentType,
          quantity: form.quantity,
          reason: form.reason || 'Stock adjustment',
        },
        submit: true,
      })
      setSaving(false)
      if (!result.ok) {
        toast({ title: 'Failed', description: result.message, variant: 'error' })
        return
      }
      toast({ title: 'Sent for approval', description: result.approval?.requestNo, variant: 'success' })
      deleteDraft()
      setOpen(false)
      resetForm()
      return
    }
    const result = adjustStock({
      productId: form.productId,
      adjustmentType: form.adjustmentType,
      quantity: form.quantity,
      reason: form.reason,
    })
    setSaving(false)
    if (!result.ok) {
      toast({ title: 'Failed', description: result.message, variant: 'error' })
      return
    }
    toast({ title: 'Stock adjusted', variant: 'success' })
    deleteDraft()
    setOpen(false)
    resetForm()
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Stock Adjustment"
        description="Correct on-hand stock with audit trail"
        actions={
          <Can module="stock" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={openNew}>
              <Plus className="h-4 w-4" /> New adjustment
            </Button>
          </Can>
        }
      />
      <DataTable
        data={adjustments}
        getRowId={(r) => r.id}
        emptyModule="adjustments"
        emptyOnPrimaryClick={openNew}
        columns={[
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'product', header: 'Product', accessor: 'productName' },
          { id: 'type', header: 'Type', accessor: 'adjustmentType' },
          { id: 'qty', header: 'Qty', cell: (r) => formatNumber(r.quantity) },
          { id: 'reason', header: 'Reason', accessor: 'reason' },
        ]}
      />
      <Modal open={open} onClose={closeModal} title="Adjust stock" mobileSheet>
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
          <FormSection title="Adjustment" description="Search a product, set quantity, and optionally send for approval.">
            <div className="space-y-3">
              <FormField label="Product" required hint="Search by name or SKU">
                <SearchableSelect
                  value={form.productId}
                  onChange={(productId) => setForm((f) => ({ ...f, productId }))}
                  recentScope="products"
                  placeholder="Select product…"
                  searchPlaceholder="Search products…"
                  options={productOptions}
                />
              </FormField>
              {product ? (
                <p className="text-xs text-ink-muted">
                  Current stock:{' '}
                  <span className="font-medium tabular-nums text-ink">{formatNumber(product.currentStock)}</span>
                </p>
              ) : null}
              <FormField label="Type" required>
                <Select
                  value={form.adjustmentType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, adjustmentType: e.target.value as AdjustmentType }))
                  }
                >
                  <option value="increase">Increase</option>
                  <option value="decrease">Decrease</option>
                </Select>
              </FormField>
              <FormField
                label="Quantity"
                required
                error={form.quantity <= 0 ? 'Must be greater than zero' : undefined}
              >
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))}
                />
              </FormField>
              <FormField label="Reason" hint="Why stock is changing">
                <Input
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </FormField>
            </div>
          </FormSection>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              className="min-h-11 flex-1 touch-manipulation sm:flex-none"
              onClick={() => submit(false)}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Apply now'}
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
