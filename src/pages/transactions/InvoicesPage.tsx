import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice } from '@/types'
import { InvoicePreviewDrawer } from '@/components/billing/InvoicePreviewDrawer'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/toast'
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { useDmsStore } from '@/store/dms-store'
import { downloadCsv } from '@/utils/bulk-export'
import { resolveInvoiceFilterValue } from '@/utils/advanced-filter-resolvers'
import { buildInvoiceDocumentHtml, INVOICE_PRINT_STYLES } from '@/utils/invoice-document'
import { formatCurrency, formatDate } from '@/utils/format'

export default function InvoicesPage() {
  const invoices = useDmsStore((s) => s.invoices)
  const settings = useDmsStore((s) => s.settings)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)

  const previewInvoice = useMemo(
    () => (previewId ? invoices.find((i) => i.id === previewId) ?? null : null),
    [invoices, previewId],
  )

  const getAdvancedFilterValue = useCallback(
    (row: Invoice, fieldId: string) => resolveInvoiceFilterValue(row, fieldId),
    [],
  )

  const exportInvoices = (rows: Invoice[]) => {
    downloadCsv(
      `invoices-export-${rows.length}.csv`,
      ['Invoice', 'Date', 'Customer', 'Subtotal', 'CGST', 'SGST', 'Grand total', 'Paid', 'Balance', 'Status'],
      rows.map((r) => [
        r.invoiceNo,
        r.date,
        r.customerName,
        String(r.subtotal),
        String(r.cgst),
        String(r.sgst),
        String(r.grandTotal),
        String(r.paid),
        String(r.balance),
        r.status,
      ]),
    )
    toast({ title: `Exported ${rows.length} invoice(s)`, variant: 'success' })
  }

  const printInvoices = (rows: Invoice[]) => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
    if (!win) {
      toast({ title: 'Allow pop-ups to print', variant: 'error' })
      return
    }
    const body = rows.map((inv) => buildInvoiceDocumentHtml(inv, settings)).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Invoices print</title>
      <style>${INVOICE_PRINT_STYLES}
        .invoice-a4 { page-break-after: always; }
        .invoice-a4:last-child { page-break-after: auto; }
      </style>
    </head><body>${body}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
    toast({ title: `Printing ${rows.length} invoice(s)`, variant: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Tax invoices — preview A4 before print, download, or share"
      />
      <DataTable
        data={invoices}
        getRowId={(r) => r.id}
        emptyModule="invoices"
        storageKey="invoices"
        filterContextId={FILTER_CONTEXT.invoices}
        getAdvancedFilterValue={getAdvancedFilterValue}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            id: 'export',
            label: 'Bulk export',
            variant: 'outline',
            onClick: (rows) => exportInvoices(rows),
          },
          {
            id: 'print',
            label: 'Bulk print',
            variant: 'outline',
            onClick: (rows) => printInvoices(rows),
          },
        ]}
        columns={[
          {
            id: 'no',
            header: 'Invoice',
            accessor: 'invoiceNo',
            sortable: true,
            sticky: 'left',
            cell: (r) => <CodeCell value={r.invoiceNo} />,
          },
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date), accessor: 'date', sortable: true },
          { id: 'customer', header: 'Customer', accessor: 'customerName' },
          { id: 'total', header: 'Total', cell: (r) => formatCurrency(r.grandTotal) },
          { id: 'balance', header: 'Balance', cell: (r) => formatCurrency(r.balance) },
          {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            getFilterValue: (r) => r.status,
            filterOptions: [
              { label: 'Paid', value: 'paid' },
              { label: 'Partial', value: 'partial' },
              { label: 'Unpaid', value: 'unpaid' },
              { label: 'Cancelled', value: 'cancelled' },
            ],
            cell: (r) => <StatusBadge kind="doc" status={r.status} />,
          },
          {
            id: 'actions',
            header: ACTION_COLUMN_HEADER,
            headerClassName: ACTION_COLUMN_HEADER_CLASS,
            className: ACTION_COLUMN_CLASS,
            hideable: false,
            sticky: 'right',
            cell: (r) => (
              <RowActions
                onView={() => navigate(`/transactions/invoices/${r.id}`)}
                more={[
                  {
                    id: 'preview',
                    label: 'Preview',
                    onClick: () => setPreviewId(r.id),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      <InvoicePreviewDrawer
        open={Boolean(previewId)}
        invoice={previewInvoice}
        onClose={() => setPreviewId(null)}
        onCancelled={() => setPreviewId(null)}
      />
    </div>
  )
}
