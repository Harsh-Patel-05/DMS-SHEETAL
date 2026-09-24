import { useEffect, useRef } from 'react'
import { useDmsStore } from '@/store/dms-store'
import { useOfflineStore } from '@/store/offline-store'

/**
 * Bridges browser connectivity + local store mutations into the mock sync queue.
 * When a real API exists, replace enqueue/runMockSync with outbound request batches.
 */
export function OfflineSyncBridge() {
  const setBrowserOnline = useOfflineStore((s) => s.setBrowserOnline)
  const enqueuePendingChange = useOfflineStore((s) => s.enqueuePendingChange)
  const runMockSync = useOfflineStore((s) => s.runMockSync)
  const debounceRef = useRef<number | null>(null)
  const readyRef = useRef(false)
  const wasOfflineRef = useRef(false)

  // Browser online / offline
  useEffect(() => {
    const apply = () => setBrowserOnline(navigator.onLine)
    apply()
    window.addEventListener('online', apply)
    window.addEventListener('offline', apply)
    return () => {
      window.removeEventListener('online', apply)
      window.removeEventListener('offline', apply)
    }
  }, [setBrowserOnline])

  // Allow hydration / first paint before tracking mutations
  useEffect(() => {
    const t = window.setTimeout(() => {
      readyRef.current = true
    }, 800)
    return () => window.clearTimeout(t)
  }, [])

  // Queue mock pending changes when mutations happen offline
  useEffect(() => {
    return useDmsStore.subscribe(() => {
      if (!readyRef.current) return
      if (!useOfflineStore.getState().isOffline()) return

      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        enqueuePendingChange({
          label: 'Local data change',
          entity: 'dms',
          action: 'update',
          payloadHint: 'zustand-persist',
        })
      }, 400)
    })
  }, [enqueuePendingChange])

  // Auto mock-sync when returning online with pending work
  useEffect(() => {
    return useOfflineStore.subscribe((state) => {
      const offline = !state.browserOnline || state.simulateOffline
      if (wasOfflineRef.current && !offline && state.pendingChanges.length > 0) {
        void runMockSync()
      }
      wasOfflineRef.current = offline
    })
  }, [runMockSync])

  return null
}
