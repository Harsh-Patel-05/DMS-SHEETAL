/**
 * Persist recent SearchableSelect choices per scope (localStorage).
 */
const PREFIX = 'dms-sheetal-recent-select:'

export function readRecentIds(scope: string, limit = 8): string[] {
  try {
    const raw = localStorage.getItem(`${PREFIX}${scope}`)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, limit)
  } catch {
    return []
  }
}

export function pushRecentId(scope: string, id: string, limit = 8): string[] {
  const next = [id, ...readRecentIds(scope, limit).filter((x) => x !== id)].slice(0, limit)
  try {
    localStorage.setItem(`${PREFIX}${scope}`, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
  return next
}

export function clearRecentIds(scope: string) {
  try {
    localStorage.removeItem(`${PREFIX}${scope}`)
  } catch {
    /* ignore */
  }
}
