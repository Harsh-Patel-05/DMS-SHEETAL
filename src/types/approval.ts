export type ApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'completed'

export type ApprovalKind =
  | 'purchase'
  | 'stock_adjustment'
  | 'discount'
  | 'return'
  | 'credit_limit'

export type ApprovalEventAction =
  | 'created'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'comment'

export interface ApprovalTimelineEvent {
  id: string
  at: string
  action: ApprovalEventAction
  status: ApprovalStatus
  userId: string
  userName: string
  note?: string
}

export interface ApprovalPayload {
  productId?: string
  productName?: string
  adjustmentType?: 'increase' | 'decrease'
  quantity?: number
  reason?: string
  purchaseId?: string
  purchaseNo?: string
  saleId?: string
  invoiceNo?: string
  customerId?: string
  customerName?: string
  discountAmount?: number
  discountPercent?: number
  creditLimitCurrent?: number
  creditLimitRequested?: number
  returnQuantity?: number
  supplierId?: string
  supplierName?: string
}

export interface ApprovalRequest {
  id: string
  requestNo: string
  kind: ApprovalKind
  status: ApprovalStatus
  title: string
  description: string
  amount?: number
  referenceType?: string
  referenceId?: string
  referenceLabel?: string
  href?: string
  requestedById: string
  requestedByName: string
  approverId?: string
  approverName?: string
  decisionNote?: string
  payload?: ApprovalPayload
  timeline: ApprovalTimelineEvent[]
  createdAt: string
  updatedAt: string
  decidedAt?: string
  completedAt?: string
}

export const APPROVAL_KIND_LABELS: Record<ApprovalKind, string> = {
  purchase: 'Purchase approval',
  stock_adjustment: 'Stock adjustment approval',
  discount: 'Discount approval',
  return: 'Return approval',
  credit_limit: 'Credit limit approval',
}

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}
