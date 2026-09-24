import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { Brand } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { usePermission } from '@/hooks/use-permission'
import { useDmsStore } from '@/store/dms-store'
import { formatDate } from '@/utils/format'

export default function BrandsPage() {
  const brands = useDmsStore((s) => s.brands)
  const upsert = useDmsStore((s) => s.upsertBrand)
  const remove = useDmsStore((s) => s.deleteBrand)
  const { toast } = useToast()
  const { canEdit, canDelete } = usePermission('products')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Brand>>({ status: 'active' })

  const save = () => {
    if (!form.name?.trim()) {
      toast({ title: 'Name required', variant: 'error' })
      return
    }
    upsert({ ...(form.id ? { id: form.id } : {}), name: form.name.trim(), description: form.description, status: form.status ?? 'active' })
    toast({ title: 'Brand saved', variant: 'success' })
    setOpen(false)
    setForm({ status: 'active' })
  }

  return (
    <div>
      <PageHeader
        title="Brands"
        description="Product brands and manufacturer labels"
        actions={
          <Can module="products" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={() => { setForm({ status: 'active' }); setOpen(true) }}>
              <Plus className="h-4 w-4" /> Add brand
            </Button>
          </Can>
        }
      />
      <DataTable
        data={brands}
        getRowId={(r) => r.id}
        emptyModule="brands"
        emptyOnPrimaryClick={() => { setForm({ status: 'active' }); setOpen(true) }}
        columns={[
          { id: 'name', header: 'Name', accessor: 'name', sortable: true },
          { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="party" status={r.status} /> },
          { id: 'updated', header: 'Updated', cell: (r) => formatDate(r.updatedAt) },
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
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit brand' : 'New brand'} mobileSheet>
        <div className="mobile-form space-y-3">
          <FormField label="Name"><Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
          <FormField label="Description"><Textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField>
          <FormField label="Status">
            <Select value={form.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value as Brand['status'] })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={save}>Save brand</Button></div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete brand?" confirmLabel="Delete" variant="danger" onConfirm={() => { if (deleteId) remove(deleteId); setDeleteId(null) }} />
    </div>
  )
}
