import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Customer, Status } from '@/types'
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
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { downloadCsv } from '@/utils/bulk-export'
import {
  buildCustomerSalesTotals,
  resolveCustomerFilterValue,
} from '@/utils/advanced-filter-resolvers'
import { formatCurrency } from '@/utils/format'
import {
  errorMessage,
  validateEmail,
  validateGstin,
  validateMobile,
  validatePartyFields,
  validatePrice,
} from '@/utils/validation'

const emptyCustomer = (): Partial<Customer> => ({
  status: 'active',
  creditLimit: 0,
  openingBalance: 0,
  paymentTerms: 'Net 15',
  address: '',
  city: 'Indore',
  state: 'Madhya Pradesh',
})

export default function CustomersPage() {
  const customers = useDmsStore((s) => s.customers)
  const sales = useDmsStore((s) => s.sales)
  const upsert = useDmsStore((s) => s.upsertCustomer)
  const remove = useDmsStore((s) => s.deleteCustomer)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(emptyCustomer())
  const [formBaseline, setFormBaseline] = useState(() => formSnapshot(emptyCustomer()))
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<Status>('active')
  const [pendingRows, setPendingRows] = useState<Customer[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const isDirty = open && formSnapshot(form) !== formBaseline
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)
  const requestCloseForm = () =>
    confirmIfDirty(() => {
      setOpen(false)
      setForm(emptyCustomer())
    })

  const openForm = (next: Partial<Customer>) => {
    setForm(next)
    setFormBaseline(formSnapshot(next))
    setOpen(true)
  }

  const customerSalesTotals = useMemo(() => buildCustomerSalesTotals(sales), [sales])

  const getAdvancedFilterValue = useCallback(
    (row: Customer, fieldId: string) =>
      resolveCustomerFilterValue(row, fieldId, customerSalesTotals),
    [customerSalesTotals],
  )

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
      mobile: form.mobile!.trim(),
      email: form.email,
      address: form.address ?? '',
      city: form.city ?? '',
      state: form.state ?? '',
      gstNumber: form.gstNumber,
      creditLimit: Number(form.creditLimit) || 0,
      openingBalance: Number(form.openingBalance) || 0,
      currentBalance: form.currentBalance,
      paymentTerms: form.paymentTerms ?? 'Net 15',
      status: form.status ?? 'active',
    })
    toast({ title: 'Customer saved', variant: 'success' })
    setOpen(false)
    setForm(emptyCustomer())
    setFormBaseline(formSnapshot(emptyCustomer()))
  }

  const exportCustomers = (rows: Customer[]) => {
    downloadCsv(
      `customers-export-${rows.length}.csv`,
      ['Name', 'Mobile', 'Email', 'City', 'State', 'GST', 'Balance', 'Credit limit', 'Status'],
      rows.map((r) => [
        r.name,
        r.mobile,
        r.email ?? '',
        r.city,
        r.state,
        r.gstNumber ?? '',
        String(r.currentBalance),
        String(r.creditLimit),
        r.status,
      ]),
    )
    toast({ title: `Exported ${rows.length} customer(s)`, variant: 'success' })
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Customers"
        description="Manage customers, credit limits, and balances"
        actions={
          <Can module="customers" action="create">
            <Button
              type="button"
              size="sm"
              className="gap-1"
              onClick={() => openForm(emptyCustomer())}
            >
              <Plus className="h-4 w-4" /> Add customer
            </Button>
          </Can>
        }
      />
      <DataTable
        data={customers}
        getRowId={(r) => r.id}
        emptyModule="customers"
        emptyOnPrimaryClick={() => openForm(emptyCustomer())}
        storageKey="customers"
        filterContextId={FILTER_CONTEXT.customers}
        getAdvancedFilterValue={getAdvancedFilterValue}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            id: 'export',
            label: 'Bulk export',
            variant: 'outline',
            onClick: (rows) => exportCustomers(rows),
          },
          {
            id: 'status',
            label: 'Bulk status',
            variant: 'outline',
            onClick: (rows) => {
              setPendingRows(rows)
              setBulkStatus('active')
              setStatusModalOpen(true)
            },
          },
          {
            id: 'delete',
            label: 'Delete selected',
            variant: 'danger',
            onClick: (rows) => {
              setPendingRows(rows)
              setBulkDeleteOpen(true)
            },
          },
        ]}
        columns={[
          { id: 'name', header: 'Name', accessor: 'name', sortable: true, sticky: 'left' },
          { id: 'mobile', header: 'Mobile', accessor: 'mobile' },
          { id: 'city', header: 'City', accessor: 'city', sortable: true },
          { id: 'balance', header: 'Balance', cell: (r) => formatCurrency(r.currentBalance) },
          {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            sortable: true,
            filterOptions: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
            getFilterValue: (r) => r.status,
            cell: (r) => <StatusBadge kind="party" status={r.status} />,
          },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) => (
              <RowActions
                onView={() => navigate(`/parties/customers/${r.id}`)}
                onEdit={() => openForm(r)}
                onDelete={() => setDeleteId(r.id)}
              />
            ),
          },
        ]}
      />

      <Modal open={open} onClose={requestCloseForm} title={form.id ? 'Edit customer' : 'New customer'} size="lg" mobileSheet>
        <div className="mobile-form grid gap-3 sm:grid-cols-2">
          <FormField
            label="Name"
            required
            error={!form.name?.trim() ? 'Name is required' : undefined}
          >
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
          <FormField
            label="Email"
            hint="Optional"
            error={form.email?.trim() ? errorMessage(validateEmail(form.email)) : undefined}
          >
            <Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField
            label="GSTIN"
            hint="15-character GSTIN if registered"
            error={form.gstNumber?.trim() ? errorMessage(validateGstin(form.gstNumber)) : undefined}
          >
            <Input value={form.gstNumber ?? ''} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="City">
            <Input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </FormField>
          <FormField label="State">
            <Input value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </FormField>
          <FormField
            label="Credit limit"
            hint="₹ 0 = no credit"
            error={errorMessage(validatePrice(form.creditLimit ?? 0, 'Credit limit'))}
          >
            <Input
              type="number"
              value={form.creditLimit ?? 0}
              onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
            />
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status ?? 'active'}
              onChange={(e) => setForm({ ...form, status: e.target.value as Customer['status'] })}
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
              Save customer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Bulk status change"
        description={`Update status for ${pendingRows.length} customer(s).`}
        size="sm"
      >
        <FormField label="New status">
          <Select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as Status)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormField>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              for (const c of pendingRows) {
                upsert({ ...c, id: c.id, status: bulkStatus })
              }
              setStatusModalOpen(false)
              setSelectedIds([])
              toast({ title: `Status updated for ${pendingRows.length} customer(s)`, variant: 'success' })
            }}
          >
            Apply
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete customer?"
        description="This cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) remove(deleteId)
          setDeleteId(null)
          toast({ title: 'Deleted', variant: 'success' })
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Delete selected customers?"
        description={`You are about to permanently delete ${pendingRows.length} customer(s). This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete all"
        onConfirm={() => {
          pendingRows.forEach((r) => remove(r.id))
          setBulkDeleteOpen(false)
          setSelectedIds([])
          toast({ title: `${pendingRows.length} customer(s) deleted`, variant: 'success' })
        }}
      />
    </div>
  )
}
