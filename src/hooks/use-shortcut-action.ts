import { useEffect } from 'react'
import {
  SHORTCUT_ACTION_EVENT,
  type ShortcutActionDetail,
} from '@/utils/keyboard'

/**
 * Register a page-level handler for Ctrl+S (save) or Ctrl+Enter (submit).
 * Handlers are invoked by the global shortcut system.
 */
export function useShortcutAction(
  action: 'save' | 'submit',
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return
    const onAction = (event: Event) => {
      const detail = (event as CustomEvent<ShortcutActionDetail>).detail
      if (detail?.action !== action) return
      handler()
    }
    window.addEventListener(SHORTCUT_ACTION_EVENT, onAction)
    return () => window.removeEventListener(SHORTCUT_ACTION_EVENT, onAction)
  }, [action, handler, enabled])
}
