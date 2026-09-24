import type {
  ReportColumnDef,
  ReportDefinition,
  ReportFilterCondition,
  ReportGroupBy,
  ReportTypeId,
} from '@/types/report-builder'
import type { DatePreset } from '@/utils/date-range'
import { rangeForPreset } from '@/utils/date-range'

export const REPORT_TYPE_OPTIONS: Array<{ id: ReportTypeId; label: string; description: string }> = [
  { id: 'sales', label: 'Sales Report', description: 'Confirmed sales and invoice totals' },
  { id: 'purchases', label: 'Purchase Report', description: 'Purchase orders and supplier spend' },
  { id: 'payments', label: 'Payment Report', description: 'Money in and money out' },
  { id: 'stock', label: 'Stock Report', description: 'Current inventory by product' },
  { id: 'expenses', label: 'Expense Report', description: 'Business expenses by category' },
]

export const SALES_COLUMNS: ReportColumnDef[] = [
  { id: 'date', label: 'Date', valueType: 'date' },
  { id: 'invoiceNo', label: 'Invoice', valueType: 'text' },
  { id: 'customer', label: 'Customer', valueType: 'text' },
  { id: 'distributor', label: 'Distributor', valueType: 'text' },
  { id: 'product', label: 'Product', valueType: 'text' },
  { id: 'sku', label: 'SKU', valueType: 'text', detailOnly: true },
  { id: 'quantity', label: 'Qty', valueType: 'number', aggregatable: true },
  { id: 'subtotal', label: 'Subtotal', valueType: 'currency', aggregatable: true },
  { id: 'tax', label: 'Tax', valueType: 'currency', aggregatable: true },
  { id: 'grandTotal', label: 'Grand total', valueType: 'currency', aggregatable: true },
  { id: 'paid', label: 'Paid', valueType: 'currency', aggregatable: true },
  { id: 'due', label: 'Due', valueType: 'currency', aggregatable: true },
  { id: 'status', label: 'Status', valueType: 'text' },
  { id: 'count', label: 'Docs', valueType: 'number', aggregatable: true },
]

export const PURCHASE_COLUMNS: ReportColumnDef[] = [
  { id: 'date', label: 'Date', valueType: 'date' },
  { id: 'purchaseNo', label: 'PO No', valueType: 'text' },
  { id: 'supplier', label: 'Supplier', valueType: 'text' },
  { id: 'product', label: 'Product', valueType: 'text' },
  { id: 'quantity', label: 'Qty', valueType: 'number', aggregatable: true },
  { id: 'grandTotal', label: 'Grand total', valueType: 'currency', aggregatable: true },
  { id: 'paid', label: 'Paid', valueType: 'currency', aggregatable: true },
  { id: 'due', label: 'Due', valueType: 'currency', aggregatable: true },
  { id: 'status', label: 'Status', valueType: 'text' },
  { id: 'count', label: 'Docs', valueType: 'number', aggregatable: true },
]

export const PAYMENT_COLUMNS: ReportColumnDef[] = [
  { id: 'date', label: 'Date', valueType: 'date' },
  { id: 'paymentNo', label: 'Payment #', valueType: 'text' },
  { id: 'party', label: 'Party', valueType: 'text' },
  { id: 'type', label: 'Type', valueType: 'text' },
  { id: 'method', label: 'Method', valueType: 'text' },
  { id: 'amount', label: 'Amount', valueType: 'currency', aggregatable: true },
  { id: 'count', label: 'Count', valueType: 'number', aggregatable: true },
]

export const STOCK_COLUMNS: ReportColumnDef[] = [
  { id: 'sku', label: 'SKU', valueType: 'text' },
  { id: 'product', label: 'Product', valueType: 'text' },
  { id: 'category', label: 'Category', valueType: 'text' },
  { id: 'brand', label: 'Brand', valueType: 'text' },
  { id: 'stock', label: 'Stock', valueType: 'number', aggregatable: true },
  { id: 'stockValue', label: 'Stock value', valueType: 'currency', aggregatable: true },
  { id: 'status', label: 'Status', valueType: 'text' },
  { id: 'count', label: 'SKUs', valueType: 'number', aggregatable: true },
]

export const EXPENSE_COLUMNS: ReportColumnDef[] = [
  { id: 'date', label: 'Date', valueType: 'date' },
  { id: 'category', label: 'Category', valueType: 'text' },
  { id: 'description', label: 'Description', valueType: 'text' },
  { id: 'method', label: 'Method', valueType: 'text' },
  { id: 'amount', label: 'Amount', valueType: 'currency', aggregatable: true },
  { id: 'count', label: 'Count', valueType: 'number', aggregatable: true },
]

export function columnsForReportType(type: ReportTypeId): ReportColumnDef[] {
  switch (type) {
    case 'sales':
      return SALES_COLUMNS
    case 'purchases':
      return PURCHASE_COLUMNS
    case 'payments':
      return PAYMENT_COLUMNS
    case 'stock':
      return STOCK_COLUMNS
    case 'expenses':
      return EXPENSE_COLUMNS
  }
}

export function groupByOptionsForType(type: ReportTypeId): Array<{ id: ReportGroupBy; label: string }> {
  switch (type) {
    case 'sales':
      return [
        { id: 'none', label: 'No grouping (detail)' },
        { id: 'customer', label: 'Customer' },
        { id: 'product', label: 'Product' },
        { id: 'date', label: 'Date' },
        { id: 'distributor', label: 'Distributor' },
        { id: 'status', label: 'Status' },
      ]
    case 'purchases':
      return [
        { id: 'none', label: 'No grouping (detail)' },
        { id: 'supplier', label: 'Supplier' },
        { id: 'product', label: 'Product' },
        { id: 'date', label: 'Date' },
        { id: 'status', label: 'Status' },
      ]
    case 'payments':
      return [
        { id: 'none', label: 'No grouping (detail)' },
        { id: 'date', label: 'Date' },
        { id: 'method', label: 'Method' },
        { id: 'status', label: 'Type' },
      ]
    case 'stock':
      return [
        { id: 'none', label: 'No grouping (detail)' },
        { id: 'category', label: 'Category' },
        { id: 'status', label: 'Status' },
      ]
    case 'expenses':
      return [
        { id: 'none', label: 'No grouping (detail)' },
        { id: 'category', label: 'Category' },
        { id: 'date', label: 'Date' },
        { id: 'method', label: 'Method' },
      ]
  }
}

export function defaultColumnsForType(type: ReportTypeId): string[] {
  switch (type) {
    case 'sales':
      return ['date', 'invoiceNo', 'customer', 'grandTotal', 'paid', 'due', 'status']
    case 'purchases':
      return ['date', 'purchaseNo', 'supplier', 'grandTotal', 'paid', 'due', 'status']
    case 'payments':
      return ['date', 'paymentNo', 'party', 'type', 'method', 'amount']
    case 'stock':
      return ['sku', 'product', 'category', 'stock', 'stockValue', 'status']
    case 'expenses':
      return ['date', 'category', 'description', 'amount', 'method']
  }
}

export function defaultSortForType(type: ReportTypeId): string {
  switch (type) {
    case 'stock':
      return 'product'
    default:
      return 'date'
  }
}

export function createFilterId() {
  return `rf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function createDefaultDefinition(
  reportType: ReportTypeId = 'sales',
  preset: DatePreset = 'this_month',
): ReportDefinition {
  const range = rangeForPreset(preset)
  return {
    reportType,
    datePreset: preset,
    dateFrom: range.from,
    dateTo: range.to,
    columns: defaultColumnsForType(reportType),
    filters: [],
    groupBy: 'none',
    sortBy: defaultSortForType(reportType),
    sortDir: reportType === 'stock' ? 'asc' : 'desc',
  }
}

export function filterFieldsForType(type: ReportTypeId): Array<{ id: string; label: string }> {
  const cols = columnsForReportType(type).filter((c) => c.id !== 'count')
  return cols.map((c) => ({ id: c.id, label: c.label }))
}

export function emptyFilter(type: ReportTypeId): ReportFilterCondition {
  const fields = filterFieldsForType(type)
  return {
    id: createFilterId(),
    fieldId: fields[0]?.id ?? 'status',
    operator: 'contains',
    value: '',
  }
}

/** Columns that make sense in the preview for the current group mode */
export function resolveVisibleColumnDefs(
  type: ReportTypeId,
  selectedIds: string[],
  groupBy: ReportGroupBy,
): ReportColumnDef[] {
  const all = columnsForReportType(type)
  const byId = new Map(all.map((c) => [c.id, c]))

  if (groupBy === 'none') {
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as ReportColumnDef[]
  }

  const groupColId =
    groupBy === 'customer'
      ? 'customer'
      : groupBy === 'distributor'
        ? 'distributor'
        : groupBy === 'supplier'
          ? 'supplier'
          : groupBy === 'product'
            ? 'product'
            : groupBy === 'category'
              ? 'category'
              : groupBy === 'method'
                ? 'method'
                : groupBy === 'status'
                  ? type === 'payments'
                    ? 'type'
                    : 'status'
                  : 'date'

  const preferred = [
    groupColId,
    ...selectedIds.filter((id) => id !== groupColId),
    'count',
  ]
  const seen = new Set<string>()
  const out: ReportColumnDef[] = []
  for (const id of preferred) {
    if (seen.has(id)) continue
    const col = byId.get(id)
    if (!col) continue
    if (col.detailOnly) continue
    seen.add(id)
    out.push(col)
  }
  return out.length ? out : [byId.get(groupColId)!, byId.get('count')!].filter(Boolean)
}
