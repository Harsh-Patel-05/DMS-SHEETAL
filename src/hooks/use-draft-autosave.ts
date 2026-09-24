import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearDraft,
  formatDraftSavedAt,
  readDraftEnvelope,
  writeDraftEnvelope,
  type DraftEnvelope,
} from '@/utils/draft-autosave'

export interface UseDraftAutosaveOptions<T> {
  key: string
  /** Current form payload to persist */
  data: T
  /** When true, periodically write draft */
  enabled: boolean
  intervalMs?: number
  /** Serialize for change detection (default JSON.stringify) */
  serialize?: (data: T) => string
}

export function useDraftAutosave<T>({
  key,
  data,
  enabled,
  intervalMs = 3000,
  serialize = (d) => JSON.stringify(d),
}: UseDraftAutosaveOptions<T>) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => readDraftEnvelope<T>(key)?.savedAt ?? null)
  const [pendingEnvelope, setPendingEnvelope] = useState<DraftEnvelope<T> | null>(() =>
    readDraftEnvelope<T>(key),
  )
  const lastWritten = useRef<string | null>(null)

  const saveNow = useCallback(() => {
    if (!enabled) return null
    const serialized = serialize(data)
    if (serialized === lastWritten.current) return null
    const envelope = writeDraftEnvelope(key, data)
    lastWritten.current = serialized
    setLastSavedAt(envelope.savedAt)
    return envelope
  }, [enabled, serialize, data, key])

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      saveNow()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs, saveNow])

  const deleteDraft = useCallback(() => {
    clearDraft(key)
    lastWritten.current = null
    setLastSavedAt(null)
    setPendingEnvelope(null)
  }, [key])

  const dismissPending = useCallback(() => {
    setPendingEnvelope(null)
  }, [])

  const acknowledgePending = useCallback(() => {
    const env = pendingEnvelope
    setPendingEnvelope(null)
    if (env) {
      lastWritten.current = serialize(env.data)
      setLastSavedAt(env.savedAt)
    }
    return env
  }, [pendingEnvelope, serialize])

  return {
    lastSavedAt,
    lastSavedLabel: lastSavedAt ? formatDraftSavedAt(lastSavedAt) : null,
    pendingEnvelope,
    saveNow,
    deleteDraft,
    dismissPending,
    acknowledgePending,
    hasStoredDraft: Boolean(readDraftEnvelope(key)),
  }
}
