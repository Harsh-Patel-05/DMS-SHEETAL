import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog'

export interface UseUnsavedChangesOptions {
  /** Extra cleanup when discarding (e.g. clear localStorage draft). */
  onDiscard?: () => void
  /** When false, navigation/close is never blocked. Default true. */
  enabled?: boolean
}

/**
 * Blocks in-app navigation and tab close when `isDirty`.
 * Use `confirmIfDirty(proceed)` for modal close / custom leave actions.
 */
export function useUnsavedChanges(isDirty: boolean, options: UseUnsavedChangesOptions = {}) {
  const { onDiscard, enabled = true } = options
  const shouldBlock = enabled && isDirty
  const [dialogOpen, setDialogOpen] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      pendingAction.current = null
      setDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlock) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [shouldBlock])

  const stay = useCallback(() => {
    setDialogOpen(false)
    pendingAction.current = null
    if (blocker.state === 'blocked') blocker.reset?.()
  }, [blocker])

  const discard = useCallback(() => {
    onDiscard?.()
    setDialogOpen(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (blocker.state === 'blocked') {
      blocker.proceed?.()
      return
    }
    action?.()
  }, [blocker, onDiscard])

  /** Run `proceed` immediately if clean; otherwise prompt Stay / Discard. */
  const confirmIfDirty = useCallback(
    (proceed: () => void) => {
      if (!shouldBlock) {
        proceed()
        return
      }
      pendingAction.current = proceed
      setDialogOpen(true)
    },
    [shouldBlock],
  )

  const dialog = (
    <UnsavedChangesDialog open={dialogOpen} onStay={stay} onDiscard={discard} />
  )

  return {
    dialogOpen,
    stay,
    discard,
    confirmIfDirty,
    dialog,
  }
}

/** Stable JSON snapshot for dirty checks on plain objects. */
export function formSnapshot(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
