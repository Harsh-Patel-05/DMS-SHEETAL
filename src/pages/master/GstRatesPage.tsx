import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { GstRate } from '@/types'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { usePermission } from '@/hooks/use-permission'
import { useDmsStore } from '@/store/dms-store'
import { formatPercent } from '@/utils/format'

export default function GstRatesPage() {
  const gstRates = useDmsStore((s) => s.gstRates)
  const upsert = useDmsStore((s) => s.upsertGstRate)
  const remove = useDmsStore((s) => s.deleteGstRate)
  const { toast } = useToast()
  const { canEdit, canDelete } = usePermission('products')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<GstRate>>({ status: 'active', rate: 18 })

  const save = () => {
    if (!form.name?.trim()) {
      toast({ title: 'Name required', variant: 'error' })
      return
    }
    upsert({ ...(form.id ? { id: form.id } : {}), name: form.name.trim(), rate: Number(form.rate) || 0, status: form.status ?? 'active' })
    toast({ title: 'GST rate saved', variant: 'success' })
    setOpen(false)
    setForm({ status: 'active', rate: 18 })
  }

  return (
    <div>
      <PageHeader
        title="GST Rates"
        description="GST rate slabs for invoicing"
        actions={
          <Can module="products" action="create">
            <Button
              type="button"
              size="sm"
              className="gap-1"
              onClick={() => {
                setForm({ status: 'active', rate: 18 })
                setOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add rate
            </Button>
          </Can>
        }
      />
      <DataTable
        data={gstRates}
        getRowId={(r) => r.id}
        emptyModule="gstRates"
        emptyOnPrimaryClick={() => { setForm({ status: 'active', rate: 18 }); setOpen(true) }}
        columns={[
          { id: 'name', header: 'Name', accessor: 'name', sortable: true },
          { id: 'rate', header: 'Rate', cell: (r) => formatPercent(r.rate) },
          { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="party" status={r.status} /> },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) => (
              <RowActions
                onEdit={canEdit() ? () => { setForm(r); setOpen(true) } : undefined}
                onDelete={canDelete() ? () => setDeleteId(r.id) : undefined}
              />
            ),
          },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit GST rate' : 'New GST rate'} mobileSheet>
        <div className="mobile-form space-y-3">
          <FormField label="Name"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Rate (%)"><Input type="number" value={form.rate ?? 0} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} /></FormField>
          <FormField label="Status">
            <Select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as GstRate['status'] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={save}>Save GST rate</Button></div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete GST rate?" confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null) }} />
    </div>
  )
}
