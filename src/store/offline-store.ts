import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Sync pipeline states — mock today, map to real API queue later. */
export type SyncStatus = 'synced' | 'pending' | 'syncing'

export interface PendingChange {
  id: string
  /** Human label for UI */
  label: string
  /** Optional entity hint for future API mapping */
  entity?: string
  /** Optional action hint: create | update | delete */
  action?: string
  createdAt: string
  /** Opaque local payload reference — not sent anywhere yet */
  payloadHint?: string
}

interface OfflineState {
  /** Live browser connectivity */
  browserOnline: boolean
  /** Manual override for demo / QA (mock offline) */
  simulateOffline: boolean
  syncStatus: SyncStatus
  pendingChanges: PendingChange[]
  lastSyncedAt: string | null
  lastSyncNote: string | null

  isOffline: () => boolean
  setBrowserOnline: (online: boolean) => void
  setSimulateOffline: (value: boolean) => void
  enqueuePendingChange: (input: {
    label: string
    entity?: string
    action?: string
    payloadHint?: string
  }) => void
  clearPending: () => void
  /** Mock sync — replaces future POST /sync batch */
  runMockSync: () => Promise<{ ok: true; synced: number } | { ok: false; message: string }>
}

function uid() {
  return `pc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      browserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      simulateOffline: false,
      syncStatus: 'synced',
      pendingChanges: [],
      lastSyncedAt: null,
      lastSyncNote: null,

      isOffline: () => {
        const s = get()
        return !s.browserOnline || s.simulateOffline
      },

      setBrowserOnline: (online) => {
        set({ browserOnline: online })
        const next = get()
        if ((!online || next.simulateOffline) && next.pendingChanges.length > 0) {
          set({ syncStatus: 'pending' })
        }
      },

      setSimulateOffline: (value) => {
        set({ simulateOffline: value })
        const next = get()
        if ((value || !next.browserOnline) && next.pendingChanges.length > 0) {
          set({ syncStatus: 'pending' })
        }
      },

      enqueuePendingChange: (input) => {
        const entry: PendingChange = {
          id: uid(),
          label: input.label,
          entity: input.entity,
          action: input.action,
          payloadHint: input.payloadHint,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          pendingChanges: [entry, ...s.pendingChanges].slice(0, 100),
          syncStatus: 'pending',
        }))
      },

      clearPending: () => set({ pendingChanges: [], syncStatus: 'synced' }),

      runMockSync: async () => {
        const { isOffline, pendingChanges, syncStatus } = get()
        if (isOffline()) {
          return { ok: false, message: 'Cannot sync while offline' }
        }
        if (syncStatus === 'syncing') {
          return { ok: false, message: 'Sync already in progress' }
        }
        const count = pendingChanges.length
        set({ syncStatus: 'syncing', lastSyncNote: 'Syncing local changes…' })

        // Simulated network round-trip — swap for real API later
        await new Promise((r) => window.setTimeout(r, count > 0 ? 1400 : 600))

        if (get().isOffline()) {
          set({
            syncStatus: pendingChanges.length ? 'pending' : 'synced',
            lastSyncNote: 'Sync interrupted — still offline',
          })
          return { ok: false, message: 'Went offline during sync' }
        }

        const synced = get().pendingChanges.length
        set({
          pendingChanges: [],
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          lastSyncNote:
            synced > 0
              ? `Synced ${synced} change${synced === 1 ? '' : 's'} on this device`
              : 'Already up to date',
        })
        return { ok: true, synced }
      },
    }),
    {
      name: 'dms-offline-mock',
      partialize: (s) => ({
        simulateOffline: s.simulateOffline,
        pendingChanges: s.pendingChanges,
        syncStatus: s.syncStatus === 'syncing' ? 'pending' : s.syncStatus,
        lastSyncedAt: s.lastSyncedAt,
        lastSyncNote: s.lastSyncNote,
      }),
    },
  ),
)

export function selectEffectiveOnline(s: OfflineState) {
  return s.browserOnline && !s.simulateOffline
}
