import type { BusinessSettings, Invoice } from '@/types'
import { formatInr } from '@/utils/bulk-export'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatLongDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function buildInvoiceDocumentHtml(invoice: Invoice, settings: BusinessSettings) {
  const rows = invoice.items
    .map(
      (line) => `
      <tr>
        <td>
          <strong>${escapeHtml(line.productName)}</strong>
          <div class="muted">${escapeHtml(line.sku)}</div>
        </td>
        <td class="center">${line.quantity}</td>
        <td class="right">${formatInr(line.rate)}</td>
        <td class="right">${line.discount ? `${line.discount}%` : '—'}</td>
        <td class="right">${line.gstRate}%</td>
        <td class="right">${formatInr(line.amount)}</td>
      </tr>`,
    )
    .join('')

  return `
  <article class="invoice-a4">
    <header class="inv-head">
      <div>
        <h1>${escapeHtml(settings.businessName)}</h1>
        <p class="muted">${escapeHtml(settings.address)}</p>
        <p class="muted">Phone ${escapeHtml(settings.phone)} · ${escapeHtml(settings.email)}</p>
        <p class="muted">GSTIN ${escapeHtml(settings.gstNumber)} · PAN ${escapeHtml(settings.pan)}</p>
      </div>
      <div class="inv-meta">
        <p class="badge">TAX INVOICE</p>
        <p><strong>${escapeHtml(invoice.invoiceNo)}</strong></p>
        <p class="muted">${formatLongDate(invoice.date)}</p>
        <p class="status">${escapeHtml(invoice.status.toUpperCase())}</p>
      </div>
    </header>

    <section class="bill-to">
      <p class="label">Bill to</p>
      <p class="party">${escapeHtml(invoice.customerName)}</p>
      <p class="muted">${escapeHtml(invoice.customerAddress || '—')}</p>
      ${invoice.customerGst ? `<p class="muted">GSTIN ${escapeHtml(invoice.customerGst)}</p>` : ''}
    </section>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="center">Qty</th>
          <th class="right">Rate</th>
          <th class="right">Disc.</th>
          <th class="right">GST</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <section class="totals">
      <div><span>Subtotal</span><span>${formatInr(invoice.subtotal)}</span></div>
      ${invoice.discount ? `<div><span>Discount</span><span>${formatInr(invoice.discount)}</span></div>` : ''}
      <div><span>CGST</span><span>${formatInr(invoice.cgst)}</span></div>
      <div><span>SGST</span><span>${formatInr(invoice.sgst)}</span></div>
      ${invoice.igst ? `<div><span>IGST</span><span>${formatInr(invoice.igst)}</span></div>` : ''}
      ${invoice.otherCharges ? `<div><span>Other charges</span><span>${formatInr(invoice.otherCharges)}</span></div>` : ''}
      ${invoice.roundOff ? `<div><span>Round off</span><span>${formatInr(invoice.roundOff)}</span></div>` : ''}
      <div class="grand"><span>Grand total</span><span>${formatInr(invoice.grandTotal)}</span></div>
      <div><span>Paid</span><span>${formatInr(invoice.paid)}</span></div>
      <div><span>Balance due</span><span>${formatInr(invoice.balance)}</span></div>
    </section>

    <footer class="inv-foot">
      <p class="muted">Thank you for your business.</p>
      <p class="muted">This is a computer-generated invoice from ${escapeHtml(settings.businessName)}.</p>
    </footer>
  </article>`
}

export const INVOICE_PRINT_STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #0f172a;
    background: #fff;
  }
  .invoice-a4 {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 12mm;
    background: #fff;
  }
  .inv-head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
  .inv-head h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: -0.02em; }
  .muted { color: #64748b; font-size: 12px; margin: 2px 0; }
  .inv-meta { text-align: right; }
  .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin: 0 0 6px; }
  .status { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
  .bill-to { margin: 18px 0; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 4px; }
  .party { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  .center { text-align: center; }
  .right { text-align: right; }
  .totals { margin-left: auto; margin-top: 16px; width: 260px; font-size: 12px; }
  .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; }
  .totals .grand { font-size: 14px; font-weight: 700; border-top: 1px solid #0f172a; margin-top: 6px; padding-top: 8px; }
  .inv-foot { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
`

export function printInvoiceDocument(invoice: Invoice, settings: BusinessSettings) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!win) return false
  const title = `Invoice ${invoice.invoiceNo}`
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>${INVOICE_PRINT_STYLES}</style>
  </head><body>${buildInvoiceDocumentHtml(invoice, settings)}</body></html>`)
  win.document.close()
  win.focus()
  win.print()
  return true
}

export function downloadInvoiceHtml(invoice: Invoice, settings: BusinessSettings) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invoice.invoiceNo}</title>
    <style>${INVOICE_PRINT_STYLES}</style>
  </head><body>${buildInvoiceDocumentHtml(invoice, settings)}</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${invoice.invoiceNo.replace(/[^\w.-]+/g, '_')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export async function shareInvoiceDocument(
  invoice: Invoice,
  settings: BusinessSettings,
  pageUrl: string,
): Promise<'shared' | 'copied' | 'failed'> {
  const summary = `${settings.businessName} — Invoice ${invoice.invoiceNo}\nAmount: ${formatInr(invoice.grandTotal)}\nBalance: ${formatInr(invoice.balance)}\n${pageUrl}`

  try {
    if (navigator.share) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invoice.invoiceNo}</title>
        <style>${INVOICE_PRINT_STYLES}</style>
      </head><body>${buildInvoiceDocumentHtml(invoice, settings)}</body></html>`
      const file = new File([html], `${invoice.invoiceNo.replace(/[^\w.-]+/g, '_')}.html`, {
        type: 'text/html',
      })
      const canShareFiles = !navigator.canShare || navigator.canShare({ files: [file] })
      if (canShareFiles) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNo}`,
          text: summary,
          files: [file],
        })
        return 'shared'
      }
      await navigator.share({
        title: `Invoice ${invoice.invoiceNo}`,
        text: summary,
        url: pageUrl,
      })
      return 'shared'
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
  }

  try {
    await navigator.clipboard.writeText(summary)
    return 'copied'
  } catch {
    return 'failed'
  }
}
