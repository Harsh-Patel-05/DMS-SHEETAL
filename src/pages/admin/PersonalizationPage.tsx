import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
  DASHBOARD_WIDGET_LABELS,
  DATE_PRESET_OPTIONS,
  DEFAULT_DASHBOARD_WIDGETS,
  LANDING_PAGE_OPTIONS,
  usePrefsStore,
  type TableDensity,
  type ThemePreference,
} from '@/store/prefs-store'
import type { DatePreset } from '@/utils/date-range'
import { listSavedTableColumnKeys } from '@/utils/table-prefs'
import { applyThemeClass } from '@/hooks/use-theme-sync'
import { cn } from '@/utils/cn'

export default function PersonalizationPage() {
  const theme = usePrefsStore((s) => s.theme)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const sidebarCollapsed = usePrefsStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = usePrefsStore((s) => s.setSidebarCollapsed)
  const tableDensity = usePrefsStore((s) => s.tableDensity)
  const setDensity = usePrefsStore((s) => s.setDensity)
  const landingPage = usePrefsStore((s) => s.landingPage)
  const setLandingPage = usePrefsStore((s) => s.setLandingPage)
  const defaultDatePreset = usePrefsStore((s) => s.defaultDatePreset)
  const setDefaultDatePreset = usePrefsStore((s) => s.setDefaultDatePreset)
  const dashboardWidgets = usePrefsStore((s) => s.dashboardWidgets)
  const toggleWidget = usePrefsStore((s) => s.toggleWidget)
  const resetDashboard = usePrefsStore((s) => s.resetDashboard)
  const resetTableColumns = usePrefsStore((s) => s.resetTableColumns)
  const resetAll = usePrefsStore((s) => s.resetAll)
  const { toast } = useToast()
  const [columnKeys, setColumnKeys] = useState(() => listSavedTableColumnKeys())

  const widgetIds = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const id of DEFAULT_DASHBOARD_WIDGETS) {
      if (!seen.has(id)) {
        seen.add(id)
        ordered.push(id)
      }
    }
    for (const id of dashboardWidgets) {
      if (!seen.has(id)) {
        seen.add(id)
        ordered.push(id)
      }
    }
    return ordered
  }, [dashboardWidgets])

  const refreshColumns = () => setColumnKeys(listSavedTableColumnKeys())

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalization"
        description="Customize theme, layout, dashboard, tables, and defaults. Preferences stay in this browser."
      />

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Theme</h2>
        <p className="text-xs text-ink-muted">
          Light and dark are separate designed systems — surfaces, charts, and status colors are tuned for contrast, not inverted.
        </p>
        <FormField label="Color theme">
          <Select
            value={theme}
            onChange={(e) => {
              const next = e.target.value as ThemePreference
              setTheme(next)
              applyThemeClass(next)
              toast({ title: 'Theme updated', variant: 'success' })
            }}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </Select>
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setTheme('light')
              applyThemeClass('light')
              toast({ title: 'Light theme', variant: 'success' })
            }}
            className={cn(
              'rounded-md border p-3 text-left transition-colors',
              theme === 'light'
                ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/40'
                : 'border-border bg-surface hover:border-border-strong',
            )}
          >
            <p className="text-sm font-semibold text-ink">Light</p>
            <p className="mt-1 text-xs text-ink-muted">Pink &amp; white canvas — Sheetal Food World accents</p>
            <div className="mt-3 flex gap-1.5">
              <span className="h-6 flex-1 rounded-sm bg-[#fff7fa] ring-1 ring-black/5" />
              <span className="h-6 flex-1 rounded-sm bg-white ring-1 ring-black/5" />
              <span className="h-6 flex-1 rounded-sm bg-[#ED217C]" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('dark')
              applyThemeClass('dark')
              toast({ title: 'Dark theme', variant: 'success' })
            }}
            className={cn(
              'rounded-md border p-3 text-left transition-colors',
              theme === 'dark'
                ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/40'
                : 'border-border bg-surface hover:border-border-strong',
            )}
          >
            <p className="text-sm font-semibold text-ink">Dark</p>
            <p className="mt-1 text-xs text-ink-muted">Deep plum canvas, lifted panels, luminous pink charts</p>
            <div className="mt-3 flex gap-1.5">
              <span className="h-6 flex-1 rounded-sm bg-[#140810] ring-1 ring-white/10" />
              <span className="h-6 flex-1 rounded-sm bg-[#1f1018] ring-1 ring-white/10" />
              <span className="h-6 flex-1 rounded-sm bg-[#ED217C]" />
            </div>
          </button>
        </div>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Sidebar</h2>
        <p className="text-xs text-ink-muted">
          Collapsed mode shows icons only on large screens. You can also toggle from the header.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={sidebarCollapsed ? 'outline' : 'primary'}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setSidebarCollapsed(false)
              toast({ title: 'Sidebar expanded', variant: 'info' })
            }}
          >
            <PanelLeftOpen className="h-4 w-4" />
            Expanded
          </Button>
          <Button
            type="button"
            variant={sidebarCollapsed ? 'primary' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setSidebarCollapsed(true)
              toast({ title: 'Sidebar collapsed', variant: 'info' })
            }}
          >
            <PanelLeftClose className="h-4 w-4" />
            Collapsed
          </Button>
        </div>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Dashboard widgets</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              resetDashboard()
              toast({ title: 'Dashboard widgets reset', variant: 'success' })
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset widgets
          </Button>
        </div>
        <p className="text-xs text-ink-muted">
          Choose which widgets appear on the dashboard. Order can also be adjusted on the dashboard itself.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {widgetIds.map((id) => (
            <Checkbox
              key={id}
              label={DASHBOARD_WIDGET_LABELS[id] ?? id}
              checked={dashboardWidgets.includes(id)}
              onChange={() => toggleWidget(id)}
            />
          ))}
        </div>
        <p className="text-xs text-ink-muted">
          Open the <Link className="text-brand-700 underline dark:text-brand-300" to="/dashboard">Dashboard</Link> to
          reorder widgets.
        </p>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Table density</h2>
        <FormField label="Row spacing">
          <Select
            value={tableDensity}
            onChange={(e) => {
              setDensity(e.target.value as TableDensity)
              toast({ title: 'Table density updated', variant: 'success' })
            }}
          >
            <option value="compact">Compact</option>
            <option value="comfortable">Comfortable</option>
            <option value="spacious">Spacious</option>
          </Select>
        </FormField>
        <p className="text-xs text-ink-muted">Applies as the default for all data tables (can still be changed per table toolbar).</p>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Columns</h2>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              resetTableColumns()
              refreshColumns()
              toast({
                title: 'Column layouts cleared',
                description: 'Reload list pages to see default columns.',
                variant: 'success',
              })
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset all columns
          </Button>
        </div>
        <p className="text-xs text-ink-muted">
          Column visibility and order are saved per table when you change them in the Columns menu.
        </p>
        {columnKeys.length === 0 ? (
          <p className="text-sm text-ink-muted">No saved column layouts yet.</p>
        ) : (
          <ul className="space-y-1 text-sm text-ink">
            {columnKeys.map((key) => (
              <li key={key} className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs">
                {key}
              </li>
            ))}
          </ul>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={refreshColumns}>
          Refresh list
        </Button>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Default date range</h2>
        <FormField label="Preferred preset">
          <Select
            value={defaultDatePreset}
            onChange={(e) => {
              setDefaultDatePreset(e.target.value as DatePreset)
              toast({ title: 'Default date range updated', variant: 'success' })
            }}
          >
            {DATE_PRESET_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </FormField>
        <p className="text-xs text-ink-muted">
          Used as the starting range on Dashboard, reports, and financial summary.
        </p>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Preferred landing page</h2>
        <FormField label="After sign-in">
          <Select
            value={landingPage}
            onChange={(e) => {
              setLandingPage(e.target.value)
              toast({ title: 'Landing page updated', variant: 'success' })
            }}
          >
            {LANDING_PAGE_OPTIONS.map((opt) => (
              <option key={opt.path} value={opt.path}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormField>
      </section>

      <section className="max-w-3xl space-y-3 rounded-md border border-border border-danger/30 bg-surface-elevated p-4">
        <h2 className="text-sm font-semibold text-ink">Reset</h2>
        <p className="text-xs text-ink-muted">
          Restores theme, sidebar, density, landing page, date preset, dashboard widgets, and clears saved column layouts.
        </p>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 text-danger"
          onClick={() => {
            resetAll()
            applyThemeClass('system')
            refreshColumns()
            toast({ title: 'Personalization reset', variant: 'info' })
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset all preferences
        </Button>
      </section>
    </div>
  )
}
