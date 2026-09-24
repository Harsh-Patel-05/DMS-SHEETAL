import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Can } from '@/components/auth/Can'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useToast } from '@/components/ui/toast'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { todayISO } from '@/utils/cn'
import { formatDate, formatNumber } from '@/utils/format'

export default function TransferPage() {
  const transfers = useDmsStore((s) => s.transfers)
  const products = useDmsStore((s) => s.products)
  const locations = useDmsStore((s) => s.locations)
  const saveTransfer = useDmsStore((s) => s.saveTransfer)
  const updateTransferStatus = useDmsStore((s) => s.updateTransferStatus)
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [fromLocation, setFromLocation] = useState(locations[0]?.name ?? '')
  const [toLocation, setToLocation] = useState(locations[1]?.name ?? locations[0]?.name ?? '')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        description: `${p.sku} · Stock ${formatNumber(p.currentStock)}`,
        keywords: p.sku,
        group: p.status === 'active' ? 'Active' : 'Inactive',
      })),
    [products],
  )

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        value: l.name,
        label: l.name,
        description: l.type,
        group: l.type,
      })),
    [locations],
  )

  const isDirty = open && (quantity !== 1 || Boolean(reason) || fromLocation !== (locations[0]?.name ?? ''))
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)

  const reset = () => {
    setProductId(products[0]?.id ?? '')
    setFromLocation(locations[0]?.name ?? '')
    setToLocation(locations[1]?.name ?? locations[0]?.name ?? '')
    setQuantity(1)
    setReason('')
  }

  const submit = () => {
    if (!productId) {
      toast({ title: 'Select a product', variant: 'error' })
      return
    }
    if (quantity <= 0) {
      toast({ title: 'Enter a quantity', variant: 'error' })
      return
    }
    setSaving(true)
    saveTransfer({
      date: todayISO(),
      fromLocation,
      toLocation,
      productId,
      quantity,
      reason,
      status: 'requested',
    })
    setSaving(false)
    toast({ title: 'Transfer requested', variant: 'success' })
    setOpen(false)
    reset()
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Stock Transfer"
        description="Move stock between warehouses or locations"
        actions={
          <Can module="stock" action="create">
            <Button
              type="button"
              size="sm"
              className="gap-1"
              onClick={() => {
                reset()
                setOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> New transfer
            </Button>
          </Can>
        }
      />
      <DataTable
        data={transfers}
        getRowId={(r) => r.id}
        emptyModule="transfers"
        emptyOnPrimaryClick={() => {
          reset()
          setOpen(true)
        }}
        columns={[
          {
            id: 'no',
            header: 'Transfer #',
            accessor: 'transferNo',
            cell: (r) => <CodeCell value={r.transferNo} />,
          },
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'product', header: 'Product', accessor: 'productName' },
          { id: 'from', header: 'From', accessor: 'fromLocation' },
          { id: 'to', header: 'To', accessor: 'toLocation' },
          { id: 'qty', header: 'Qty', cell: (r) => formatNumber(r.quantity) },
          { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="transfer" status={r.status} /> },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) =>
              r.status === 'requested' ? (
                <RowActions
                  more={[
                    {
                      id: 'complete',
                      label: 'Complete',
                      onClick: () => {
                        updateTransferStatus(r.id, 'completed')
                        toast({ title: 'Marked completed', variant: 'success' })
                      },
                    },
                  ]}
                />
              ) : null,
          },
        ]}
      />
      <Modal open={open} onClose={() => confirmIfDirty(() => setOpen(false))} title="Request transfer">
        <FormSection title="Transfer details" description="Move stock between locations.">
          <div className="space-y-3">
            <FormField label="Product" required hint="Search by name or SKU">
              <SearchableSelect
                value={productId}
                onChange={setProductId}
                recentScope="products"
                placeholder="Select product…"
                options={productOptions}
              />
            </FormField>
            <FormField label="From" required>
              <SearchableSelect
                value={fromLocation}
                onChange={setFromLocation}
                recentScope="locations-from"
                placeholder="From location…"
                options={locationOptions}
                creatable
                createLabel={(q) => `Use “${q}”`}
                onCreate={(q) => setFromLocation(q)}
              />
            </FormField>
            <FormField label="To" required>
              <SearchableSelect
                value={toLocation}
                onChange={setToLocation}
                recentScope="locations-to"
                placeholder="To location…"
                options={locationOptions}
                creatable
                createLabel={(q) => `Use “${q}”`}
                onCreate={(q) => setToLocation(q)}
              />
            </FormField>
            <FormField label="Quantity" required error={quantity <= 0 ? 'Must be greater than zero' : undefined}>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Reason" hint="Optional note for the warehouse">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </FormSection>
      </Modal>
    </div>
  )
}
