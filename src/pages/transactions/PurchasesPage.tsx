import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import type { Purchase } from '@/types'
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
import { FILTER_CONTEXT } from '@/config/advanced-filter-presets'
import { useDmsStore } from '@/store/dms-store'
import { resolvePurchaseFilterValue } from '@/utils/advanced-filter-resolvers'
import { formatCurrency, formatDate } from '@/utils/format'

export default function PurchasesPage() {
  const purchases = useDmsStore((s) => s.purchases)
  const navigate = useNavigate()

  const getAdvancedFilterValue = useCallback(
    (row: Purchase, fieldId: string) => resolvePurchaseFilterValue(row, fieldId),
    [],
  )

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Purchase bills and supplier references"
        actions={
          <Can module="purchase" action="create">
            <Link to="/transactions/purchases/new">
              <Button type="button" size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> New purchase
              </Button>
            </Link>
          </Can>
        }
      />
      <DataTable
        data={purchases}
        getRowId={(r) => r.id}
        emptyModule="purchases"
        storageKey="purchases"
        filterContextId={FILTER_CONTEXT.purchases}
        getAdvancedFilterValue={getAdvancedFilterValue}
        columns={[
          {
            id: 'no',
            header: 'PO No',
            accessor: 'purchaseNo',
            sortable: true,
            sticky: 'left',
            cell: (r) => <CodeCell value={r.purchaseNo} />,
          },
          {
            id: 'date',
            header: 'Date',
            accessor: 'date',
            sortable: true,
            cell: (r) => formatDate(r.date),
          },
          { id: 'supplier', header: 'Supplier', accessor: 'supplierName' },
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
                onView={() => navigate(`/transactions/purchases/${r.id}/edit`)}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
