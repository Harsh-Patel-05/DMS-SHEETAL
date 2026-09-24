/** Shared Recharts styling that follows CSS theme tokens (light + dark). */

export const CHART_COLORS = {
  1: 'var(--chart-1)',
  2: 'var(--chart-2)',
  3: 'var(--chart-3)',
  4: 'var(--chart-4)',
  5: 'var(--chart-5)',
} as const

export const CHART_GRID_STROKE = 'var(--chart-grid)'
export const CHART_AXIS_STROKE = 'var(--chart-axis)'

export const CHART_TICK = { fontSize: 11, fill: 'var(--chart-tick)' } as const
export const CHART_TICK_SM = { fontSize: 10, fill: 'var(--chart-tick)' } as const

export const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: 'var(--chart-tooltip-bg)',
    border: '1px solid var(--chart-tooltip-border)',
    borderRadius: 8,
    color: 'var(--color-ink)',
    boxShadow: 'var(--shadow-elevated)',
  },
  labelStyle: { color: 'var(--color-ink-muted)' },
  itemStyle: { color: 'var(--color-ink)' },
  cursor: { fill: 'color-mix(in srgb, var(--color-brand-400) 10%, transparent)' },
} as const
