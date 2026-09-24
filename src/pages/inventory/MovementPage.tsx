import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { useDmsStore } from '@/store/dms-store'
import { formatDate, formatNumber } from '@/utils/format'

export default function MovementPage() {
  const movements = useDmsStore((s) => s.movements)

  return (
    <div>
      <PageHeader
        title="Stock Movement"
        description="History of stock ins, outs, and balances"
      />
      <DataTable
        data={movements}
        getRowId={(r) => r.id}
        emptyModule="stock"
        emptyTitle="No stock movements yet"
        emptyDescription="Movements appear when you buy, sell, adjust, or transfer stock."
        columns={[
          { id: 'date', header: 'Date', cell: (r) => formatDate(r.date) },
          { id: 'product', header: 'Product', accessor: 'productName' },
          { id: 'type', header: 'Type', accessor: 'type' },
          { id: 'ref', header: 'Reference', accessor: 'reference' },
          { id: 'in', header: 'In', cell: (r) => formatNumber(r.quantityIn) },
          { id: 'out', header: 'Out', cell: (r) => formatNumber(r.quantityOut) },
          { id: 'bal', header: 'Balance', cell: (r) => formatNumber(r.balance) },
        ]}
      />
    </div>
  )
}
