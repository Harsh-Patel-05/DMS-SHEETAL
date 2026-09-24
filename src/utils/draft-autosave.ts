/** Local draft autosave helpers (browser localStorage). */

export interface DraftEnvelope<T> {
  savedAt: string
  data: T
}

export function readDraftEnvelope<T>(key: string): DraftEnvelope<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftEnvelope<T> | T
    if (parsed && typeof parsed === 'object' && 'savedAt' in parsed && 'data' in parsed) {
      return parsed as DraftEnvelope<T>
    }
    // Legacy plain draft → wrap
    return { savedAt: new Date().toISOString(), data: parsed as T }
  } catch {
    return null
  }
}

export function writeDraftEnvelope<T>(key: string, data: T): DraftEnvelope<T> {
  const envelope: DraftEnvelope<T> = {
    savedAt: new Date().toISOString(),
    data,
  }
  localStorage.setItem(key, JSON.stringify(envelope))
  return envelope
}

export function clearDraft(key: string) {
  localStorage.removeItem(key)
}

export function formatDraftSavedAt(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export const DRAFT_KEYS = {
  sale: 'dms-sale-draft',
  purchase: 'dms-purchase-draft',
  adjustment: 'dms-adjustment-draft',
  expense: 'dms-expense-draft',
  salesReturn: 'dms-sales-return-draft',
  purchaseReturn: 'dms-purchase-return-draft',
} as const
