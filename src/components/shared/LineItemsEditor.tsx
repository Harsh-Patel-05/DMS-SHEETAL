import { Plus, Trash2 } from 'lucide-react'
import type { Product } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useDmsStore } from '@/store/dms-store'
import { calculateLineAmount } from '@/utils/calculations'
import { formatCurrency } from '@/utils/format'

export interface LineItemDraft {
  productId: string
  productName: string
  sku: string
  quantity: number
  rate: number
  discount: number
  gstRate: number
  notes?: string
}

export interface LineItemsEditorProps {
  items: LineItemDraft[]
  products: Product[]
  onChange: (items: LineItemDraft[]) => void
  rateField?: 'sellingPrice' | 'purchasePrice'
  showStock?: boolean
}

export function LineItemsEditor({
  items,
  products,
  onChange,
  rateField = 'sellingPrice',
  showStock = false,
}: LineItemsEditorProps) {
  const gstRates = useDmsStore((s) => s.gstRates)
  const stockByProductId = useDmsStore((s) => s.products)

  const gstFor = (product: Product) => gstRates.find((g) => g.id === product.gstRateId)?.rate ?? 18

  const addRow = () => {
    const p = products[0]
    if (!p) return
    onChange([
      ...items,
      {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        quantity: 1,
        rate: p[rateField],
        discount: 0,
        gstRate: gstFor(p),
      },
    ])
  }

  const update = (index: number, patch: Partial<LineItemDraft>) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const onProductPick = (index: number, productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p) return
    update(index, {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      rate: p[rateField],
      gstRate: gstFor(p),
    })
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-2 py-2">Product</th>
              {showStock ? <th className="px-2 py-2 w-20 text-right">Stock</th> : null}
              <th className="px-2 py-2 w-24">Qty</th>
              <th className="px-2 py-2 w-28">Rate</th>
              <th className="px-2 py-2 w-24">Disc.</th>
              <th className="px-2 py-2 w-20">GST%</th>
              <th className="px-2 py-2 w-28 text-right">Amount</th>
              <th className="px-2 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const stock = stockByProductId.find((p) => p.id === row.productId)?.currentStock
              return (
              <tr key={`${row.productId}-${index}`} className="border-t border-border">
                <td className="px-2 py-1.5">
                  <Select value={row.productId} onChange={(e) => onProductPick(index, e.target.value)}>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </Select>
                </td>
                {showStock ? (
                  <td className="px-2 py-1.5 text-right tabular-nums text-ink-muted">
                    {stock !== undefined ? stock : '—'}
                  </td>
                ) : null}
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => update(index, { quantity: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.rate}
                    onChange={(e) => update(index, { rate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.discount}
                    onChange={(e) => update(index, { discount: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min={0}
                    value={row.gstRate}
                    onChange={(e) => update(index, { gstRate: Number(e.target.value) || 0 })}
                  />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {formatCurrency(calculateLineAmount(row.quantity, row.rate, row.discount))}
                </td>
                <td className="px-2 py-1.5">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addRow}>
        <Plus className="h-4 w-4" />
        Add line
      </Button>
    </div>
  )
}
