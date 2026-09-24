import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ClipboardCheck,
  Clock,
  FilePlus2,
  Send,
  X,
} from 'lucide-react'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { ApprovalTimeline } from '@/components/shared/ApprovalTimeline'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import type { ApprovalKind, ApprovalRequest, ApprovalStatus } from '@/types'
import { APPROVAL_KIND_LABELS, APPROVAL_STATUS_LABELS } from '@/types/approval'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

const KIND_OPTIONS: ApprovalKind[] = [
  'purchase',
  'stock_adjustment',
  'discount',
  'return',
  'credit_limit',
]

const STATUS_OPTIONS: ApprovalStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'completed',
]

export default function ApprovalsPage() {
  const approvals = useDmsStore((s) => s.approvals ?? [])
  const createApproval = useDmsStore((s) => s.createApproval)
  const submitApproval = useDmsStore((s) => s.submitApproval)
  const approveApproval = useDmsStore((s) => s.approveApproval)
  const rejectApproval = useDmsStore((s) => s.rejectApproval)
  const completeApproval = useDmsStore((s) => s.completeApproval)
  const addApprovalComment = useDmsStore((s) => s.addApprovalComment)
  const { toast } = useToast()

  const [kindFilter, setKindFilter] = useState<ApprovalKind | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('pending_approval')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [comment, setComment] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const [newKind, setNewKind] = useState<ApprovalKind>('purchase')
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState(0)
  const [newReference, setNewReference] = useState('')
  const [submitOnCreate, setSubmitOnCreate] = useState(true)

  const filtered = useMemo(() => {
    return approvals
      .filter((a) => (kindFilter === 'all' ? true : a.kind === kindFilter))
      .filter((a) => (statusFilter === 'all' ? true : a.status === statusFilter))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [approvals, kindFilter, statusFilter])

  const selected = approvals.find((a) => a.id === selectedId) ?? filtered[0] ?? null

  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === 'pending_approval').length
    const drafts = approvals.filter((a) => a.status === 'draft').length
    const approved = approvals.filter((a) => a.status === 'approved').length
    const rejected = approvals.filter((a) => a.status === 'rejected').length
    const completed = approvals.filter((a) => a.status === 'completed').length
    return { pending, drafts, approved, rejected, completed }
  }, [approvals])

  const runAction = (
    action: 'submit' | 'approve' | 'reject' | 'complete',
    row: ApprovalRequest,
  ) => {
    const note = decisionNote.trim() || undefined
    const result =
      action === 'submit'
        ? submitApproval(row.id, note)
        : action === 'approve'
          ? approveApproval(row.id, note)
          : action === 'reject'
            ? rejectApproval(row.id, note || 'Rejected')
            : completeApproval(row.id, note)
    if (!result.ok) {
      toast({ title: 'Action failed', description: result.message, variant: 'error' })
      return
    }
    toast({
      title:
        action === 'submit'
          ? 'Submitted for approval'
          : action === 'approve'
            ? 'Approved'
            : action === 'reject'
              ? 'Rejected'
              : 'Completed',
      variant: 'success',
    })
    setDecisionNote('')
  }

  const handleCreate = () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      toast({ title: 'Title and description required', variant: 'error' })
      return
    }
    const result = createApproval({
      kind: newKind,
      title: newTitle.trim(),
      description: newDescription.trim(),
      amount: newAmount > 0 ? newAmount : undefined,
      referenceLabel: newReference.trim() || undefined,
      href:
        newKind === 'purchase'
          ? '/transactions/purchases'
          : newKind === 'stock_adjustment'
            ? '/inventory/adjustment'
            : newKind === 'return'
              ? '/transactions/sales-returns'
              : newKind === 'credit_limit'
                ? '/parties/customers'
                : '/transactions/sales',
      submit: submitOnCreate,
    })
    if (!result.ok) {
      toast({ title: 'Could not create', description: result.message, variant: 'error' })
      return
    }
    toast({
      title: submitOnCreate ? 'Submitted for approval' : 'Draft created',
      variant: 'success',
    })
    setSelectedId(result.approval?.id ?? null)
    setCreateOpen(false)
    setNewTitle('')
    setNewDescription('')
    setNewAmount(0)
    setNewReference('')
    setStatusFilter(submitOnCreate ? 'pending_approval' : 'draft')
  }

  const handleComment = () => {
    if (!selected) return
    const result = addApprovalComment(selected.id, comment)
    if (!result.ok) {
      toast({ title: 'Could not add comment', description: result.message, variant: 'error' })
      return
    }
    setComment('')
    toast({ title: 'Comment added', variant: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Purchase, stock adjustment, discount, return, and credit limit workflows"
        actions={
          <Can module="approvals" action="create">
            <Button type="button" size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="h-4 w-4" />
              New request
            </Button>
          </Can>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Pending" value={String(stats.pending)} icon={Clock} />
        <StatCard label="Drafts" value={String(stats.drafts)} icon={ClipboardCheck} />
        <StatCard label="Approved" value={String(stats.approved)} icon={Check} />
        <StatCard label="Rejected" value={String(stats.rejected)} icon={X} />
        <StatCard label="Completed" value={String(stats.completed)} icon={Send} />
      </div>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <FormField label="Type" className="w-full min-w-0 sm:min-w-[180px] sm:w-auto">
          <Select
            value={kindFilter}
            className="h-[var(--size-control-sm)] min-h-0 py-0 text-xs"
            onChange={(e) => setKindFilter(e.target.value as ApprovalKind | 'all')}
          >
            <option value="all">All types</option>
            {KIND_OPTIONS.map((k) => (
              <option key={k} value={k}>
                {APPROVAL_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" className="w-full min-w-0 sm:min-w-[180px] sm:w-auto">
          <Select
            value={statusFilter}
            className="h-[var(--size-control-sm)] min-h-0 py-0 text-xs"
            onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {APPROVAL_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DataTable
          data={filtered}
          getRowId={(r) => r.id}
          emptyModule="approvals"
          columns={[
            {
              id: 'no',
              header: 'Request #',
              accessor: 'requestNo',
              cell: (r) => <CodeCell value={r.requestNo} />,
            },
            {
              id: 'kind',
              header: 'Type',
              cell: (r) => (
                <span className="text-sm text-ink">{APPROVAL_KIND_LABELS[r.kind]}</span>
              ),
            },
            { id: 'title', header: 'Title', accessor: 'title' },
            {
              id: 'amount',
              header: 'Amount',
              cell: (r) =>
                typeof r.amount === 'number' && r.amount > 0 ? formatCurrency(r.amount) : '—',
            },
            {
              id: 'status',
              header: 'Status',
              cell: (r) => <StatusBadge kind="approval" status={r.status} />,
            },
            {
              id: 'by',
              header: 'Requested by',
              accessor: 'requestedByName',
            },
            {
              id: 'updated',
              header: 'Updated',
              cell: (r) => formatDate(r.updatedAt, 'datetime'),
            },
            {
              id: 'actions',
              header: ACTION_COLUMN_HEADER,
              headerClassName: ACTION_COLUMN_HEADER_CLASS,
              className: ACTION_COLUMN_CLASS,
              hideable: false,
              sticky: 'right',
              cell: (r) => (
                <RowActions onView={() => setSelectedId(r.id)} viewLabel="View" />
              ),
            },
          ]}
        />

        <aside
          className={cn(
            'space-y-3 xl:sticky xl:top-4 xl:self-start',
            !selected && 'hidden xl:block',
          )}
        >
          {selected ? (
            <>
              <section className="erp-card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {selected.requestNo}
                    </p>
                    <h2 className="text-base font-semibold text-ink">{selected.title}</h2>
                    <p className="mt-1 text-sm text-ink-muted">{selected.description}</p>
                  </div>
                  <StatusBadge kind="approval" status={selected.status} />
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-ink-muted">Type</dt>
                    <dd className="font-medium">{APPROVAL_KIND_LABELS[selected.kind]}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Requested by</dt>
                    <dd className="font-medium">{selected.requestedByName}</dd>
                  </div>
                  {selected.referenceLabel ? (
                    <div>
                      <dt className="text-ink-muted">Reference</dt>
                      <dd className="font-medium">
                        {selected.href ? (
                          <Link
                            to={selected.href}
                            className="text-brand-700 hover:underline dark:text-brand-300"
                          >
                            {selected.referenceLabel}
                          </Link>
                        ) : (
                          selected.referenceLabel
                        )}
                      </dd>
                    </div>
                  ) : null}
                  {typeof selected.amount === 'number' && selected.amount > 0 ? (
                    <div>
                      <dt className="text-ink-muted">Amount</dt>
                      <dd className="font-medium tabular-nums">{formatCurrency(selected.amount)}</dd>
                    </div>
                  ) : null}
                  {selected.approverName ? (
                    <div>
                      <dt className="text-ink-muted">Approver</dt>
                      <dd className="font-medium">{selected.approverName}</dd>
                    </div>
                  ) : null}
                </dl>

                <FormField label="Decision / note">
                  <Textarea
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note for approve / reject / submit"
                  />
                </FormField>

                <div className="flex flex-wrap gap-2">
                  {selected.status === 'draft' ? (
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => runAction('submit', selected)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit
                    </Button>
                  ) : null}
                  {selected.status === 'pending_approval' ? (
                    <>
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => runAction('approve', selected)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="gap-1"
                        onClick={() => runAction('reject', selected)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {selected.status === 'approved' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runAction('complete', selected)}
                    >
                      Mark completed
                    </Button>
                  ) : null}
                </div>

                <FormField label="Add comment">
                  <div className="flex gap-2">
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Timeline comment…"
                    />
                    <Button type="button" variant="outline" onClick={handleComment}>
                      Add
                    </Button>
                  </div>
                </FormField>
              </section>

              <ApprovalTimeline
                events={selected.timeline}
                compact
                maxHeightClassName="max-h-80"
              />
            </>
          ) : (
            <section className="erp-card p-4 text-sm text-ink-muted">
              Select an approval request to view its timeline.
            </section>
          )}
        </aside>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New approval request" mobileSheet>
        <div className="mobile-form space-y-3">
          <FormField label="Type">
            <Select value={newKind} onChange={(e) => setNewKind(e.target.value as ApprovalKind)}>
              {KIND_OPTIONS.map((k) => (
                <option key={k} value={k}>
                  {APPROVAL_KIND_LABELS[k]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Purchase PO-2092 approval"
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Why approval is needed"
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Amount (optional)">
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value) || 0)}
              />
            </FormField>
            <FormField label="Reference (optional)">
              <Input
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                placeholder="PO / INV / customer"
              />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={submitOnCreate}
              onChange={(e) => setSubmitOnCreate(e.target.checked)}
            />
            Submit for approval immediately
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
