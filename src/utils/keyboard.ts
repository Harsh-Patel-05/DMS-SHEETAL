/** Shared keyboard helpers for the shortcut system */

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return Boolean(target.closest('[contenteditable="true"]'))
}

export function isModKey(e: { metaKey: boolean; ctrlKey: boolean }): boolean {
  return e.metaKey || e.ctrlKey
}

export function chordKey(e: KeyboardEvent): string {
  return e.key.length === 1 ? e.key.toLowerCase() : e.key
}

export type ShortcutActionId = 'command-palette' | 'new-transaction' | 'save' | 'submit' | 'help'

/** DOM events forms can listen for (Ctrl+S / Ctrl+Enter). */
export const SHORTCUT_ACTION_EVENT = 'dms:shortcut-action'

export type ShortcutActionDetail = { action: 'save' | 'submit' }

export function emitShortcutAction(action: 'save' | 'submit') {
  window.dispatchEvent(
    new CustomEvent<ShortcutActionDetail>(SHORTCUT_ACTION_EVENT, { detail: { action } }),
  )
}
