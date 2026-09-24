import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReportDefinition, SavedReport } from '@/types/report-builder'
import { createDefaultDefinition } from '@/config/report-builder'

const PRESET_REPORTS: SavedReport[] = [
  {
    id: 'preset_sales_by_customer',
    name: 'Sales by Customer',
    ...createDefaultDefinition('sales', 'this_month'),
    groupBy: 'customer',
    columns: ['customer', 'grandTotal', 'paid', 'due', 'count'],
    sortBy: 'grandTotal',
    sortDir: 'desc',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_sales_by_product',
    name: 'Sales by Product',
    ...createDefaultDefinition('sales', 'this_month'),
    groupBy: 'product',
    columns: ['product', 'quantity', 'grandTotal', 'count'],
    sortBy: 'grandTotal',
    sortDir: 'desc',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'preset_sales_by_date',
    name: 'Sales by Date',
    ...createDefaultDefinition('sales', 'this_month'),
    groupBy: 'date',
    columns: ['date', 'grandTotal', 'paid', 'due', 'count'],
    sortBy: 'date',
    sortDir: 'desc',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

interface SavedReportsState {
  userSaved: SavedReport[]
  listAll: () => SavedReport[]
  saveReport: (name: string, definition: ReportDefinition) => SavedReport
  updateReport: (id: string, definition: ReportDefinition, name?: string) => void
  deleteReport: (id: string) => void
}

function newId() {
  return `rpt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneDefinition(definition: ReportDefinition): ReportDefinition {
  return {
    ...definition,
    columns: [...definition.columns],
    filters: definition.filters.map((f) => ({ ...f })),
  }
}

export const useSavedReportsStore = create<SavedReportsState>()(
  persist(
    (set, get) => ({
      userSaved: [],

      listAll: () => [...PRESET_REPORTS, ...get().userSaved],

      saveReport: (name, definition) => {
        const entry: SavedReport = {
          id: newId(),
          name: name.trim() || 'Untitled report',
          ...cloneDefinition(definition),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ userSaved: [entry, ...s.userSaved] }))
        return entry
      },

      updateReport: (id, definition, name) => {
        if (PRESET_REPORTS.some((p) => p.id === id)) return
        set((s) => ({
          userSaved: s.userSaved.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...cloneDefinition(definition),
                  name: name?.trim() ? name.trim() : r.name,
                  updatedAt: new Date().toISOString(),
                }
              : r,
          ),
        }))
      },

      deleteReport: (id) => {
        if (PRESET_REPORTS.some((p) => p.id === id)) return
        set((s) => ({ userSaved: s.userSaved.filter((r) => r.id !== id) }))
      },
    }),
    { name: 'dms-sheetal-saved-reports-v1' },
  ),
)
