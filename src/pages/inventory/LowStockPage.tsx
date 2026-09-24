import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CodeCell } from '@/components/shared/RowActions'
import { Can } from '@/components/auth/Can'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { useDmsStore } from '@/store/dms-store'
import { formatNumber } from '@/utils/format'

export default function LowStockPage() {
  const allProducts = useDmsStore((s) => s.products)
  const products = useMemo(
    () => allProducts.filter((p) => p.status === 'active' && p.currentStock <= p.minimumStock),
    [allProducts],
  )

  return (
    <div>
      <PageHeader
        title="Low Stock"
        description="Products at or below minimum stock level"
        actions={
          <div className="flex flex-wrap gap-2">
            <Can module="stock" action="create">
              <Link to="/inventory/adjustment">
                <Button type="button" variant="outline" size="sm">
                  Adjust stock
                </Button>
              </Link>
            </Can>
            <Can module="purchase" action="create">
              <Link to="/transactions/purchases/new">
                <Button type="button" size="sm">
                  Create purchase
                </Button>
              </Link>
            </Can>
          </div>
        }
      />
      <DataTable
        data={products}
        getRowId={(r) => r.id}
        emptyModule="lowStock"
        columns={[
          {
            id: 'sku',
            header: 'SKU',
            accessor: 'sku',
            cell: (r) => <CodeCell value={r.sku} />,
          },
          { id: 'name', header: 'Product', accessor: 'name' },
          { id: 'stock', header: 'Current', cell: (r) => formatNumber(r.currentStock) },
          { id: 'min', header: 'Minimum', cell: (r) => formatNumber(r.minimumStock) },
          { id: 'status', header: 'Status', cell: () => <StatusBadge kind="stock" status="low_stock" /> },
        ]}
      />
    </div>
  )
}
