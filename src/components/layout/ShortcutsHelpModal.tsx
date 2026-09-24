import { Keyboard } from 'lucide-react'
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_GROUP_LABELS,
  isApplePlatform,
  type ShortcutGroupId,
} from '@/config/keyboard-shortcuts'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/utils/cn'

export interface ShortcutsHelpModalProps {
  open: boolean
  onClose: () => void
}

function KeyCap({ label }: { label: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border-strong',
        'bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-card',
      )}
    >
      {label}
    </kbd>
  )
}

function Chord({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k, i) => (
        <span key={`${k}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <span className="text-ink-subtle">+</span> : null}
          <KeyCap label={k} />
        </span>
      ))}
    </span>
  )
}

const GROUP_ORDER: ShortcutGroupId[] = ['global', 'forms', 'sales']

export function ShortcutsHelpModal({ open, onClose }: ShortcutsHelpModalProps) {
  const apple = isApplePlatform()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keyboard shortcuts"
      description="Work faster with these shortcuts. Press Esc to close this dialog."
      size="md"
    >
      <div className="mb-4 flex items-start gap-3 rounded-md border border-border bg-surface-muted/80 px-3 py-2.5">
        <Keyboard className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
        <p className="text-xs text-ink-muted">
          Press <KeyCap label="?" /> anytime to reopen this help. Use{' '}
          <Chord keys={apple ? ['⌘', 'K'] : ['Ctrl', 'K']} /> for global search.
        </p>
      </div>

      <div className="space-y-5">
        {GROUP_ORDER.map((group) => {
          const items = KEYBOARD_SHORTCUTS.filter((s) => s.group === group)
          if (!items.length) return null
          return (
            <section key={group}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {SHORTCUT_GROUP_LABELS[group]}
              </h3>
              <ul className="overflow-hidden rounded-md border border-border">
                {items.map((s, index) => {
                  const keys = apple && s.macKeys ? s.macKeys : s.keys
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        'flex items-start justify-between gap-4 px-3 py-2.5',
                        index > 0 && 'border-t border-border',
                        'bg-surface-elevated',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-ink">{s.description}</p>
                        {s.note ? <p className="mt-0.5 text-xs text-ink-muted">{s.note}</p> : null}
                      </div>
                      <Chord keys={keys} />
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </Modal>
  )
}
