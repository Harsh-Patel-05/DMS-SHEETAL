import { CloudOff, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { selectEffectiveOnline, useOfflineStore } from '@/store/offline-store'
import { cn } from '@/utils/cn'

function formatSyncTime(iso: string | null) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  } catch {
    return null
  }
}

export function NetworkStatusIndicator() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const browserOnline = useOfflineStore((s) => s.browserOnline)
  const simulateOffline = useOfflineStore((s) => s.simulateOffline)
  const online = useOfflineStore(selectEffectiveOnline)
  const syncStatus = useOfflineStore((s) => s.syncStatus)
  const pendingChanges = useOfflineStore((s) => s.pendingChanges)
  const lastSyncedAt = useOfflineStore((s) => s.lastSyncedAt)
  const lastSyncNote = useOfflineStore((s) => s.lastSyncNote)
  const setSimulateOffline = useOfflineStore((s) => s.setSimulateOffline)
  const runMockSync = useOfflineStore((s) => s.runMockSync)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const syncLabel =
    syncStatus === 'syncing'
      ? 'Syncing'
      : syncStatus === 'pending' || pendingChanges.length > 0
        ? `Pending${pendingChanges.length ? ` (${pendingChanges.length})` : ''}`
        : 'Synced'

  const statusLabel = online ? `Online · ${syncLabel}` : 'Offline'
  const StatusIcon = !online
    ? WifiOff
    : syncStatus === 'syncing'
      ? Loader2
      : syncStatus === 'pending' || pendingChanges.length > 0
        ? CloudOff
        : Wifi

  const onSync = async () => {
    const result = await runMockSync()
    if (!result.ok) {
      toast({ title: 'Sync unavailable', description: result.message, variant: 'warning' })
      return
    }
    toast({
      title: result.synced ? 'Local sync complete' : 'Already up to date',
      description: 'Changes are saved on this device.',
      variant: 'success',
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-md touch-manipulation transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1',
          online
            ? 'text-ink-muted hover:bg-surface-muted hover:text-ink'
            : 'bg-warning-bg text-warning hover:opacity-90',
          open && online && 'bg-surface-muted text-ink',
        )}
        aria-label={statusLabel}
        title={statusLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <StatusIcon
          className={cn('h-4 w-4', syncStatus === 'syncing' && 'animate-spin')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[18.5rem] rounded-lg border border-border bg-surface-elevated p-3 shadow-elevated">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">Network &amp; sync</p>
              <p className="text-[11px] text-ink-muted">Offline-first · data stays on this device</p>
            </div>
            <Badge variant={online ? 'success' : 'warning'}>{online ? 'Online' : 'Offline'}</Badge>
          </div>

          <dl className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Browser</dt>
              <dd className="text-ink">{browserOnline ? 'Connected' : 'Disconnected'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ink-muted">Sync status</dt>
              <dd className="font-medium text-ink">{syncLabel}</dd>
            </div>
            {formatSyncTime(lastSyncedAt) ? (
              <div className="flex justify-between gap-2">
                <dt className="text-ink-muted">Last synced</dt>
                <dd className="text-ink">{formatSyncTime(lastSyncedAt)}</dd>
              </div>
            ) : null}
          </dl>

          {lastSyncNote ? <p className="mt-2 text-[11px] text-ink-subtle">{lastSyncNote}</p> : null}

          {pendingChanges.length > 0 ? (
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto rounded-md border border-border bg-surface-muted/60 p-2 text-[11px]">
              {pendingChanges.slice(0, 8).map((c) => (
                <li key={c.id} className="flex justify-between gap-2 text-ink-muted">
                  <span className="truncate">{c.label}</span>
                  <span className="shrink-0 tabular-nums">
                    {new Date(c.createdAt).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={simulateOffline}
              onChange={(e) => {
                setSimulateOffline(e.target.checked)
                toast({
                  title: e.target.checked ? 'Simulating offline' : 'Back to browser network',
                  variant: 'info',
                })
              }}
            />
            Simulate offline mode
          </label>

          <Button
            type="button"
            size="sm"
            className="mt-2 w-full gap-1.5"
            disabled={!online || syncStatus === 'syncing'}
            onClick={() => void onSync()}
          >
            {syncStatus === 'syncing' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncStatus === 'syncing' ? 'Syncing…' : 'Run mock sync'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
