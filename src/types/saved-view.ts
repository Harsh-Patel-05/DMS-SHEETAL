import type { AdvancedFilterGroup } from '@/types/advanced-filter'

export type SavedViewSortDirection = 'asc' | 'desc'

/** Snapshot of table UI state captured by a saved view */
export interface SavedViewSnapshot {
  search: string
  columnFilters: Record<string, string>
  advancedFilter: AdvancedFilterGroup | null
  sortKey?: string
  sortDirection: SavedViewSortDirection
  columnVisibility: Record<string, boolean>
  columnOrder: string[]
  pageSize: number
}

export interface SavedView {
  id: string
  name: string
  /** Matches DataTable `storageKey` */
  tableId: string
  snapshot: SavedViewSnapshot
  /** Built-in example — not removable */
  isPreset?: boolean
  updatedAt?: string
}
