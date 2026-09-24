/** Helpers for DataTable column visibility/order persisted in localStorage */

export function colsStorageKey(storageKey: string) {
  return `dms-table-cols:${storageKey}`
}

export function orderStorageKey(storageKey: string) {
  return `dms-table-order:${storageKey}`
}

export function listSavedTableColumnKeys(): string[] {
  if (typeof localStorage === 'undefined') return []
  const keys = new Set<string>()
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i)
    if (!k) continue
    if (k.startsWith('dms-table-cols:')) keys.add(k.slice('dms-table-cols:'.length))
    if (k.startsWith('dms-table-order:')) keys.add(k.slice('dms-table-order:'.length))
  }
  return [...keys].sort()
}

export function clearTableColumnPrefs(storageKey?: string) {
  if (typeof localStorage === 'undefined') return
  if (storageKey) {
    localStorage.removeItem(colsStorageKey(storageKey))
    localStorage.removeItem(orderStorageKey(storageKey))
    return
  }
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i)
    if (k?.startsWith('dms-table-cols:') || k?.startsWith('dms-table-order:')) {
      toRemove.push(k)
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k))
}
