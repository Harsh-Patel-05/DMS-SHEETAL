import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import { cn } from '@/utils/cn'

export interface RowActionItem {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface RowActionsProps {
  /** View / open detail */
  onView?: () => void
  viewLabel?: string
  /** Edit record */
  onEdit?: () => void
  editLabel?: string
  /** Delete / remove */
  onDelete?: () => void
  deleteLabel?: string
  /** Extra overflow menu items */
  more?: RowActionItem[]
  className?: string
}

/** Compact icon action group for list tables — use with column header "Action". */
export function RowActions({
  onView,
  viewLabel = 'View',
  onEdit,
  editLabel = 'Edit',
  onDelete,
  deleteLabel = 'Delete',
  more,
  className,
}: RowActionsProps) {
  const hasPrimary = Boolean(onView || onEdit || onDelete)
  if (!hasPrimary && (!more || more.length === 0)) return null

  return (
    <div
      className={cn('inline-flex items-center justify-end gap-0.5', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {onView ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-ink-muted hover:bg-brand-50 hover:text-brand-700"
          aria-label={viewLabel}
          title={viewLabel}
          onClick={onView}
        >
          <Eye className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-ink-muted hover:bg-brand-50 hover:text-brand-700"
          aria-label={editLabel}
          title={editLabel}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-ink-muted hover:bg-danger-bg hover:text-danger"
          aria-label={deleteLabel}
          title={deleteLabel}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
      {more && more.length > 0 ? (
        <Dropdown>
          <DropdownTrigger
            className="h-8 w-8 border-0 bg-transparent p-0 text-ink-muted shadow-none hover:bg-brand-50 hover:text-brand-700"
            chevron={false}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </DropdownTrigger>
          <DropdownMenu className="min-w-[10.5rem] p-1" align="end">
            {more.map((item) => (
              <DropdownItem
                key={item.id}
                disabled={item.disabled}
                destructive={item.destructive}
                onSelect={item.onClick}
                className="gap-2"
              >
                {item.icon}
                {item.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      ) : null}
    </div>
  )
}

/** Plain text for SKU / document numbers — same look as other table cells. */
export function CodeCell({ value, className }: { value: ReactNode; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-ink-subtle">—</span>
  }
  return <span className={cn('truncate text-ink', className)}>{value}</span>
}

/** Standard list Action column config helpers */
export const ACTION_COLUMN_HEADER = 'Action'
export const ACTION_COLUMN_HEADER_CLASS = 'text-right'
export const ACTION_COLUMN_CLASS = 'text-right'
