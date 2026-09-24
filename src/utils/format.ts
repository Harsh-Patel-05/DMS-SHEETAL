export function formatCurrency(value: number, showSymbol = true): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
  return showSymbol ? `₹${formatted}` : formatted
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatDate(date: string | Date, pattern: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  if (pattern === 'long') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  if (pattern === 'datetime') {
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`
}
