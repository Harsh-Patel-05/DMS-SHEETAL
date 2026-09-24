import type { AdvancedFilterField, SavedAdvancedFilter } from '@/types/advanced-filter'
import { createConditionId } from '@/utils/advanced-filter'

export const FILTER_CONTEXT = {
  products: 'products',
  customers: 'customers',
  sales: 'sales',
  invoices: 'invoices',
  receivables: 'receivables',
  purchases: 'purchases',
  payments: 'payments',
} as const

export type FilterContextId = (typeof FILTER_CONTEXT)[keyof typeof FILTER_CONTEXT]

export const PRODUCT_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'product', label: 'Product', valueType: 'text' },
  { id: 'sku', label: 'SKU', valueType: 'text' },
  { id: 'category', label: 'Category', valueType: 'text' },
  { id: 'brand', label: 'Brand', valueType: 'text' },
  { id: 'stock', label: 'Stock', valueType: 'number' },
  { id: 'minimumStock', label: 'Minimum stock', valueType: 'number' },
  {
    id: 'lowStock',
    label: 'Low stock flag',
    valueType: 'select',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  { id: 'sales', label: 'Sales', valueType: 'currency' },
  { id: 'salesUnits', label: 'Units sold', valueType: 'number' },
  {
    id: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
]

export const CUSTOMER_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'name', label: 'Customer', valueType: 'text' },
  { id: 'city', label: 'City', valueType: 'text' },
  { id: 'balance', label: 'Outstanding', valueType: 'currency' },
  { id: 'creditLimit', label: 'Credit limit', valueType: 'currency' },
  { id: 'totalSales', label: 'Total sales', valueType: 'currency' },
  {
    id: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
]

export const SALE_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'invoice', label: 'Invoice', valueType: 'text' },
  { id: 'customer', label: 'Customer', valueType: 'text' },
  { id: 'total', label: 'Grand total', valueType: 'currency' },
  { id: 'due', label: 'Due amount', valueType: 'currency' },
  {
    id: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Paid', value: 'paid' },
      { label: 'Partial', value: 'partial' },
      { label: 'Unpaid', value: 'unpaid' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
]

export const INVOICE_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'invoice', label: 'Invoice', valueType: 'text' },
  { id: 'customer', label: 'Customer', valueType: 'text' },
  { id: 'total', label: 'Grand total', valueType: 'currency' },
  { id: 'balance', label: 'Balance due', valueType: 'currency' },
  {
    id: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Paid', value: 'paid' },
      { label: 'Partial', value: 'partial' },
      { label: 'Unpaid', value: 'unpaid' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
]

export const RECEIVABLE_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'party', label: 'Party', valueType: 'text' },
  { id: 'balance', label: 'Outstanding', valueType: 'currency' },
  { id: 'ageDays', label: 'Age (days)', valueType: 'number' },
  {
    id: 'partyType',
    label: 'Party type',
    valueType: 'select',
    options: [
      { label: 'Customer', value: 'customer' },
      { label: 'Distributor', value: 'distributor' },
    ],
  },
]

export const PURCHASE_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'purchaseNo', label: 'PO number', valueType: 'text' },
  { id: 'supplier', label: 'Supplier', valueType: 'text' },
  { id: 'total', label: 'Grand total', valueType: 'currency' },
  { id: 'date', label: 'Date', valueType: 'text' },
  {
    id: 'isToday',
    label: 'Today',
    valueType: 'select',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    valueType: 'select',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Paid', value: 'paid' },
      { label: 'Partial', value: 'partial' },
      { label: 'Unpaid', value: 'unpaid' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
]

export const PAYMENT_FILTER_FIELDS: AdvancedFilterField[] = [
  { id: 'paymentNo', label: 'Payment #', valueType: 'text' },
  { id: 'party', label: 'Party', valueType: 'text' },
  { id: 'amount', label: 'Amount', valueType: 'currency' },
  { id: 'date', label: 'Date', valueType: 'text' },
  {
    id: 'type',
    label: 'Type',
    valueType: 'select',
    options: [
      { label: 'Received', value: 'received' },
      { label: 'Paid', value: 'paid' },
    ],
  },
  {
    id: 'method',
    label: 'Method',
    valueType: 'select',
    options: [
      { label: 'Cash', value: 'cash' },
      { label: 'UPI', value: 'upi' },
      { label: 'Bank transfer', value: 'bank_transfer' },
      { label: 'Cheque', value: 'cheque' },
      { label: 'Card', value: 'card' },
      { label: 'Other', value: 'other' },
    ],
  },
]

export const PRESET_SAVED_FILTERS: SavedAdvancedFilter[] = [
  {
    id: 'preset_low_stock_products',
    name: 'Low Stock Products',
    contextId: FILTER_CONTEXT.products,
    isPreset: true,
    group: {
      logic: 'or',
      conditions: [
        {
          id: createConditionId(),
          fieldId: 'lowStock',
          operator: 'equals',
          value: 'yes',
        },
      ],
    },
  },
  {
    id: 'preset_high_value_customers',
    name: 'High Value Customers',
    contextId: FILTER_CONTEXT.customers,
    isPreset: true,
    group: {
      logic: 'and',
      conditions: [
        {
          id: createConditionId(),
          fieldId: 'totalSales',
          operator: 'greater_than',
          value: '50000',
        },
      ],
    },
  },
  {
    id: 'preset_overdue_receivables',
    name: 'Overdue Payments',
    contextId: FILTER_CONTEXT.receivables,
    isPreset: true,
    group: {
      logic: 'and',
      conditions: [
        {
          id: createConditionId(),
          fieldId: 'balance',
          operator: 'greater_than',
          value: '0',
        },
        {
          id: createConditionId(),
          fieldId: 'ageDays',
          operator: 'greater_than',
          value: '30',
        },
      ],
    },
  },
  {
    id: 'preset_top_selling_products',
    name: 'Top Selling Products',
    contextId: FILTER_CONTEXT.products,
    isPreset: true,
    group: {
      logic: 'and',
      conditions: [
        {
          id: createConditionId(),
          fieldId: 'salesUnits',
          operator: 'greater_than',
          value: '25',
        },
      ],
    },
  },
  {
    id: 'preset_pending_invoices',
    name: 'Pending Invoices',
    contextId: FILTER_CONTEXT.invoices,
    isPreset: true,
    group: {
      logic: 'or',
      conditions: [
        {
          id: createConditionId(),
          fieldId: 'status',
          operator: 'equals',
          value: 'unpaid',
        },
        {
          id: createConditionId(),
          fieldId: 'status',
          operator: 'equals',
          value: 'partial',
        },
        {
          id: createConditionId(),
          fieldId: 'balance',
          operator: 'greater_than',
          value: '0',
        },
      ],
    },
  },
]

export function filterFieldsForContext(contextId: string): AdvancedFilterField[] {
  switch (contextId) {
    case FILTER_CONTEXT.products:
      return PRODUCT_FILTER_FIELDS
    case FILTER_CONTEXT.customers:
      return CUSTOMER_FILTER_FIELDS
    case FILTER_CONTEXT.sales:
      return SALE_FILTER_FIELDS
    case FILTER_CONTEXT.invoices:
      return INVOICE_FILTER_FIELDS
    case FILTER_CONTEXT.receivables:
      return RECEIVABLE_FILTER_FIELDS
    case FILTER_CONTEXT.purchases:
      return PURCHASE_FILTER_FIELDS
    case FILTER_CONTEXT.payments:
      return PAYMENT_FILTER_FIELDS
    default:
      return []
  }
}
