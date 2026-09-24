import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-x-auto scrollbar-thin">
      <table
        ref={ref}
        className={cn('erp-table w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  ),
)
Table.displayName = 'Table'

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('border-b border-border', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
))
TableBody.displayName = 'TableBody'

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t border-border bg-surface font-medium', className)}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'erp-row-feedback border-b border-border hover:bg-surface/80',
        'data-[state=selected]:bg-brand-50/60 dark:data-[state=selected]:bg-brand-900/20',
        className,
      )}
      {...props}
    />
  ),
)
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, scope = 'col', ...props }, ref) => (
    <th
      ref={ref}
      scope={scope}
      className={cn(
        'h-[var(--table-head-height)] px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-ink-muted',
        className,
      )}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-3 py-[var(--table-cell-y)] align-middle text-ink', className)} {...props} />
  ),
)
TableCell.displayName = 'TableCell'

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn('mt-2 text-sm text-ink-muted', className)} {...props} />
))
TableCaption.displayName = 'TableCaption'
