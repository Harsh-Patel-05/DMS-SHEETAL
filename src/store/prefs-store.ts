import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DatePreset } from '@/utils/date-range'
import { clearTableColumnPrefs } from '@/utils/table-prefs'

export type ThemePreference = 'light' | 'dark' | 'system'
export type TableDensity = 'compact' | 'comfortable' | 'spacious'

export const DEFAULT_DASHBOARD_WIDGETS = [
  'sales_overview',
  'purchase_overview',
  'sales_vs_purchase',
  'gross_profit',
  'net_profit',
  'top_products',
  'top_customers',
  'top_distributors',
  'outstanding_receivables',
  'outstanding_payables',
  'low_stock',
  'recent_transactions',
  'recent_payments',
  'recent_invoices',
  'expense_overview',
] as const

export const DASHBOARD_WIDGET_LABELS: Record<string, string> = {
  sales_overview: 'Sales overview',
  purchase_overview: 'Purchase overview',
  sales_vs_purchase: 'Sales vs purchase',
  top_products: 'Top products',
  top_customers: 'Top customers',
  top_distributors: 'Top distributors',
  outstanding_receivables: 'Outstanding receivables',
  outstanding_payables: 'Outstanding payables',
  low_stock: 'Low stock',
  recent_transactions: 'Recent transactions',
  recent_payments: 'Recent payments',
  recent_invoices: 'Recent invoices',
  expense_overview: 'Expense overview',
  gross_profit: 'Gross profit',
  net_profit: 'Net profit',
}

export const DATE_PRESET_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_year', label: 'This year' },
]

export const LANDING_PAGE_OPTIONS: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/master/products', label: 'Products' },
  { path: '/parties/customers', label: 'Customers' },
  { path: '/transactions/sales', label: 'Sales' },
  { path: '/transactions/purchases', label: 'Purchases' },
  { path: '/transactions/invoices', label: 'Invoices' },
  { path: '/inventory/stock', label: 'Stock' },
  { path: '/finance/summary', label: 'Financial summary' },
  { path: '/finance/outstanding', label: 'Outstanding' },
  { path: '/reports/builder', label: 'Report builder' },
  { path: '/admin', label: 'Admin Control Center' },
  { path: '/admin/demo', label: 'Demo Mode' },
  { path: '/admin/approvals', label: 'Approvals' },
  { path: '/admin/notifications', label: 'Notification Center' },
  { path: '/admin/import', label: 'Import Center' },
  { path: '/admin/export', label: 'Export Center' },
  { path: '/admin/personalization', label: 'Personalization' },
  { path: '/admin/settings', label: 'Settings' },
]

export interface PrefsState {
  theme: ThemePreference
  sidebarCollapsed: boolean
  tableDensity: TableDensity
  landingPage: string
  defaultDatePreset: DatePreset
  dashboardWidgets: string[]
  dashboardHidden: string[]
  dismissedStockAlerts: string[]

  setTheme: (theme: ThemePreference) => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setDensity: (density: TableDensity) => void
  setLandingPage: (path: string) => void
  setDefaultDatePreset: (preset: DatePreset) => void
  setDashboardWidgets: (widgets: string[]) => void
  toggleWidget: (widgetId: string) => void
  reorderWidgets: (widgets: string[]) => void
  resetDashboard: () => void
  dismissStockAlert: (dismissKey: string) => void
  resetTableColumns: () => void
  resetAll: () => void
}

const defaultState = {
  theme: 'system' as ThemePreference,
  sidebarCollapsed: false,
  tableDensity: 'comfortable' as TableDensity,
  landingPage: '/dashboard',
  defaultDatePreset: 'this_month' as DatePreset,
  dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
  dashboardHidden: [] as string[],
  dismissedStockAlerts: [] as string[],
}

function parseDatePreset(value: unknown): DatePreset {
  const ids = DATE_PRESET_OPTIONS.map((p) => p.id)
  return typeof value === 'string' && ids.includes(value as DatePreset)
    ? (value as DatePreset)
    : 'this_month'
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setTheme: (theme) => set({ theme }),

      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setDensity: (tableDensity) => set({ tableDensity }),

      setLandingPage: (landingPage) => set({ landingPage }),

      setDefaultDatePreset: (defaultDatePreset) => set({ defaultDatePreset }),

      setDashboardWidgets: (dashboardWidgets) => set({ dashboardWidgets }),

      toggleWidget: (widgetId) => {
        const { dashboardWidgets, dashboardHidden } = get()
        if (dashboardWidgets.includes(widgetId)) {
          set({
            dashboardWidgets: dashboardWidgets.filter((id) => id !== widgetId),
            dashboardHidden: dashboardHidden.includes(widgetId)
              ? dashboardHidden
              : [...dashboardHidden, widgetId],
          })
          return
        }
        set({
          dashboardHidden: dashboardHidden.filter((id) => id !== widgetId),
          dashboardWidgets: [...dashboardWidgets, widgetId],
        })
      },

      reorderWidgets: (dashboardWidgets) => set({ dashboardWidgets }),

      resetDashboard: () =>
        set({
          dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
          dashboardHidden: [],
        }),

      dismissStockAlert: (dismissKey) => {
        const { dismissedStockAlerts } = get()
        if (dismissedStockAlerts.includes(dismissKey)) return
        set({ dismissedStockAlerts: [...dismissedStockAlerts, dismissKey] })
      },

      resetTableColumns: () => {
        clearTableColumnPrefs()
      },

      resetAll: () => {
        clearTableColumnPrefs()
        set({ ...defaultState })
      },
    }),
    {
      name: 'dms-sheetal-prefs-v1',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PrefsState>
        return {
          ...current,
          ...p,
          defaultDatePreset: parseDatePreset(p.defaultDatePreset ?? current.defaultDatePreset),
          landingPage:
            typeof p.landingPage === 'string' && p.landingPage.startsWith('/')
              ? p.landingPage
              : current.landingPage,
          dashboardWidgets: Array.isArray(p.dashboardWidgets)
            ? p.dashboardWidgets
            : current.dashboardWidgets,
          dashboardHidden: Array.isArray(p.dashboardHidden)
            ? p.dashboardHidden
            : current.dashboardHidden,
        }
      },
    },
  ),
)
