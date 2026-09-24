import type {
  Brand,
  Category,
  Customer,
  Distributor,
  Expense,
  ExportJob,
  ExportModuleId,
  GstRate,
  Invoice,
  Payment,
  Product,
  Purchase,
  Sale,
  Supplier,
  Unit,
} from '@/types'
import { downloadCsv, escapeCsvCell } from '@/utils/bulk-export'
import { todayISO } from '@/utils/cn'

export const EXPORT_MODULE_LABELS: Record<ExportModuleId, string> = {
  products: 'Products',
  customers: 'Customers',
  suppliers: 'Suppliers',
  distributors: 'Distributors',
  sales: 'Sales',
  purchases: 'Purchases',
  invoices: 'Invoices',
  payments: 'Payments',
  expenses: 'Expenses',
  stock: 'Stock',
}

export const EXPORT_MODULES: { id: ExportModuleId; label: string; description: string }[] = [
  { id: 'products', label: 'Products', description: 'SKU, pricing, category, brand' },
  { id: 'customers', label: 'Customers', description: 'Contacts, credit, balances' },
  { id: 'suppliers', label: 'Suppliers', description: 'Vendor master list' },
  { id: 'distributors', label: 'Distributors', description: 'Distributor master list' },
  { id: 'sales', label: 'Sales', description: 'Sales invoices & totals' },
  { id: 'purchases', label: 'Purchases', description: 'Purchase bills & totals' },
  { id: 'invoices', label: 'Invoices', description: 'Invoice register' },
  { id: 'payments', label: 'Payments', description: 'Received & paid payments' },
  { id: 'expenses', label: 'Expenses', description: 'Expense vouchers' },
  { id: 'stock', label: 'Stock', description: 'Current stock by product' },
]

export interface ExportDataSource {
  products: Product[]
  customers: Customer[]
  suppliers: Supplier[]
  distributors: Distributor[]
  sales: Sale[]
  purchases: Purchase[]
  invoices: Invoice[]
  payments: Payment[]
  expenses: Expense[]
  categories: Category[]
  brands: Brand[]
  units: Unit[]
  gstRates: GstRate[]
}

export interface ExportPayload {
  moduleId: ExportModuleId
  moduleLabel: string
  fileName: string
  headers: string[]
  rows: string[][]
}

function nameMap<T extends { id: string; name: string }>(list: T[]) {
  return Object.fromEntries(list.map((x) => [x.id, x.name])) as Record<string, string>
}

export function buildExportPayload(moduleId: ExportModuleId, data: ExportDataSource): ExportPayload {
  const stamp = todayISO()
  const moduleLabel = EXPORT_MODULE_LABELS[moduleId]
  const cats = nameMap(data.categories)
  const brands = nameMap(data.brands)
  const units = nameMap(data.units)
  const gst = Object.fromEntries(data.gstRates.map((g) => [g.id, String(g.rate)])) as Record<string, string>

  switch (moduleId) {
    case 'products': {
      const headers = [
        'SKU',
        'Name',
        'Barcode',
        'Category',
        'Brand',
        'Unit',
        'Purchase',
        'Selling',
        'MRP',
        'GST%',
        'HSN',
        'Stock',
        'Min Stock',
        'Status',
      ]
      const rows = data.products.map((p) => [
        p.sku,
        p.name,
        p.barcode ?? '',
        cats[p.categoryId] ?? '',
        brands[p.brandId] ?? '',
        units[p.unitId] ?? '',
        String(p.purchasePrice),
        String(p.sellingPrice),
        String(p.mrp),
        gst[p.gstRateId] ?? '',
        p.hsnCode,
        String(p.currentStock),
        String(p.minimumStock),
        p.status,
      ])
      return {
        moduleId,
        moduleLabel,
        fileName: `products-export-${stamp}.csv`,
        headers,
        rows,
      }
    }
    case 'stock': {
      const headers = ['SKU', 'Name', 'Category', 'Brand', 'Unit', 'Current Stock', 'Min Stock', 'Status']
      const rows = data.products.map((p) => [
        p.sku,
        p.name,
        cats[p.categoryId] ?? '',
        brands[p.brandId] ?? '',
        units[p.unitId] ?? '',
        String(p.currentStock),
        String(p.minimumStock),
        p.status,
      ])
      return { moduleId, moduleLabel, fileName: `stock-export-${stamp}.csv`, headers, rows }
    }
    case 'customers': {
      const headers = [
        'Name',
        'Mobile',
        'Email',
        'City',
        'State',
        'GST',
        'Credit Limit',
        'Balance',
        'Status',
      ]
      const rows = data.customers.map((c) => [
        c.name,
        c.mobile,
        c.email ?? '',
        c.city,
        c.state,
        c.gstNumber ?? '',
        String(c.creditLimit),
        String(c.currentBalance),
        c.status,
      ])
      return { moduleId, moduleLabel, fileName: `customers-export-${stamp}.csv`, headers, rows }
    }
    case 'suppliers': {
      const headers = [
        'Name',
        'Company',
        'Contact',
        'Mobile',
        'City',
        'GST',
        'Credit Limit',
        'Balance',
        'Status',
      ]
      const rows = data.suppliers.map((s) => [
        s.name,
        s.companyName ?? '',
        s.contactPerson ?? '',
        s.mobile,
        s.city,
        s.gstNumber ?? '',
        String(s.creditLimit),
        String(s.currentBalance),
        s.status,
      ])
      return { moduleId, moduleLabel, fileName: `suppliers-export-${stamp}.csv`, headers, rows }
    }
    case 'distributors': {
      const headers = [
        'Name',
        'Company',
        'Contact',
        'Mobile',
        'City',
        'GST',
        'Credit Limit',
        'Balance',
        'Status',
      ]
      const rows = data.distributors.map((d) => [
        d.name,
        d.companyName,
        d.contactPerson,
        d.mobile,
        d.city,
        d.gstNumber ?? '',
        String(d.creditLimit),
        String(d.currentBalance),
        d.status,
      ])
      return { moduleId, moduleLabel, fileName: `distributors-export-${stamp}.csv`, headers, rows }
    }
    case 'sales': {
      const headers = ['Invoice No', 'Date', 'Customer', 'Items', 'Total', 'Paid', 'Due', 'Status']
      const rows = data.sales.map((s) => [
        s.invoiceNo,
        s.date,
        s.customerName,
        String(s.items.length),
        String(s.grandTotal),
        String(s.paid),
        String(s.due),
        s.status,
      ])
      return { moduleId, moduleLabel, fileName: `sales-export-${stamp}.csv`, headers, rows }
    }
    case 'purchases': {
      const headers = ['Purchase No', 'Date', 'Supplier', 'Invoice No', 'Items', 'Total', 'Paid', 'Due', 'Status']
      const rows = data.purchases.map((p) => [
        p.purchaseNo,
        p.date,
        p.supplierName,
        p.invoiceNo,
        String(p.items.length),
        String(p.grandTotal),
        String(p.paid),
        String(p.due),
        p.status,
      ])
      return { moduleId, moduleLabel, fileName: `purchases-export-${stamp}.csv`, headers, rows }
    }
    case 'invoices': {
      const headers = ['Invoice No', 'Date', 'Customer', 'Sale Ref', 'Total', 'Paid', 'Balance', 'Status']
      const rows = data.invoices.map((inv) => [
        inv.invoiceNo,
        inv.date,
        inv.customerName,
        inv.saleId,
        String(inv.grandTotal),
        String(inv.paid),
        String(inv.balance),
        inv.status,
      ])
      return { moduleId, moduleLabel, fileName: `invoices-export-${stamp}.csv`, headers, rows }
    }
    case 'payments': {
      const headers = ['Payment No', 'Date', 'Type', 'Party', 'Method', 'Amount', 'Reference']
      const rows = data.payments.map((p) => [
        p.paymentNo,
        p.date,
        p.type,
        p.partyName,
        p.method,
        String(p.amount),
        p.reference ?? '',
      ])
      return { moduleId, moduleLabel, fileName: `payments-export-${stamp}.csv`, headers, rows }
    }
    case 'expenses': {
      const headers = ['Date', 'Category', 'Description', 'Amount', 'Method', 'Reference', 'Notes']
      const rows = data.expenses.map((e) => [
        e.date,
        e.category,
        e.description,
        String(e.amount),
        e.paymentMethod,
        e.reference ?? '',
        e.notes ?? '',
      ])
      return { moduleId, moduleLabel, fileName: `expenses-export-${stamp}.csv`, headers, rows }
    }
  }
}

export function serializeCsv(headers: string[], rows: string[][]): string {
  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')),
  ].join('\n')
}

export function downloadExportContent(fileName: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadExportPayload(payload: ExportPayload) {
  downloadCsv(payload.fileName, payload.headers, payload.rows)
}

export const EXPORT_STATUS_LABELS: Record<ExportJob['status'], string> = {
  preparing: 'Preparing',
  completed: 'Completed',
  failed: 'Failed',
}

/** Simulated delay for frontend-only export generation (ms). */
export function exportSimulationDelayMs() {
  return 900 + Math.floor(Math.random() * 900)
}
