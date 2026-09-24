import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PRESET_SAVED_FILTERS } from '@/config/advanced-filter-presets'
import type { AdvancedFilterGroup, SavedAdvancedFilter } from '@/types/advanced-filter'
import { cloneFilterGroup } from '@/utils/advanced-filter'

interface SavedFiltersState {
  userSaved: SavedAdvancedFilter[]

  listForContext: (contextId: string) => SavedAdvancedFilter[]
  saveUserFilter: (contextId: string, name: string, group: AdvancedFilterGroup) => SavedAdvancedFilter
  deleteUserFilter: (id: string) => void
  renameUserFilter: (id: string, name: string) => void
}

function newFilterId() {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useSavedFiltersStore = create<SavedFiltersState>()(
  persist(
    (set, get) => ({
      userSaved: [],

      listForContext: (contextId) => {
        const presets = PRESET_SAVED_FILTERS.filter((f) => f.contextId === contextId)
        const user = get().userSaved.filter((f) => f.contextId === contextId)
        return [...presets, ...user]
      },

      saveUserFilter: (contextId, name, group) => {
        const trimmed = name.trim()
        const entry: SavedAdvancedFilter = {
          id: newFilterId(),
          name: trimmed || 'Untitled filter',
          contextId,
          group: cloneFilterGroup(group),
        }
        set((s) => ({ userSaved: [...s.userSaved, entry] }))
        return entry
      },

      deleteUserFilter: (id) => {
        if (PRESET_SAVED_FILTERS.some((p) => p.id === id)) return
        set((s) => ({ userSaved: s.userSaved.filter((f) => f.id !== id) }))
      },

      renameUserFilter: (id, name) => {
        set((s) => ({
          userSaved: s.userSaved.map((f) =>
            f.id === id ? { ...f, name: name.trim() || f.name } : f,
          ),
        }))
      },
    }),
    { name: 'dms-sheetal-saved-filters-v1' },
  ),
)
