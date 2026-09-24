export type ActivityKind =
  | 'sale'
  | 'payment'
  | 'purchase'
  | 'stock'
  | 'invoice'
  | 'return'
  | 'adjustment'
  | 'transfer'
  | 'note'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  /** ISO date or datetime */
  at: string
  /** Primary line, e.g. "Sale INV-1023 created" */
  title: string
  description?: string
  amount?: number
  href?: string
}
