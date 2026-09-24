import fs from 'fs'
import path from 'path'

const base = path.resolve('src/pages')

function write(rel, content) {
  const file = path.join(base, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
  console.log('wrote', rel)
}

// Report pages - generic
const reports = [
  ['reports/SalesReportPage.tsx', 'Sales Report', 'sales'],
  ['reports/PurchasesReportPage.tsx', 'Purchase Report', 'purchases'],
  ['reports/StockReportPage.tsx', 'Stock Report', 'stock'],
  ['reports/StockValuationReportPage.tsx', 'Stock Valuation', 'stock-valuation'],
  ['reports/ProfitLossReportPage.tsx', 'Profit & Loss', 'profit-loss'],
  ['reports/ReceivablesReportPage.tsx', 'Outstanding Receivables', 'receivables'],
  ['reports/PayablesReportPage.tsx', 'Outstanding Payables', 'payables'],
  ['reports/GstReportPage.tsx', 'GST Summary', 'gst'],
  ['reports/CustomerLedgerReportPage.tsx', 'Customer Ledger', 'customer-ledger'],
  ['reports/DistributorLedgerReportPage.tsx', 'Distributor Ledger', 'distributor-ledger'],
  ['reports/SupplierLedgerReportPage.tsx', 'Supplier Ledger', 'supplier-ledger'],
  ['reports/PaymentsReportPage.tsx', 'Payment Report', 'payments'],
  ['reports/ExpensesReportPage.tsx', 'Expense Report', 'expenses'],
  ['reports/SalesReturnsReportPage.tsx', 'Sales Returns', 'sales-returns'],
  ['reports/PurchaseReturnsReportPage.tsx', 'Purchase Returns', 'purchase-returns'],
  ['reports/DailySummaryReportPage.tsx', 'Daily Summary', 'daily-summary'],
]

for (const [file, title] of reports) {
  const name = path.basename(file, '.tsx')
  write(
    file,
    `import { ReportShell } from '@/components/shared/ReportShell'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { useDmsStore } from '@/store/dms-store'
import { formatCurrency, formatDate } from '@/utils/format'

export default function ${name}() {
  const rows = useDmsStore((s) => s.sales)

  return (
    <ReportShell title="${title}" description="Live data from your workspace">
      {(range) => (
        <Card>
          <CardContent className="pt-4">
            <DataTable
              data={rows.filter((r) => r.date >= range.from && r.date <= range.to).slice(0, 50)}
              getRowId={(r) => r.id}
              columns={[
                { id: 'no', header: 'Doc', accessor: 'invoiceNo' },
                { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
                { id: 'party', header: 'Party', accessor: 'customerName' },
                { id: 'total', header: 'Total', cell: (r) => formatCurrency(r.grandTotal) },
              ]}
              emptyTitle="No records in range"
            />
          </CardContent>
        </Card>
      )}
    </ReportShell>
  )
}
`,
  )
}

console.log('done reports', reports.length)
