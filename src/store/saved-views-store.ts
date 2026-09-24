import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESET_SAVED_VIEWS } from '@/config/saved-view-presets'
import type { SavedView, SavedViewSnapshot } from '@/types/saved-view'
import { cloneFilterGroup } from '@/utils/advanced-filter'

interface SavedViewsState {
  userSaved: SavedView[]
  /** Last selected view id per table — restored on revisit */
  activeByTable: Record<string, string | null>

  listForTable: (tableId: string) => SavedView[]
  getActiveId: (tableId: string) => string | null
  setActiveId: (tableId: string, id: string | null) => void
  saveUserView: (tableId: string, name: string, snapshot: SavedViewSnapshot) => SavedView
  updateUserView: (id: string, snapshot: SavedViewSnapshot, name?: string) => void
  deleteUserView: (id: string) => void
}

function newViewId() {
  return `view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneSnapshot(snapshot: SavedViewSnapshot): SavedViewSnapshot {
  return {
    search: snapshot.search,
    columnFilters: { ...snapshot.columnFilters },
    advancedFilter: snapshot.advancedFilter
      ? cloneFilterGroup(snapshot.advancedFilter)
      : null,
    sortKey: snapshot.sortKey,
    sortDirection: snapshot.sortDirection,
    columnVisibility: { ...snapshot.columnVisibility },
    columnOrder: [...snapshot.columnOrder],
    pageSize: snapshot.pageSize,
  }
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set, get) => ({
      userSaved: [],
      activeByTable: {},

      listForTable: (tableId) => {
        const presets = PRESET_SAVED_VIEWS.filter((v) => v.tableId === tableId)
        const user = get().userSaved.filter((v) => v.tableId === tableId)
        return [...presets, ...user]
      },

      getActiveId: (tableId) => get().activeByTable[tableId] ?? null,

      setActiveId: (tableId, id) =>
        set((s) => ({
          activeByTable: { ...s.activeByTable, [tableId]: id },
        })),

      saveUserView: (tableId, name, snapshot) => {
        const entry: SavedView = {
          id: newViewId(),
          name: name.trim() || 'Untitled view',
          tableId,
          snapshot: cloneSnapshot(snapshot),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({
          userSaved: [...s.userSaved, entry],
          activeByTable: { ...s.activeByTable, [tableId]: entry.id },
        }))
        return entry
      },

      updateUserView: (id, snapshot, name) => {
        if (PRESET_SAVED_VIEWS.some((p) => p.id === id)) return
        set((s) => ({
          userSaved: s.userSaved.map((v) =>
            v.id === id
              ? {
                  ...v,
                  name: name?.trim() ? name.trim() : v.name,
                  snapshot: cloneSnapshot(snapshot),
                  updatedAt: new Date().toISOString(),
                }
              : v,
          ),
        }))
      },

      deleteUserView: (id) => {
        if (PRESET_SAVED_VIEWS.some((p) => p.id === id)) return
        set((s) => {
          const target = s.userSaved.find((v) => v.id === id)
          const userSaved = s.userSaved.filter((v) => v.id !== id)
          const activeByTable = { ...s.activeByTable }
          if (target && activeByTable[target.tableId] === id) {
            activeByTable[target.tableId] = null
          }
          return { userSaved, activeByTable }
        })
      },
    }),
    { name: 'dms-sheetal-saved-views-v1' },
  ),
)
