import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns'

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'

export function rangeForPreset(preset: DatePreset, now = new Date()) {
  const today = format(now, 'yyyy-MM-dd')
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const d = format(subDays(now, 1), 'yyyy-MM-dd')
      return { from: d, to: d }
    }
    case 'this_week':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    case 'this_month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'last_month': {
      const prev = subMonths(now, 1)
      return {
        from: format(startOfMonth(prev), 'yyyy-MM-dd'),
        to: format(endOfMonth(prev), 'yyyy-MM-dd'),
      }
    }
    case 'this_year':
      return {
        from: format(startOfYear(now), 'yyyy-MM-dd'),
        to: format(endOfYear(now), 'yyyy-MM-dd'),
      }
  }
}

export function inDateRange(dateStr: string, from: string, to: string) {
  return dateStr >= from && dateStr <= to
}
