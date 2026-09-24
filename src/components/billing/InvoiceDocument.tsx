import type { BusinessSettings, Invoice } from '@/types'
import { cn } from '@/utils/cn'
import { formatCurrency, formatDate } from '@/utils/format'

export interface InvoiceDocumentProps {
  invoice: Invoice
  settings: BusinessSettings
  className?: string
  /** When true, sized for on-screen A4 preview inside a drawer */
  preview?: boolean
}

export function InvoiceDocument({ invoice, settings, className, preview = true }: InvoiceDocumentProps) {
  return (
    <article
      className={cn(
        'bg-white text-slate-900 shadow-sm [color-scheme:light]',
        preview &&
          'mx-auto w-full max-w-[210mm] origin-top scale-[0.92] rounded-sm border border-slate-200 sm:scale-100',
        className,
      )}
      data-invoice-preview
    >
      <div className="min-h-[297mm] p-8 sm:p-10">
        <header className="flex flex-col justify-between gap-6 border-b-2 border-slate-900 pb-5 sm:flex-row">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {settings.businessName}
            </h1>
            <p className="mt-1 max-w-sm text-xs text-slate-500">{settings.address}</p>
            <p className="text-xs text-slate-500">
              Phone {settings.phone} · {settings.email}
            </p>
            <p className="text-xs text-slate-500">
              GSTIN {settings.gstNumber} · PAN {settings.pan}
            </p>
          </div>
          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-800">TAX INVOICE</p>
            <p className="mt-1 text-base font-semibold">{invoice.invoiceNo}</p>
            <p className="text-xs text-slate-500">{formatDate(invoice.date, 'long')}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
              {invoice.status}
            </p>
          </div>
        </header>

        <section className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Bill to</p>
          <p className="mt-1 text-sm font-semibold">{invoice.customerName}</p>
          <p className="text-xs text-slate-500">{invoice.customerAddress || '—'}</p>
          {invoice.customerGst ? (
            <p className="text-xs text-slate-500">GSTIN {invoice.customerGst}</p>
          ) : null}
        </section>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2 font-semibold">Item</th>
                <th className="py-2 px-2 text-center font-semibold">Qty</th>
                <th className="py-2 px-2 text-right font-semibold">Rate</th>
                <th className="py-2 px-2 text-right font-semibold">Disc.</th>
                <th className="py-2 px-2 text-right font-semibold">GST</th>
                <th className="py-2 pl-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((line) => (
                <tr key={line.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-2 align-top">
                    <span className="font-medium text-slate-900">{line.productName}</span>
                    <br />
                    <span className="text-[11px] text-slate-500">{line.sku}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center align-top">{line.quantity}</td>
                  <td className="px-2 py-2.5 text-right align-top">{formatCurrency(line.rate)}</td>
                  <td className="px-2 py-2.5 text-right align-top">
                    {line.discount ? `${line.discount}%` : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-right align-top">{line.gstRate}%</td>
                  <td className="py-2.5 pl-2 text-right align-top font-medium">
                    {formatCurrency(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="ml-auto mt-6 w-full max-w-[260px] space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.discount ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Discount</span>
              <span>{formatCurrency(invoice.discount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">CGST</span>
            <span>{formatCurrency(invoice.cgst)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">SGST</span>
            <span>{formatCurrency(invoice.sgst)}</span>
          </div>
          {invoice.igst ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">IGST</span>
              <span>{formatCurrency(invoice.igst)}</span>
            </div>
          ) : null}
          {invoice.otherCharges ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Other charges</span>
              <span>{formatCurrency(invoice.otherCharges)}</span>
            </div>
          ) : null}
          {invoice.roundOff ? (
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Round off</span>
              <span>{formatCurrency(invoice.roundOff)}</span>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-slate-900 pt-2 text-sm font-semibold">
            <span>Grand total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-500">
            <span>Paid</span>
            <span>{formatCurrency(invoice.paid)}</span>
          </div>
          <div className="flex justify-between gap-4 font-medium">
            <span>Balance due</span>
            <span>{formatCurrency(invoice.balance)}</span>
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
          <p>Thank you for your business.</p>
          <p>This is a computer-generated invoice from {settings.businessName}.</p>
        </footer>
      </div>
    </article>
  )
}
