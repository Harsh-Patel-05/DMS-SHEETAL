import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  RowActions,
} from '@/components/shared/RowActions'
import { Can } from '@/components/auth/Can'
import { DraftBanner } from '@/components/shared/DraftBanner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { FormSection } from '@/components/ui/form-section'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { usePermission } from '@/hooks/use-permission'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { useDmsStore } from '@/store/dms-store'
import { todayISO } from '@/utils/cn'
import { DRAFT_KEYS, formatDraftSavedAt } from '@/utils/draft-autosave'
import { formatCurrency, formatDate } from '@/utils/format'

type ExpenseDraft = Partial<Expense>

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'rent',
  'salary',
  'transport',
  'electricity',
  'maintenance',
  'marketing',
  'office',
  'other',
]

const blankExpense = (): ExpenseDraft => ({
  date: todayISO(),
  category: 'office',
  paymentMethod: 'cash',
  amount: 0,
  description: '',
})

export default function ExpensesPage() {
  const expenses = useDmsStore((s) => s.expenses)
  const saveExpense = useDmsStore((s) => s.saveExpense)
  const deleteExpense = useDmsStore((s) => s.deleteExpense)
  const { toast } = useToast()
  const { canDelete } = usePermission('expenses')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<ExpenseDraft>(blankExpense)
  const [offerRestore, setOfferRestore] = useState(false)
  const [saving, setSaving] = useState(false)

  const draftPayload = useMemo(() => form, [form])
  const { lastSavedLabel, pendingEnvelope, deleteDraft, acknowledgePending, saveNow } =
    useDraftAutosave<ExpenseDraft>({
      key: DRAFT_KEYS.expense,
      data: draftPayload,
      enabled: open && !offerRestore && !form.id,
      intervalMs: 3000,
    })

  const isDirty =
    open &&
    !offerRestore &&
    (Boolean(form.description) || Number(form.amount) > 0 || form.category !== 'office')
  const { dialog: unsavedDialog, confirmIfDirty } = useUnsavedChanges(isDirty)

  useEffect(() => {
    if (!open || form.id) return
    if (pendingEnvelope) setOfferRestore(true)
  }, [open, pendingEnvelope, form.id])

  const categoryOptions = useMemo(
    () =>
      EXPENSE_CATEGORIES.map((c) => ({
        value: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
        group: 'Categories',
      })),
    [],
  )

  const openNew = () => {
    setForm(blankExpense())
    setOfferRestore(Boolean(pendingEnvelope))
    setOpen(true)
  }

  const restoreDraft = () => {
    const env = acknowledgePending()
    if (!env) return
    setForm({ ...blankExpense(), ...env.data })
    setOfferRestore(false)
    toast({ title: 'Draft restored', variant: 'success' })
  }

  const onDeleteDraft = () => {
    deleteDraft()
    setOfferRestore(false)
    setForm(blankExpense())
  }

  const closeModal = () => {
    confirmIfDirty(() => {
      if (!offerRestore && !form.id) saveNow()
      setOpen(false)
    })
  }

  const save = () => {
    if (!form.description?.trim()) {
      toast({ title: 'Description required', variant: 'error' })
      return
    }
    setSaving(true)
    saveExpense({
      id: form.id,
      date: form.date ?? todayISO(),
      category: (form.category ?? 'other') as ExpenseCategory,
      description: form.description,
      amount: Number(form.amount) || 0,
      paymentMethod: (form.paymentMethod ?? 'cash') as PaymentMethod,
      reference: form.reference,
      notes: form.notes,
    })
    setSaving(false)
    toast({ title: 'Expense saved', variant: 'success' })
    if (!form.id) deleteDraft()
    setOpen(false)
    setForm(blankExpense())
  }

  return (
    <div>
      {unsavedDialog}
      <PageHeader
        title="Expenses"
        description="Day-to-day operating expenses"
        actions={
          <Can module="expenses" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={openNew}>
              <Plus className="h-4 w-4" /> Add expense
            </Button>
          </Can>
        }
      />
      <DataTable
        data={expenses}
        getRowId={(r) => r.id}
        emptyModule="expenses"
        emptyOnPrimaryClick={openNew}
        columns={[
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'cat', header: 'Category', accessor: 'category' },
          { id: 'desc', header: 'Description', accessor: 'description' },
          { id: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) => (
              <RowActions
                onDelete={canDelete() ? () => setDeleteId(r.id) : undefined}
              />
            ),
          },
        ]}
      />
      <Modal open={open} onClose={closeModal} title="Expense" mobileSheet>
        <div className="space-y-3 mobile-form">
          {offerRestore && pendingEnvelope && !form.id ? (
            <DraftBanner
              variant="restore"
              showRestore
              savedAtLabel={formatDraftSavedAt(pendingEnvelope.savedAt)}
              onRestore={restoreDraft}
              onDelete={onDeleteDraft}
            />
          ) : lastSavedLabel && !form.id ? (
            <DraftBanner variant="status" savedAtLabel={lastSavedLabel} onDelete={onDeleteDraft} />
          ) : null}
          <FormSection title="Expense details" description="Record an operating cost.">
            <div className="space-y-3">
              <FormField label="Date" required>
                <Input
                  type="date"
                  value={form.date ?? todayISO()}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </FormField>
              <FormField label="Category" required hint="Search expense type">
                <SearchableSelect
                  value={form.category ?? 'office'}
                  onChange={(category) => setForm({ ...form, category: category as ExpenseCategory })}
                  recentScope="expense-categories"
                  placeholder="Select category…"
                  options={categoryOptions}
                />
              </FormField>
              <FormField
                label="Description"
                required
                error={!form.description?.trim() ? 'Required' : undefined}
              >
                <Input
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
              <FormField label="Amount" required>
                <Input
                  type="number"
                  value={form.amount ?? 0}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Payment method">
                <Select
                  value={form.paymentMethod ?? 'cash'}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
            </div>
          </FormSection>
          <Button className="min-h-11 w-full touch-manipulation sm:w-auto" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete expense?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteExpense(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
