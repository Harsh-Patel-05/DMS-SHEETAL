export type ShortcutGroupId = 'global' | 'forms' | 'sales'

export interface ShortcutDefinition {
  id: string
  group: ShortcutGroupId
  /** Display chords, e.g. ['Ctrl', 'K'] */
  keys: string[]
  /** macOS alternate label when different (optional) */
  macKeys?: string[]
  description: string
  /** Shown in help modal footnotes */
  note?: string
}

export const SHORTCUT_GROUP_LABELS: Record<ShortcutGroupId, string> = {
  global: 'Global',
  forms: 'Forms & dialogs',
  sales: 'Sales / POS',
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'command-palette',
    group: 'global',
    keys: ['Ctrl', 'K'],
    macKeys: ['⌘', 'K'],
    description: 'Global search / command palette',
  },
  {
    id: 'new-transaction',
    group: 'global',
    keys: ['Ctrl', 'N'],
    macKeys: ['⌘', 'N'],
    description: 'New transaction (sale)',
  },
  {
    id: 'help',
    group: 'global',
    keys: ['?'],
    description: 'Show keyboard shortcut help',
  },
  {
    id: 'save',
    group: 'forms',
    keys: ['Ctrl', 'S'],
    macKeys: ['⌘', 'S'],
    description: 'Save draft',
    note: 'Active on sale, purchase, and other editable forms',
  },
  {
    id: 'submit',
    group: 'forms',
    keys: ['Ctrl', 'Enter'],
    macKeys: ['⌘', 'Enter'],
    description: 'Submit / confirm',
  },
  {
    id: 'escape',
    group: 'forms',
    keys: ['Esc'],
    description: 'Close dialog, drawer, or palette',
  },
  {
    id: 'sale-pick',
    group: 'sales',
    keys: ['Enter'],
    description: 'Add highlighted product from search',
  },
  {
    id: 'sale-qty',
    group: 'sales',
    keys: ['/'],
    description: 'Focus cart quantity',
  },
  {
    id: 'sale-dec',
    group: 'sales',
    keys: ['-'],
    description: 'Decrease selected line quantity',
  },
  {
    id: 'sale-inc',
    group: 'sales',
    keys: ['+'],
    description: 'Increase selected line quantity',
  },
  {
    id: 'sale-del',
    group: 'sales',
    keys: ['Delete'],
    description: 'Remove selected cart line',
  },
]

export function isApplePlatform() {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent)
}
