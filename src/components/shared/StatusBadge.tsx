import type { DocStatus, Status, StockStatus, TransferStatus, ApprovalStatus, ExportJobStatus } from '@/types'
import { APPROVAL_STATUS_LABELS } from '@/types/approval'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/utils/cn'
import { EXPORT_STATUS_LABELS } from '@/utils/export-center'

type StatusKind = 'doc' | 'stock' | 'party' | 'transfer' | 'approval' | 'export'

type StatusValue = DocStatus | StockStatus | Status | TransferStatus | ApprovalStatus | ExportJobStatus

const docLabels: Record<DocStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
}

const stockLabels: Record<StockStatus, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

const partyLabels: Record<Status, string> = {
  active: 'Active',
  inactive: 'Inactive',
}

const transferLabels: Record<TransferStatus, string> = {
  draft: 'Draft',
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

function variantFor(kind: StatusKind, status: StatusValue): BadgeProps['variant'] {
  if (kind === 'party') {
    return status === 'active' ? 'success' : 'default'
  }
  if (kind === 'stock') {
    if (status === 'in_stock') return 'success'
    if (status === 'low_stock') return 'warning'
    return 'danger'
  }
  if (kind === 'transfer') {
    if (status === 'completed' || status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    if (status === 'requested') return 'info'
    return 'default'
  }
  if (kind === 'approval') {
    if (status === 'approved' || status === 'completed') return 'success'
    if (status === 'rejected') return 'danger'
    if (status === 'pending_approval') return 'info'
    if (status === 'draft') return 'warning'
    return 'default'
  }
  if (kind === 'export') {
    if (status === 'completed') return 'success'
    if (status === 'failed') return 'danger'
    return 'warning'
  }
  switch (status as DocStatus) {
    case 'paid':
    case 'confirmed':
      return 'success'
    case 'partial':
    case 'draft':
      return 'warning'
    case 'cancelled':
      return 'danger'
    case 'unpaid':
      return 'info'
    default:
      return 'default'
  }
}

function labelFor(kind: StatusKind, status: StatusValue): string {
  switch (kind) {
    case 'doc':
      return docLabels[status as DocStatus]
    case 'stock':
      return stockLabels[status as StockStatus]
    case 'party':
      return partyLabels[status as Status]
    case 'transfer':
      return transferLabels[status as TransferStatus]
    case 'approval':
      return APPROVAL_STATUS_LABELS[status as ApprovalStatus]
    case 'export':
      return EXPORT_STATUS_LABELS[status as ExportJobStatus]
  }
}

export interface StatusBadgeProps {
  kind: StatusKind
  status: StatusValue
  className?: string
}

export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const label = labelFor(kind, status)
  return (
    <Badge
      variant={variantFor(kind, status)}
      className={cn('erp-status-badge', className)}
      aria-label={`Status: ${label}`}
    >
      {label}
    </Badge>
  )
}
