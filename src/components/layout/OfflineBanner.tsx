import { WifiOff } from 'lucide-react'
import { selectEffectiveOnline, useOfflineStore } from '@/store/offline-store'

export function OfflineBanner() {
  const online = useOfflineStore(selectEffectiveOnline)
  const pending = useOfflineStore((s) => s.pendingChanges.length)

  if (online) return null

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warning-border/50 bg-warning-bg/70 px-4 py-1.5 text-center text-sm text-ink-muted"
    >
      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
        Offline mode — changes are stored locally.
      </span>
      {pending > 0 ? (
        <span className="text-xs text-ink-subtle">
          {pending} pending change{pending === 1 ? '' : 's'} will mock-sync when online.
        </span>
      ) : null}
    </div>
  )
}
