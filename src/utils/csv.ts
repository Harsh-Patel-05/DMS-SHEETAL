/** Minimal CSV parse/serialize for Import Center */

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = splitCsvLines(normalized).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = splitCsvRow(lines[0]).map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvRow(lines[i])
    if (cells.every((c) => !c.trim())) continue
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = (cells[idx] ?? '').trim()
    })
    rows.push(row)
  }

  return { headers, rows }
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      current += ch
      continue
    }
    if (ch === '\n' && !inQuotes) {
      lines.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.length) lines.push(current)
  return lines
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells
}

export function toCsv(headers: string[], rows: string[][]): string {
  const escape = (value: string) => {
    if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
    return value
  }
  return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n')
}
