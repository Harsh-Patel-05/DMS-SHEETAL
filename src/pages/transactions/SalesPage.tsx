import { Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Sale } from '@/types'
import { Can } from '@/components/auth/Can'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  CodeCell,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { downloadCsv, formatInr, printHtmlDocument } from '@/utils/bulk-export'
import { resolveSaleFilterValue } from '@/utils/advanced-filter-resolvers'
import { formatCurrency, formatDate } from '@/utils/format'

export default function SalesPage() {
  const sales = useDmsStore((s) => s.sales)
  const settings = useDmsStore((s) => s.settings)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const getAdvancedFilterValue = useCallback(
    (row: Sale, fieldId: string) => resolveSaleFilterValue(row, fieldId),
    [],
  )

  const exportSales = (rows: Sale[]) => {
    downloadCsv(
      `sales-export-${rows.length}.csv`,
      ['Invoice', 'Date', 'Customer', 'Subtotal', 'Tax', 'Grand total', 'Paid', 'Due', 'Status'],
      rows.map((r) => [
        r.invoiceNo,
        r.date,
        r.customerName,
        String(r.subtotal),
        String(r.cgst + r.sgst + r.igst),
        String(r.grandTotal),
        String(r.paid),
        String(r.due),
        r.status,
      ]),
    )
    toast({ title: `Exported ${rows.length} sale(s)`, variant: 'success' })
  }

  const printSales = (rows: Sale[]) => {
    const body = rows
      .map(
        (r) => `
      <div class="doc">
        <h1>${settings.businessName} — Sale ${r.invoiceNo}</h1>
        <p class="muted">${formatDate(r.date, 'long')} · ${r.customerName} · Status: ${r.status}</p>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th class="right">Amount</th></tr></thead>
          <tbody>
            ${r.items
              .map(
                (line) =>
                  `<tr><td>${line.productName}<br/><span class="muted">${line.sku}</span></td><td>${line.quantity}</td><td>${formatInr(line.rate)}</td><td class="right">${formatInr(line.amount)}</td></tr>`,
              )
              .join('')}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${formatInr(r.subtotal)}</span></div>
          <div><span>Tax</span><span>${formatInr(r.cgst + r.sgst + r.igst)}</span></div>
          <div><strong>Grand total</strong><strong>${formatInr(r.grandTotal)}</strong></div>
          <div><span>Due</span><span>${formatInr(r.due)}</span></div>
        </div>
      </div>`,
      )
      .join('')
    const ok = printHtmlDocument(`Sales print (${rows.length})`, body)
    if (!ok) toast({ title: 'Allow pop-ups to print', variant: 'error' })
    else toast({ title: `Printing ${rows.length} sale(s)`, variant: 'success' })
  }

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Sales invoices, payment status, and dues"
        actions={
          <Can module="sales" action="create">
            <Link to="/transactions/sales/new">
              <Button type="button" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> New sale
              </Button>
            </Link>
          </Can>
        }
      />
      <DataTable
        data={sales}
        getRowId={(r) => r.id}
        emptyModule="sales"
        storageKey="sales"
        filterContextId={FILTER_CONTEXT.sales}
        getAdvancedFilterValue={getAdvancedFilterValue}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            id: 'export',
            label: 'Bulk export',
            variant: 'outline',
            onClick: (rows) => exportSales(rows),
          },
          {
            id: 'print',
            label: 'Bulk print',
            variant: 'outline',
            onClick: (rows) => printSales(rows),
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
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date), sortable: true, accessor: 'date' },
          { id: 'customer', header: 'Customer', accessor: 'customerName' },
          { id: 'total', header: 'Total', cell: (r) => formatCurrency(r.grandTotal) },
          {
            id: 'status',
            header: 'Status',
            accessor: 'status',
            getFilterValue: (r) => r.status,
            filterOptions: [
              { label: 'Draft', value: 'draft' },
              { label: 'Confirmed', value: 'confirmed' },
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
                viewLabel="View"
                onView={() => navigate(`/transactions/sales/${r.id}/edit`)}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
