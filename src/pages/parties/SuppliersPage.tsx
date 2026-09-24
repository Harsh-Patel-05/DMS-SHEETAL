import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Supplier } from '@/types'
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
import { useUnsavedChanges, formSnapshot } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { formatCurrency } from '@/utils/format'
import { errorMessage, validateGstin, validateMobile, validatePartyFields } from '@/utils/validation'

const empty = (): Partial<Supplier> => ({
  status: 'active',
  creditLimit: 0,
  openingBalance: 0,
  paymentTerms: 'Net 30',
  address: '',
  city: 'Indore',
  state: 'Madhya Pradesh',
})

export default function SuppliersPage() {
  const rows = useDmsStore((s) => s.suppliers)
  const upsert = useDmsStore((s) => s.upsertSupplier)
  const remove = useDmsStore((s) => s.deleteSupplier)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Supplier>>(empty())
  const [formBaseline, setFormBaseline] = useState(() => formSnapshot(empty()))

  const isDirty = open && formSnapshot(form) !== formBaseline
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)
  const requestCloseForm = () =>
    confirmIfDirty(() => {
      setOpen(false)
      setForm(empty())
    })

  const openForm = (next: Partial<Supplier>) => {
    setForm(next)
    setFormBaseline(formSnapshot(next))
    setOpen(true)
  }

  const save = () => {
    const check = validatePartyFields({
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      gstNumber: form.gstNumber,
      creditLimit: Number(form.creditLimit) || 0,
      openingBalance: Number(form.openingBalance) || 0,
    })
    if (!check.ok) {
      toast({ title: 'Check form', description: check.message, variant: 'error' })
      return
    }
    upsert({
      ...(form.id ? { id: form.id } : {}),
      name: form.name!.trim(),
      companyName: form.companyName,
      contactPerson: form.contactPerson,
      mobile: form.mobile!.trim(),
      email: form.email,
      address: form.address ?? '',
      city: form.city ?? '',
      state: form.state ?? '',
      gstNumber: form.gstNumber,
      pan: form.pan,
      creditLimit: Number(form.creditLimit) || 0,
      openingBalance: Number(form.openingBalance) || 0,
      currentBalance: form.currentBalance,
      paymentTerms: form.paymentTerms ?? 'Net 30',
      status: form.status ?? 'active',
    })
    toast({ title: 'Supplier saved', variant: 'success' })
    setOpen(false)
    setForm(empty())
    setFormBaseline(formSnapshot(empty()))
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Suppliers"
        description="Manage suppliers and outstanding payables"
        actions={
          <Can module="suppliers" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={() => openForm(empty())}>
              <Plus className="h-4 w-4" /> Add supplier
            </Button>
          </Can>
        }
      />
      <DataTable
        data={rows}
        getRowId={(r) => r.id}
        emptyModule="suppliers"
        emptyOnPrimaryClick={() => openForm(empty())}
        columns={[
          { id: 'name', header: 'Name', accessor: 'name', sortable: true },
          { id: 'mobile', header: 'Mobile', accessor: 'mobile' },
          { id: 'balance', header: 'Payable', cell: (r) => formatCurrency(r.currentBalance) },
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
                onView={() => navigate(`/parties/suppliers/${r.id}`)}
                onEdit={() => openForm(r)}
                onDelete={() => setDeleteId(r.id)}
              />
            ),
          },
        ]}
      />
      <Modal open={open} onClose={requestCloseForm} title={form.id ? 'Edit supplier' : 'New supplier'} size="lg" mobileSheet>
        <div className="mobile-form grid gap-3 sm:grid-cols-2">
          <FormField label="Name" required>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField
            label="Mobile"
            required
            hint="10-digit Indian mobile"
            error={form.mobile ? errorMessage(validateMobile(form.mobile)) : undefined}
          >
            <Input value={form.mobile ?? ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          </FormField>
          <FormField label="Company">
            <Input
              value={form.companyName ?? ''}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </FormField>
          <FormField
            label="GSTIN"
            hint="15-character GSTIN if registered"
            error={form.gstNumber?.trim() ? errorMessage(validateGstin(form.gstNumber)) : undefined}
          >
            <Input
              value={form.gstNumber ?? ''}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
            />
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status ?? 'active'}
              onChange={(e) => setForm({ ...form, status: e.target.value as Supplier['status'] })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={requestCloseForm}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save supplier
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete supplier?"
        description="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) remove(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
