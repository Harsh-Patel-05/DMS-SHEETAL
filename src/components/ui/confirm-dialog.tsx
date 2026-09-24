import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  loading?: boolean
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      {children ? <div className="mb-4 text-sm text-ink-muted">{children}</div> : null}
      <div className={cn('flex flex-wrap justify-end gap-2')}>
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
