/** Shared CSV / print helpers for bulk table actions */

export function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function printHtmlDocument(title: string, bodyHtml: string) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720')
  if (!win) return false
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 20px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      .doc { page-break-after: always; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
      .doc:last-child { page-break-after: auto; border-bottom: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; }
      .muted { color: #64748b; font-size: 12px; }
      .right { text-align: right; }
      .totals { margin-left: auto; max-width: 240px; margin-top: 12px; font-size: 12px; }
      .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 2px 0; }
    </style>
  </head><body>${bodyHtml}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}

export function formatInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
}
