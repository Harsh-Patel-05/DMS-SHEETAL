import type { DatePreset } from '@/utils/date-range'

export type ReportTypeId = 'sales' | 'purchases' | 'payments' | 'stock' | 'expenses'

export type ReportGroupBy =
  | 'none'
  | 'customer'
  | 'product'
  | 'date'
  | 'distributor'
  | 'supplier'
  | 'status'
  | 'category'
  | 'method'

export type ReportColumnValueType = 'text' | 'number' | 'currency' | 'date'

export interface ReportColumnDef {
  id: string
  label: string
  valueType: ReportColumnValueType
  /** When grouping, sum this column */
  aggregatable?: boolean
  /** Hide from detail mode or only useful when grouped */
  detailOnly?: boolean
}

export type ReportFilterOperator = 'equals' | 'contains' | 'greater_than' | 'less_than'

export interface ReportFilterCondition {
  id: string
  fieldId: string
  operator: ReportFilterOperator
  value: string
}

export interface ReportDefinition {
  reportType: ReportTypeId
  datePreset: DatePreset | 'custom'
  dateFrom: string
  dateTo: string
  columns: string[]
  filters: ReportFilterCondition[]
  groupBy: ReportGroupBy
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export interface SavedReport extends ReportDefinition {
  id: string
  name: string
  updatedAt: string
}

/** Flat cell map used by the preview table */
export type ReportRow = Record<string, string | number | null | undefined>

export interface ReportRunResult {
  rows: ReportRow[]
  columns: ReportColumnDef[]
  totals: Record<string, number>
  rowCount: number
}
