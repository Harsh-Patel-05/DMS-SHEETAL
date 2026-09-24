import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { Product } from '@/types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { CodeCell } from '@/components/shared/RowActions'
import { usePermission } from '@/hooks/use-permission'
import { useDmsStore } from '@/store/dms-store'
import { downloadCsv } from '@/utils/bulk-export'
import { formatCurrency, formatNumber } from '@/utils/format'
import InventoryOverviewPage from './InventoryOverviewPage'

function stockStatus(p: Product) {
  if (p.currentStock <= 0) return 'out_of_stock' as const
  if (p.currentStock <= p.minimumStock) return 'low_stock' as const
  return 'in_stock' as const
}

function CurrentStockTable() {
  const products = useDmsStore((s) => s.products)
  const adjustStock = useDmsStore((s) => s.adjustStock)
  const { canCreate } = usePermission('stock')
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pendingRows, setPendingRows] = useState<Product[]>([])
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease'>('increase')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Bulk stock correction')

  const exportStock = (rows: Product[]) => {
    downloadCsv(
      `inventory-export-${rows.length}.csv`,
      ['SKU', 'Product', 'Qty', 'Min', 'Value', 'Purchase price', 'Status'],
      rows.map((r) => [
        r.sku,
        r.name,
        String(r.currentStock),
        String(r.minimumStock),
        String(r.currentStock * r.purchasePrice),
        String(r.purchasePrice),
        stockStatus(r),
      ]),
    )
    toast({ title: `Exported ${rows.length} SKU(s)`, variant: 'success' })
  }

  const runBulkAdjust = () => {
    let okCount = 0
    let failCount = 0
    for (const p of pendingRows) {
      const result = adjustStock({
        productId: p.id,
        adjustmentType,
        quantity,
        reason: reason.trim() || 'Bulk stock adjustment',
      })
      if (result.ok) okCount += 1
      else failCount += 1
    }
    setConfirmOpen(false)
    setAdjustOpen(false)
    setSelectedIds([])
    toast({
      title: `Adjusted ${okCount} SKU(s)`,
      description: failCount ? `${failCount} failed (check stock rules).` : undefined,
      variant: failCount ? 'error' : 'success',
    })
  }

  const allowStockCreate = canCreate()

  const bulkActions = useMemo(
    () => [
      {
        id: 'export',
        label: 'Bulk export',
        variant: 'outline' as const,
        onClick: (rows: Product[]) => exportStock(rows),
      },
      ...(allowStockCreate
        ? [
            {
              id: 'adjust',
              label: 'Bulk stock adjustment',
              variant: 'outline' as const,
              onClick: (rows: Product[]) => {
                setPendingRows(rows)
                setAdjustmentType('increase')
                setQuantity(1)
                setReason('Bulk stock correction')
                setAdjustOpen(true)
              },
            },
          ]
        : []),
    ],
    [allowStockCreate],
  )

  return (
    <>
      <DataTable
        data={products}
        getRowId={(r) => r.id}
        emptyModule="stock"
        storageKey="inventory-stock"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        columns={[
          {
            id: 'sku',
            header: 'SKU',
            accessor: 'sku',
            sticky: 'left',
            cell: (r) => <CodeCell value={r.sku} />,
          },
          { id: 'name', header: 'Product', accessor: 'name', sortable: true },
          { id: 'stock', header: 'Qty', cell: (r) => formatNumber(r.currentStock) },
          { id: 'min', header: 'Min', cell: (r) => formatNumber(r.minimumStock) },
          {
            id: 'value',
            header: 'Value',
            cell: (r) => formatCurrency(r.currentStock * r.purchasePrice),
          },
          {
            id: 'status',
            header: 'Status',
            getFilterValue: (r) => stockStatus(r),
            filterOptions: [
              { label: 'In stock', value: 'in_stock' },
              { label: 'Low stock', value: 'low_stock' },
              { label: 'Out of stock', value: 'out_of_stock' },
            ],
            cell: (r) => <StatusBadge kind="stock" status={stockStatus(r)} />,
          },
        ]}
      />

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Bulk stock adjustment"
        description={`Apply the same adjustment to ${pendingRows.length} selected SKU(s).`}
        size="sm"
      >
        <div className="space-y-3">
          <FormField label="Adjustment type">
            <Select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as 'increase' | 'decrease')}
            >
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
            </Select>
          </FormField>
          <FormField label="Quantity (each SKU)">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </FormField>
          <FormField label="Reason">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[72px]" />
          </FormField>
          <p className="text-xs text-ink-muted">
            {adjustmentType === 'decrease'
              ? 'Decreases require confirmation — stock rules and allow-negative setting still apply.'
              : 'Increases will add the quantity to each selected product.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={adjustmentType === 'decrease' ? 'danger' : 'primary'}
              onClick={() => setConfirmOpen(true)}
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm bulk stock adjustment?"
        description={`You are about to ${adjustmentType} stock by ${quantity} unit(s) for ${pendingRows.length} product(s).`}
        variant={adjustmentType === 'decrease' ? 'danger' : 'default'}
        confirmLabel="Apply adjustment"
        onConfirm={runBulkAdjust}
      />
    </>
  )
}

export default function StockPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const tabFromPath = location.pathname.includes('/overview') ? 'overview' : 'stock'
  const [tab, setTab] = useState(tabFromPath)

  useEffect(() => {
    setTab(tabFromPath)
  }, [tabFromPath])

  const onTabChange = (value: string) => {
    setTab(value)
    navigate(value === 'overview' ? '/inventory/overview' : '/inventory/stock', { replace: true })
  }

  return (
    <div>
      <PageHeader title="Inventory" description="Inventory control center — health, aging, and movement" />
      <Tabs value={tab} onValueChange={onTabChange} className="mt-1">
        <TabsList className="mb-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock">Current Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <InventoryOverviewPage />
        </TabsContent>
        <TabsContent value="stock">
          <CurrentStockTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
