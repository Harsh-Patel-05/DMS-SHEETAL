import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { emitShortcutAction, isEditableTarget, isModKey } from '@/utils/keyboard'

export interface GlobalShortcutHandlers {
  toggleCommandPalette: () => void
  openShortcutHelp: () => void
  /** When true, skip opening help (e.g. help already open) */
  helpOpen?: boolean
  commandOpen?: boolean
}

/**
 * App-wide keyboard shortcuts:
 * Ctrl/Cmd+K — global search
 * Ctrl/Cmd+N — new sale transaction
 * Ctrl/Cmd+S — save (emit)
 * Ctrl/Cmd+Enter — submit (emit)
 * ? — shortcut help
 */
export function useGlobalShortcuts({
  toggleCommandPalette,
  openShortcutHelp,
  helpOpen = false,
  commandOpen = false,
}: GlobalShortcutHandlers) {
  const navigate = useNavigate()

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = isModKey(e)
      const key = e.key
      const lower = key.toLowerCase()
      const editable = isEditableTarget(e.target)

      // Ctrl/Cmd + K — global search / command palette
      if (mod && lower === 'k' && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        toggleCommandPalette()
        return
      }

      // Ctrl/Cmd + N — new transaction (skip while typing)
      if (mod && lower === 'n' && !e.altKey && !e.shiftKey && !editable) {
        e.preventDefault()
        navigate('/transactions/sales/new')
        return
      }

      // Ctrl/Cmd + S — save draft
      if (mod && lower === 's' && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        emitShortcutAction('save')
        return
      }

      // Ctrl/Cmd + Enter — submit / confirm
      if (mod && key === 'Enter' && !e.altKey) {
        e.preventDefault()
        emitShortcutAction('submit')
        return
      }

      // ? — shortcut help (ignore in fields; ignore if palette open to avoid clash)
      if (
        key === '?' &&
        !mod &&
        !e.altKey &&
        !editable &&
        !helpOpen &&
        !commandOpen
      ) {
        e.preventDefault()
        openShortcutHelp()
      }
    },
    [toggleCommandPalette, openShortcutHelp, helpOpen, commandOpen, navigate],
  )

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onKeyDown])
}
