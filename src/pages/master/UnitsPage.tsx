import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { Unit } from '@/types'
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

export default function UnitsPage() {
  const units = useDmsStore((s) => s.units)
  const upsert = useDmsStore((s) => s.upsertUnit)
  const remove = useDmsStore((s) => s.deleteUnit)
  const { toast } = useToast()
  const { canEdit, canDelete } = usePermission('products')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Unit>>({ status: 'active' })

  const save = () => {
    if (!form.name?.trim() || !form.shortName?.trim()) {
      toast({ title: 'Name and short name required', variant: 'error' })
      return
    }
    upsert({ ...(form.id ? { id: form.id } : {}), name: form.name.trim(), shortName: form.shortName.trim(), status: form.status ?? 'active' })
    toast({ title: 'Unit saved', variant: 'success' })
    setOpen(false)
    setForm({ status: 'active' })
  }

  return (
    <div>
      <PageHeader
        title="Units"
        description="Units of measure used on products"
        actions={
          <Can module="products" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={() => { setForm({ status: 'active' }); setOpen(true) }}>
              <Plus className="h-4 w-4" /> Add unit
            </Button>
          </Can>
        }
      />
      <DataTable
        data={units}
        getRowId={(r) => r.id}
        emptyModule="units"
        emptyOnPrimaryClick={() => { setForm({ status: 'active' }); setOpen(true) }}
        columns={[
          { id: 'name', header: 'Name', accessor: 'name', sortable: true },
          { id: 'short', header: 'Short', accessor: 'shortName' },
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
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit unit' : 'New unit'} mobileSheet>
        <div className="mobile-form space-y-3">
          <FormField label="Name"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Short name"><Input value={form.shortName ?? ''} onChange={(e) => setForm({ ...form, shortName: e.target.value })} /></FormField>
          <FormField label="Status">
            <Select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as Unit['status'] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={save}>Save unit</Button></div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete unit?" confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null) }} />
    </div>
  )
}
