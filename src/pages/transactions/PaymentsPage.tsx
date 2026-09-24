import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Payment } from '@/types'
import { CodeCell } from '@/components/shared/RowActions'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { useDmsStore } from '@/store/dms-store'
import { resolvePaymentFilterValue } from '@/utils/advanced-filter-resolvers'
import { formatCurrency, formatDate } from '@/utils/format'

export default function PaymentsPage() {
  const payments = useDmsStore((s) => s.payments)

  const getAdvancedFilterValue = useCallback(
    (row: Payment, fieldId: string) => resolvePaymentFilterValue(row, fieldId),
    [],
  )

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Money received from customers and parties"
        actions={
          <Can module="payments" action="create">
            <Link to="/transactions/payments/new">
              <Button type="button" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Record payment
              </Button>
            </Link>
          </Can>
        }
      />
      <DataTable
        data={payments}
        getRowId={(r) => r.id}
        emptyModule="payments"
        storageKey="payments"
        filterContextId={FILTER_CONTEXT.payments}
        getAdvancedFilterValue={getAdvancedFilterValue}
        columns={[
          {
            id: 'no',
            header: 'Payment #',
            accessor: 'paymentNo',
            sortable: true,
            sticky: 'left',
            cell: (r) => <CodeCell value={r.paymentNo} />,
          },
          {
            id: 'date',
            header: 'Date',
            accessor: 'date',
            sortable: true,
            cell: (r) => formatDate(r.date),
          },
          {
            id: 'type',
            header: 'Type',
            accessor: 'type',
            getFilterValue: (r) => r.type,
            filterOptions: [
              { label: 'Received', value: 'received' },
              { label: 'Paid', value: 'paid' },
            ],
          },
          { id: 'party', header: 'Party', accessor: 'partyName' },
          {
            id: 'method',
            header: 'Method',
            accessor: 'method',
            getFilterValue: (r) => r.method,
            filterOptions: [
              { label: 'Cash', value: 'cash' },
              { label: 'UPI', value: 'upi' },
              { label: 'Bank transfer', value: 'bank_transfer' },
              { label: 'Cheque', value: 'cheque' },
              { label: 'Card', value: 'card' },
              { label: 'Other', value: 'other' },
            ],
          },
          { id: 'amount', header: 'Amount', cell: (r) => formatCurrency(r.amount) },
          {
            id: 'allocation',
            header: 'Allocation',
            cell: (r) => {
              if (!r.allocations?.length) {
                return <span className="text-ink-muted">—</span>
              }
              const allocated = r.allocations.reduce((s, a) => s + a.amount, 0)
              const unalloc = r.unallocated ?? Math.max(0, r.amount - allocated)
              return (
                <div className="text-xs leading-snug">
                  <div className="tabular-nums">
                    Allocated {formatCurrency(allocated)}
                    {unalloc > 0 ? ` · Unalloc. ${formatCurrency(unalloc)}` : ''}
                  </div>
                  <div className="text-ink-muted">
                    {r.allocations.map((a) => `${a.invoiceNo} → ${formatCurrency(a.amount)}`).join(', ')}
                  </div>
                </div>
              )
            },
          },
        ]}
      />
    </div>
  )
}
