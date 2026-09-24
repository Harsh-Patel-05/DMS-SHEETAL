import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'

export interface UnsavedChangesDialogProps {
  open: boolean
  onStay: () => void
  onDiscard: () => void
  title?: string
  description?: string
  stayLabel?: string
  discardLabel?: string
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onDiscard,
  title = 'You have unsaved changes.',
  description = 'If you leave now, your edits will be lost.',
  stayLabel = 'Stay',
  discardLabel = 'Discard',
}: UnsavedChangesDialogProps) {
  return (
    <Modal open={open} onClose={onStay} title={title} description={description} size="sm" showClose={false}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="sm:min-w-[120px]" onClick={onDiscard}>
          {discardLabel}
        </Button>
        <Button type="button" className="sm:min-w-[120px]" onClick={onStay}>
          {stayLabel}
        </Button>
      </div>
    </Modal>
  )
}
