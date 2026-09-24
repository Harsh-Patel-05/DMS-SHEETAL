import type { SavedView } from '@/types/saved-view'
import { createConditionId } from '@/utils/advanced-filter'

/** Table ids align with DataTable `storageKey` values */
export const VIEW_TABLE = {
  sales: 'sales',
  products: 'products',
  purchases: 'purchases',
  payments: 'payments',
  invoices: 'invoices',
  customers: 'customers',
} as const

export type ViewTableId = (typeof VIEW_TABLE)[keyof typeof VIEW_TABLE]

function cond(fieldId: string, operator: 'equals' | 'not_equals' | 'greater_than', value: string) {
  return { id: createConditionId(), fieldId, operator, value }
}

export const PRESET_SAVED_VIEWS: SavedView[] = [
  {
    id: 'preset_view_my_sales',
    name: 'My Sales',
    tableId: VIEW_TABLE.sales,
    isPreset: true,
    snapshot: {
      search: '',
      columnFilters: {},
      advancedFilter: {
        logic: 'and',
        conditions: [cond('status', 'not_equals', 'cancelled')],
      },
      sortKey: 'date',
      sortDirection: 'desc',
      columnVisibility: {
        no: true,
        date: true,
        customer: true,
        total: true,
        status: true,
        open: true,
      },
      columnOrder: ['no', 'date', 'customer', 'total', 'status', 'open'],
      pageSize: 25,
    },
  },
  {
    id: 'preset_view_pending_payments',
    name: 'Pending Payments',
    tableId: VIEW_TABLE.invoices,
    isPreset: true,
    snapshot: {
      search: '',
      columnFilters: {},
      advancedFilter: {
        logic: 'or',
        conditions: [
          cond('status', 'equals', 'unpaid'),
          cond('status', 'equals', 'partial'),
          cond('balance', 'greater_than', '0'),
        ],
      },
      sortKey: 'date',
      sortDirection: 'desc',
      columnVisibility: {
        no: true,
        date: true,
        customer: true,
        total: true,
        balance: true,
        status: true,
        view: true,
      },
      columnOrder: ['no', 'date', 'customer', 'total', 'balance', 'status', 'view'],
      pageSize: 20,
    },
  },
  {
    id: 'preset_view_low_stock',
    name: 'Low Stock',
    tableId: VIEW_TABLE.products,
    isPreset: true,
    snapshot: {
      search: '',
      columnFilters: {},
      advancedFilter: {
        logic: 'and',
        conditions: [cond('lowStock', 'equals', 'yes')],
      },
      sortKey: 'sku',
      sortDirection: 'asc',
      columnVisibility: {
        sku: true,
        name: true,
        cat: true,
        brand: true,
        stock: true,
        price: true,
        status: true,
        actions: true,
      },
      columnOrder: ['sku', 'name', 'cat', 'brand', 'stock', 'price', 'status', 'actions'],
      pageSize: 25,
    },
  },
  {
    id: 'preset_view_todays_purchases',
    name: "Today's Purchases",
    tableId: VIEW_TABLE.purchases,
    isPreset: true,
    snapshot: {
      search: '',
      columnFilters: {},
      advancedFilter: {
        logic: 'and',
        conditions: [cond('isToday', 'equals', 'yes')],
      },
      sortKey: 'no',
      sortDirection: 'desc',
      columnVisibility: {
        no: true,
        date: true,
        supplier: true,
        total: true,
        status: true,
        edit: true,
      },
      columnOrder: ['no', 'date', 'supplier', 'total', 'status', 'edit'],
      pageSize: 15,
    },
  },
]
