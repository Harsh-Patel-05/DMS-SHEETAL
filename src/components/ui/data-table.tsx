import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Columns3,
  Download,
  Filter,
  GripVertical,
  Printer,
  Rows3,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/utils/cn'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useVirtualWindow } from '@/hooks/use-virtual-window'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeletons'
import {
  ModuleEmptyState,
  type ModuleEmptyKey,
} from '@/components/shared/ModuleEmptyState'
import { Pagination } from '@/components/ui/pagination'
import { SearchInput } from '@/components/ui/search-input'
import { Select } from '@/components/ui/select'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@/components/ui/dropdown'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AdvancedFilterBuilder,
  AdvancedFilterTrigger,
} from '@/components/shared/AdvancedFilterBuilder'
import { SavedViewsToolbar } from '@/components/shared/SavedViewsToolbar'
import { filterFieldsForContext } from '@/config/advanced-filter-presets'
import { usePrefsStore, type TableDensity } from '@/store/prefs-store'
import { colsStorageKey, orderStorageKey } from '@/utils/table-prefs'
import { useSavedViewsStore } from '@/store/saved-views-store'
import type { AdvancedFilterField, AdvancedFilterGroup } from '@/types/advanced-filter'
import type { SavedViewSnapshot } from '@/types/saved-view'
import { evaluateAdvancedFilter, isAdvancedFilterActive } from '@/utils/advanced-filter'

export type SortDirection = 'asc' | 'desc'

export interface DataTableColumn<T> {
  id: string
  header: string
  accessor?: keyof T
  cell?: (row: T) => ReactNode
  sortable?: boolean
  hideable?: boolean
  /** Pin column to the left while scrolling horizontally */
  sticky?: 'left' | 'right'
  className?: string
  headerClassName?: string
  /** Optional filter key — when provided with filterOptions, enables column filter */
  filterKey?: string
  filterOptions?: Array<{ label: string; value: string }>
  getFilterValue?: (row: T) => string
}

export interface DataTableBulkAction<T> {
  id: string
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  onClick: (rows: T[]) => void
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchable?: boolean
  sortKey?: string
  sortDirection?: SortDirection
  onSortChange?: (key: string, direction: SortDirection) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  emptyTitle?: string
  emptyDescription?: string
  /** CTA(s) shown inside the empty state */
  emptyAction?: ReactNode
  /** Prefer module preset empty UI when set */
  emptyModule?: ModuleEmptyKey
  emptyOnPrimaryClick?: () => void
  toolbar?: ReactNode
  className?: string
  /** When false, skip Card chrome (use inside an existing card/shell). Default true. */
  framed?: boolean
  isLoading?: boolean
  density?: TableDensity
  /** Persist column visibility + order under this key in localStorage */
  storageKey?: string
  onExport?: () => void
  /** Enable row checkboxes and selection */
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  bulkActions?: DataTableBulkAction<T>[]
  /** Show density control in toolbar (default true) */
  showDensity?: boolean
  /** Show print button (default true when export available) */
  showPrint?: boolean
  /** Show export button (default true when columns have accessors) */
  showExport?: boolean
  /** Enable client-side pagination when server pagination is not used (default true) */
  paginate?: boolean
  defaultPageSize?: number
  /** Advanced filter builder — context id for saved filters (e.g. products) */
  filterContextId?: string
  advancedFilterFields?: AdvancedFilterField[]
  getAdvancedFilterValue?: (row: T, fieldId: string) => unknown
  advancedFilter?: AdvancedFilterGroup | null
  onAdvancedFilterChange?: (group: AdvancedFilterGroup | null) => void
  /** Show saved views toolbar when storageKey is set (default true) */
  enableSavedViews?: boolean
}

const densityCellClass: Record<TableDensity, string> = {
  compact: 'py-1.5 text-xs',
  comfortable: 'py-2.5 text-sm',
  spacious: 'py-4 text-sm',
}

const densityHeadClass: Record<TableDensity, string> = {
  compact: 'h-9',
  comfortable: 'h-[var(--table-head-height)]',
  spacious: 'h-12',
}

function loadColumnVisibility(storageKey: string, columnIds: string[]): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(colsStorageKey(storageKey))
    if (!raw) return Object.fromEntries(columnIds.map((id) => [id, true]))
    const parsed = JSON.parse(raw) as Record<string, boolean>
    const out: Record<string, boolean> = {}
    for (const id of columnIds) {
      out[id] = parsed[id] !== false
    }
    return out
  } catch {
    return Object.fromEntries(columnIds.map((id) => [id, true]))
  }
}

function loadColumnOrder(storageKey: string, columnIds: string[]): string[] {
  try {
    const raw = localStorage.getItem(orderStorageKey(storageKey))
    if (!raw) return columnIds
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return columnIds
    const next = parsed.filter((id) => columnIds.includes(id))
    for (const id of columnIds) {
      if (!next.includes(id)) next.push(id)
    }
    return next
  } catch {
    return columnIds
  }
}

function defaultSearchFilter<T>(data: T[], query: string, columns: DataTableColumn<T>[]) {
  const q = query.trim().toLowerCase()
  if (!q) return data
  return data.filter((row) =>
    columns.some((col) => {
      if (col.accessor) {
        const val = row[col.accessor]
        if (String(val ?? '').toLowerCase().includes(q)) return true
      }
      if (col.getFilterValue) {
        if (col.getFilterValue(row).toLowerCase().includes(q)) return true
      }
      return false
    }),
  )
}

function sortRows<T>(
  data: T[],
  sortKey: string | undefined,
  direction: SortDirection,
  columns: DataTableColumn<T>[],
) {
  if (!sortKey) return data
  const col = columns.find((c) => c.id === sortKey)
  if (!col?.accessor) return data
  const key = col.accessor
  const sorted = [...data].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === bv) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function exportVisibleCsv<T>(rows: T[], columns: DataTableColumn<T>[], filename: string) {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',')
  const body = rows.map((row) =>
    columns
      .map((col) => {
        let raw: string
        if (col.accessor) raw = String(row[col.accessor] ?? '')
        else if (col.getFilterValue) raw = col.getFilterValue(row)
        else raw = ''
        return escapeCsvCell(raw)
      })
      .join(','),
  )
  const csv = [header, ...body].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stickyClass(sticky?: 'left' | 'right'): string {
  if (sticky === 'left') {
    return 'sticky left-0 z-[2] bg-inherit'
  }
  if (sticky === 'right') {
    return 'sticky right-0 z-[2] bg-inherit'
  }
  return ''
}

function stickyHeadClass(sticky?: 'left' | 'right'): string {
  const base =
    'bg-[color-mix(in_srgb,var(--color-brand-50)_55%,var(--color-surface-muted))] dark:bg-[color-mix(in_srgb,var(--color-brand-100)_35%,var(--color-surface-muted))]'
  if (sticky === 'left') {
    return cn(base, 'sticky left-0 z-[3]')
  }
  if (sticky === 'right') {
    return cn(base, 'sticky right-0 z-[3]')
  }
  return ''
}

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchPlaceholder = 'Search…',
  searchValue = '',
  onSearchChange,
  searchable = true,
  sortKey: sortKeyProp,
  sortDirection: sortDirectionProp = 'asc',
  onSortChange,
  page: pageProp,
  pageSize: pageSizeProp,
  total,
  onPageChange,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyAction,
  emptyModule,
  emptyOnPrimaryClick,
  toolbar,
  className,
  framed = true,
  isLoading,
  density: densityProp,
  storageKey,
  onExport,
  selectable = false,
  selectedIds: selectedIdsProp,
  onSelectionChange,
  bulkActions,
  showDensity = true,
  showPrint = true,
  showExport: showExportProp,
  paginate = true,
  defaultPageSize = 10,
  filterContextId,
  advancedFilterFields: advancedFilterFieldsProp,
  getAdvancedFilterValue,
  advancedFilter: advancedFilterProp,
  onAdvancedFilterChange,
  enableSavedViews = true,
}: DataTableProps<T>) {
  const prefsDensity = usePrefsStore((s) => s.tableDensity)
  const setDensity = usePrefsStore((s) => s.setDensity)
  const density = densityProp ?? prefsDensity

  const [internalSearch, setInternalSearch] = useState('')
  const [internalSortKey, setInternalSortKey] = useState<string | undefined>(undefined)
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>('asc')
  const [internalPage, setInternalPage] = useState(1)
  const [internalPageSize, setInternalPageSize] = useState(defaultPageSize)
  const [internalSelected, setInternalSelected] = useState<string[]>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [internalAdvancedFilter, setInternalAdvancedFilter] = useState<AdvancedFilterGroup | null>(null)
  const [filterBuilderOpen, setFilterBuilderOpen] = useState(false)

  const advancedFilterFields = useMemo(() => {
    if (advancedFilterFieldsProp?.length) return advancedFilterFieldsProp
    if (filterContextId) return filterFieldsForContext(filterContextId)
    return []
  }, [advancedFilterFieldsProp, filterContextId])

  const advancedFilter =
    onAdvancedFilterChange !== undefined ? (advancedFilterProp ?? null) : internalAdvancedFilter

  const setAdvancedFilter = (group: AdvancedFilterGroup | null) => {
    if (onAdvancedFilterChange) onAdvancedFilterChange(group)
    else setInternalAdvancedFilter(group)
  }

  const advancedFilterEnabled =
    advancedFilterFields.length > 0 && getAdvancedFilterValue !== undefined && filterContextId

  const advancedFilterActive = isAdvancedFilterActive(advancedFilter)

  const savedViewsEnabled = Boolean(enableSavedViews && storageKey)
  const listForTable = useSavedViewsStore((s) => s.listForTable)
  const getActiveId = useSavedViewsStore((s) => s.getActiveId)

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns])

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() =>
    storageKey
      ? loadColumnVisibility(storageKey, columnIds)
      : Object.fromEntries(columnIds.map((id) => [id, true])),
  )
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    storageKey ? loadColumnOrder(storageKey, columnIds) : columnIds,
  )

  useEffect(() => {
    if (!storageKey) {
      setColumnVisibility(Object.fromEntries(columnIds.map((id) => [id, true])))
      setColumnOrder(columnIds)
      return
    }
    setColumnVisibility(loadColumnVisibility(storageKey, columnIds))
    setColumnOrder(loadColumnOrder(storageKey, columnIds))
  }, [storageKey, columnIds.join('|')])

  const persistVisibility = useCallback(
    (next: Record<string, boolean>) => {
      setColumnVisibility(next)
      if (storageKey) {
        try {
          localStorage.setItem(colsStorageKey(storageKey), JSON.stringify(next))
        } catch {
          /* ignore */
        }
      }
    },
    [storageKey],
  )

  const persistOrder = useCallback(
    (next: string[]) => {
      setColumnOrder(next)
      if (storageKey) {
        try {
          localStorage.setItem(orderStorageKey(storageKey), JSON.stringify(next))
        } catch {
          /* ignore */
        }
      }
    },
    [storageKey],
  )

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]))
    const ordered: DataTableColumn<T>[] = []
    for (const id of columnOrder) {
      const col = byId.get(id)
      if (col) ordered.push(col)
    }
    for (const col of columns) {
      if (!ordered.includes(col)) ordered.push(col)
    }
    return ordered
  }, [columns, columnOrder])

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => c.hideable === false || columnVisibility[c.id] !== false),
    [orderedColumns, columnVisibility],
  )

  const hideableColumns = useMemo(
    () => orderedColumns.filter((c) => c.hideable !== false),
    [orderedColumns],
  )

  const filterableColumns = useMemo(
    () => columns.filter((c) => c.filterOptions && c.filterOptions.length > 0),
    [columns],
  )

  const searchInputValue = onSearchChange ? searchValue : internalSearch
  /** Debounced query drives filtering so typing stays responsive on large datasets. */
  const filterSearch = useDebouncedValue(searchInputValue, 200)
  const usesInternalSort = !onSortChange
  const effectiveSortKey = usesInternalSort ? internalSortKey : sortKeyProp
  const effectiveSortDirection = usesInternalSort ? internalSortDirection : sortDirectionProp

  const isServerPaginated = total !== undefined && onPageChange !== undefined
  const page = isServerPaginated ? (pageProp ?? 1) : internalPage
  const pageSize = isServerPaginated ? (pageSizeProp ?? defaultPageSize) : internalPageSize

  const selectedIds = onSelectionChange ? (selectedIdsProp ?? []) : internalSelected
  const setSelectedIds = (ids: string[]) => {
    if (onSelectionChange) onSelectionChange(ids)
    else setInternalSelected(ids)
  }

  const captureSnapshot = useCallback((): SavedViewSnapshot => {
    return {
      search: searchInputValue ?? '',
      columnFilters: { ...columnFilters },
      advancedFilter: advancedFilter
        ? {
            logic: advancedFilter.logic,
            conditions: advancedFilter.conditions.map((c) => ({ ...c })),
          }
        : null,
      sortKey: effectiveSortKey,
      sortDirection: effectiveSortDirection,
      columnVisibility: { ...columnVisibility },
      columnOrder: [...columnOrder],
      pageSize,
    }
  }, [
    searchInputValue,
    columnFilters,
    advancedFilter,
    effectiveSortKey,
    effectiveSortDirection,
    columnVisibility,
    columnOrder,
    pageSize,
  ])

  const applySnapshot = useCallback(
    (snapshot: SavedViewSnapshot) => {
      if (onSearchChange) onSearchChange(snapshot.search)
      else setInternalSearch(snapshot.search)

      setColumnFilters({ ...snapshot.columnFilters })
      if (onAdvancedFilterChange) onAdvancedFilterChange(snapshot.advancedFilter)
      else setInternalAdvancedFilter(snapshot.advancedFilter)

      if (onSortChange && snapshot.sortKey) {
        onSortChange(snapshot.sortKey, snapshot.sortDirection)
      } else {
        setInternalSortKey(snapshot.sortKey)
        setInternalSortDirection(snapshot.sortDirection)
      }

      const visibility: Record<string, boolean> = {}
      for (const id of columnIds) {
        visibility[id] = snapshot.columnVisibility[id] !== false
      }
      persistVisibility(visibility)

      const order = snapshot.columnOrder.filter((id) => columnIds.includes(id))
      for (const id of columnIds) {
        if (!order.includes(id)) order.push(id)
      }
      persistOrder(order)

      if (!(total !== undefined && onPageChange !== undefined)) {
        setInternalPageSize(snapshot.pageSize || defaultPageSize)
        setInternalPage(1)
      }
    },
    [
      onSearchChange,
      onSortChange,
      columnIds,
      persistVisibility,
      persistOrder,
      total,
      onPageChange,
      defaultPageSize,
      onAdvancedFilterChange,
    ],
  )

  const resetToDefaultView = useCallback(() => {
    applySnapshot({
      search: '',
      columnFilters: {},
      advancedFilter: null,
      sortKey: undefined,
      sortDirection: 'asc',
      columnVisibility: Object.fromEntries(columnIds.map((id) => [id, true])),
      columnOrder: columnIds,
      pageSize: defaultPageSize,
    })
  }, [applySnapshot, columnIds, defaultPageSize])

  const [viewsHydrated, setViewsHydrated] = useState(false)
  useEffect(() => {
    if (!savedViewsEnabled || !storageKey || viewsHydrated) return
    const activeId = getActiveId(storageKey)
    if (activeId) {
      const match = listForTable(storageKey).find((v) => v.id === activeId)
      if (match) applySnapshot(match.snapshot)
    }
    setViewsHydrated(true)
  }, [savedViewsEnabled, storageKey, viewsHydrated, getActiveId, listForTable, applySnapshot])

  const clientFiltered = useMemo(() => {
    let rows = onSearchChange ? data : defaultSearchFilter(data, filterSearch, columns)

    for (const col of filterableColumns) {
      const value = columnFilters[col.id]
      if (!value) continue
      rows = rows.filter((row) => {
        const fv = col.getFilterValue
          ? col.getFilterValue(row)
          : col.accessor
            ? String(row[col.accessor] ?? '')
            : ''
        return fv === value
      })
    }

    if (advancedFilterEnabled && advancedFilterActive && getAdvancedFilterValue) {
      rows = rows.filter((row) =>
        evaluateAdvancedFilter(row, advancedFilter, getAdvancedFilterValue, advancedFilterFields),
      )
    }
    return rows
  }, [
    data,
    filterSearch,
    columns,
    onSearchChange,
    filterableColumns,
    columnFilters,
    advancedFilterEnabled,
    advancedFilterActive,
    advancedFilter,
    getAdvancedFilterValue,
    advancedFilterFields,
  ])

  const sorted = useMemo(
    () => sortRows(clientFiltered, effectiveSortKey, effectiveSortDirection, columns),
    [clientFiltered, effectiveSortKey, effectiveSortDirection, columns],
  )

  const rowTotal = isServerPaginated ? (total as number) : sorted.length

  useEffect(() => {
    if (!isServerPaginated) setInternalPage(1)
  }, [filterSearch, columnFilters, advancedFilter, isServerPaginated, pageSize])

  const pageRows = useMemo(() => {
    if (isServerPaginated) return sorted
    if (!paginate) return sorted
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page, pageSize, isServerPaginated, paginate])

  const pageRowIds = useMemo(() => pageRows.map(getRowId), [pageRows, getRowId])

  const tableScrollRef = useRef<HTMLDivElement>(null)
  const rowHeightPx = density === 'compact' ? 36 : density === 'comfortable' ? 52 : 44
  const shouldVirtualize = pageRows.length >= 40
  const virtual = useVirtualWindow({
    count: pageRows.length,
    rowHeight: rowHeightPx,
    scrollRef: tableScrollRef,
    enabled: shouldVirtualize,
  })
  const virtualRows = shouldVirtualize
    ? pageRows.slice(virtual.startIndex, virtual.endIndex)
    : pageRows
  const colSpanCount = visibleColumns.length + (selectable ? 1 : 0)
  const allPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => selectedIds.includes(id))
  const somePageSelected = pageRowIds.some((id) => selectedIds.includes(id)) && !allPageSelected

  const selectedRows = useMemo(
    () => sorted.filter((row) => selectedIds.includes(getRowId(row))),
    [sorted, selectedIds, getRowId],
  )

  const handleSort = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId)
    if (!col?.sortable) return

    if (onSortChange) {
      if (sortKeyProp === columnId) {
        onSortChange(columnId, sortDirectionProp === 'asc' ? 'desc' : 'asc')
      } else {
        onSortChange(columnId, 'asc')
      }
      return
    }

    if (internalSortKey === columnId) {
      setInternalSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setInternalSortKey(columnId)
      setInternalSortDirection('asc')
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
      return
    }
    exportVisibleCsv(sorted, visibleColumns, `${storageKey ?? 'export'}.csv`)
  }

  const handlePrint = () => {
    const printable = window.document.createElement('div')
    printable.innerHTML = `
      <html><head><title>Print</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 16px; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; }
      </style></head><body>
      <table>
        <thead><tr>${visibleColumns.map((c) => `<th>${c.header}</th>`).join('')}</tr></thead>
        <tbody>
          ${sorted
            .map(
              (row) =>
                `<tr>${visibleColumns
                  .map((col) => {
                    const text = col.accessor
                      ? String(row[col.accessor] ?? '')
                      : col.getFilterValue
                        ? col.getFilterValue(row)
                        : ''
                    return `<td>${text.replace(/</g, '&lt;')}</td>`
                  })
                  .join('')}</tr>`,
            )
            .join('')}
        </tbody>
      </table>
      </body></html>`
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!win) return
    win.document.write(printable.innerHTML)
    win.document.close()
    win.focus()
    win.print()
  }

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds(selectedIds.filter((id) => !pageRowIds.includes(id)))
    } else {
      setSelectedIds([...new Set([...selectedIds, ...pageRowIds])])
    }
  }

  const toggleRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const idx = columnOrder.indexOf(columnId)
    if (idx < 0) return
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (swapWith < 0 || swapWith >= columnOrder.length) return
    const next = [...columnOrder]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    persistOrder(next)
  }

  const showExportBtn =
    showExportProp ?? (onExport !== undefined || visibleColumns.some((c) => c.accessor))
  const showPagination = (isServerPaginated || paginate) && rowTotal > 0
  const activeFilterCount =
    Object.values(columnFilters).filter(Boolean).length + (advancedFilterActive ? 1 : 0)

  const cellPad = densityCellClass[density]
  const headH = densityHeadClass[density]

  const shellClass = cn(
    'overflow-hidden print:shadow-none',
    framed && 'erp-card',
    className,
  )

  const content = (
    <>
      <div className="erp-list-toolbar flex flex-col gap-2.5 p-3 print:hidden">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between md:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {searchable ? (
              <SearchInput
                placeholder={searchPlaceholder}
                value={searchInputValue}
                onChange={(e) =>
                  onSearchChange ? onSearchChange(e.target.value) : setInternalSearch(e.target.value)
                }
                onClear={() => (onSearchChange ? onSearchChange('') : setInternalSearch(''))}
                className="w-full sm:max-w-xs sm:flex-1 [&_input]:border-border/80 [&_input]:bg-surface-elevated [&_input]:shadow-none"
                aria-label="Search table"
              />
            ) : null}
            {savedViewsEnabled && storageKey ? (
              <SavedViewsToolbar
                tableId={storageKey}
                captureSnapshot={captureSnapshot}
                applySnapshot={applySnapshot}
                resetToDefault={resetToDefaultView}
                className="shrink-0"
              />
            ) : null}
          </div>

          <div className="mobile-filter-row flex flex-wrap items-center gap-1.5 md:justify-end">
            {toolbar}

            {advancedFilterEnabled ? (
              <>
                <AdvancedFilterTrigger
                  active={advancedFilterActive}
                  onClick={() => setFilterBuilderOpen(true)}
                />
                <AdvancedFilterBuilder
                  open={filterBuilderOpen}
                  onClose={() => setFilterBuilderOpen(false)}
                  contextId={filterContextId!}
                  fields={advancedFilterFields}
                  value={advancedFilter}
                  onApply={setAdvancedFilter}
                />
              </>
            ) : null}

            {filterableColumns.length > 0 ? (
              <Dropdown>
                <DropdownTrigger>
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {activeFilterCount > 0 ? (
                    <span className="rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </DropdownTrigger>
                <DropdownMenu className="min-w-[14rem] space-y-3 p-3" align="end">
                  {filterableColumns.map((col) => (
                    <div key={col.id} className="space-y-1">
                      <p className="text-xs font-medium text-ink-muted">{col.header}</p>
                      <Select
                        value={columnFilters[col.id] ?? ''}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({ ...prev, [col.id]: e.target.value }))
                        }
                      >
                        <option value="">All</option>
                        {col.filterOptions!.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                  {activeFilterCount > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setColumnFilters({})}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </DropdownMenu>
              </Dropdown>
            ) : null}

            {hideableColumns.length > 0 ? (
              <Dropdown>
                <DropdownTrigger>
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[16rem] p-2" align="end">
                  <div className="space-y-1">
                    {hideableColumns.map((col, index) => (
                      <div
                        key={col.id}
                        className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-surface"
                      >
                        <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                        <Checkbox
                          label={col.header}
                          checked={columnVisibility[col.id] !== false}
                          className="min-w-0 flex-1"
                          onChange={(e) => {
                            const checked = e.target.checked
                            if (!checked && visibleColumns.length <= 1) return
                            persistVisibility({ ...columnVisibility, [col.id]: checked })
                          }}
                        />
                        <button
                          type="button"
                          className="rounded p-0.5 text-ink-muted hover:bg-surface-elevated hover:text-ink disabled:opacity-30"
                          disabled={index === 0}
                          aria-label={`Move ${col.header} up`}
                          onClick={() => moveColumn(col.id, 'up')}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-0.5 text-ink-muted hover:bg-surface-elevated hover:text-ink disabled:opacity-30"
                          disabled={index === hideableColumns.length - 1}
                          aria-label={`Move ${col.header} down`}
                          onClick={() => moveColumn(col.id, 'down')}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </DropdownMenu>
              </Dropdown>
            ) : null}

            {showDensity ? (
              <Dropdown>
                <DropdownTrigger>
                  <Rows3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Density</span>
                </DropdownTrigger>
                <DropdownMenu className="min-w-[10rem] p-1" align="end">
                  {(
                    [
                      ['compact', 'Compact'],
                      ['comfortable', 'Comfortable'],
                      ['spacious', 'Spacious'],
                    ] as const
                  ).map(([value, label]) => (
                    <DropdownItem
                      key={value}
                      onSelect={() => setDensity(value)}
                      className={cn(
                        density === value &&
                          'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-200',
                      )}
                    >
                      {label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            ) : null}

            {showExportBtn ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            ) : null}

            {showPrint ? (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            ) : null}
          </div>
        </div>

        {selectable && selectedIds.length > 0 ? (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="flex flex-wrap items-center gap-2 rounded-md border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/20"
          >
            <span className="font-medium text-ink">
              {selectedIds.length} row{selectedIds.length === 1 ? '' : 's'} selected
            </span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
            {bulkActions?.map((action) => (
              <Button
                key={action.id}
                type="button"
                size="sm"
                variant={action.variant ?? 'outline'}
                onClick={() => action.onClick(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={Math.min(visibleColumns.length || 5, 6)} className="border-0 shadow-none" />
      ) : pageRows.length === 0 ? (
        <div className="p-4">
          {emptyModule ? (
            <ModuleEmptyState
              module={emptyModule}
              title={emptyTitle !== 'No records found' ? emptyTitle : undefined}
              description={emptyDescription}
              onPrimaryClick={emptyOnPrimaryClick}
              extraActions={emptyAction}
            />
          ) : (
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              actions={emptyAction}
            />
          )}
        </div>
      ) : (
        <>
          {/* Mobile swipe-friendly cards */}
          <div className="space-y-2 p-3 md:hidden">
            {pageRows.map((row) => {
              const rowId = getRowId(row)
              const selected = selectedIds.includes(rowId)
              const primary = visibleColumns[0]
              const secondary = visibleColumns.slice(1, 4)
              const rest = visibleColumns.slice(4)
              return (
                <article
                  key={rowId}
                  className={cn(
                    'mobile-swipe-card erp-row-feedback',
                    selected && 'ring-2 ring-brand-500/40',
                  )}
                  aria-selected={selectable ? selected : undefined}
                >
                  <div className="flex items-start gap-3">
                    {selectable ? (
                      <Checkbox
                        checked={selected}
                        aria-label={`Select row ${rowId}`}
                        onChange={() => toggleRow(rowId)}
                        className="mt-0.5"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-2">
                      {primary ? (
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                              {primary.header}
                            </p>
                            <p className="truncate font-medium text-ink">
                              {primary.cell
                                ? primary.cell(row)
                                : primary.accessor
                                  ? String(row[primary.accessor] ?? '')
                                  : null}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      {secondary.length ? (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                          {secondary.map((col) => (
                            <div key={col.id} className="min-w-0">
                              <dt className="text-[11px] text-ink-subtle">{col.header}</dt>
                              <dd className="truncate text-ink">
                                {col.cell
                                  ? col.cell(row)
                                  : col.accessor
                                    ? String(row[col.accessor] ?? '')
                                    : null}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {rest.length ? (
                        <dl className="space-y-1 border-t border-border/70 pt-2 text-sm">
                          {rest.map((col) => (
                            <div key={col.id} className="flex justify-between gap-3">
                              <dt className="text-ink-muted">{col.header}</dt>
                              <dd className="text-right text-ink">
                                {col.cell
                                  ? col.cell(row)
                                  : col.accessor
                                    ? String(row[col.accessor] ?? '')
                                    : null}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Desktop / tablet scrollable table */}
          <div
            ref={tableScrollRef}
            onScroll={shouldVirtualize ? virtual.onScroll : undefined}
            className="relative hidden max-h-[min(70vh,720px)] overflow-auto scrollbar-thin md:block"
          >
            <table
              className="erp-table w-full caption-bottom border-separate border-spacing-0 text-sm"
              aria-rowcount={rowTotal}
              aria-colcount={colSpanCount}
            >
              <caption className="sr-only">
                {emptyTitle !== 'No records found' ? emptyTitle : 'Data table'}
                {`, ${rowTotal} row${rowTotal === 1 ? '' : 's'}`}
              </caption>
              <TableHeader className="sticky top-0 z-[3]">
                <TableRow className="hover:bg-transparent">
                  {selectable ? (
                    <TableHead
                      className={cn(
                        headH,
                        'sticky left-0 z-[4] w-11 px-2 text-center',
                        'bg-[color-mix(in_srgb,var(--color-brand-50)_55%,var(--color-surface-muted))]',
                      )}
                    >
                      <div className="flex justify-center">
                        <Checkbox
                          checked={allPageSelected}
                          indeterminate={somePageSelected}
                          aria-label="Select all rows on page"
                          onChange={toggleSelectAllPage}
                        />
                      </div>
                    </TableHead>
                  ) : null}
                  {visibleColumns.map((col) => (
                    <TableHead
                      key={col.id}
                      aria-sort={
                        col.sortable && effectiveSortKey === col.id
                          ? effectiveSortDirection === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : col.sortable
                            ? 'none'
                            : undefined
                      }
                      className={cn(
                        headH,
                        stickyHeadClass(col.sticky),
                        !col.sticky &&
                          'bg-[color-mix(in_srgb,var(--color-brand-50)_55%,var(--color-surface-muted))] dark:bg-[color-mix(in_srgb,var(--color-brand-100)_35%,var(--color-surface-muted))]',
                        col.sticky === 'left' && selectable ? 'left-11' : undefined,
                        col.headerClassName,
                      )}
                    >
                      {col.sortable && (onSortChange || usesInternalSort) ? (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center gap-1 touch-manipulation hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                          onClick={() => handleSort(col.id)}
                          aria-label={`Sort by ${col.header}`}
                        >
                          {col.header}
                          {effectiveSortKey === col.id ? (
                            effectiveSortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shouldVirtualize && virtual.offsetTop > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={colSpanCount}
                      style={{ height: virtual.offsetTop, padding: 0, border: 'none' }}
                    />
                  </tr>
                ) : null}
                {virtualRows.map((row) => {
                  const rowId = getRowId(row)
                  const selected = selectedIds.includes(rowId)
                  return (
                    <TableRow
                      key={rowId}
                      data-state={selected ? 'selected' : undefined}
                      className={cn(selected && 'bg-brand-50/50 dark:bg-brand-900/15')}
                      style={shouldVirtualize ? { height: rowHeightPx } : undefined}
                    >
                      {selectable ? (
                        <TableCell
                          className={cn(
                            cellPad,
                            'sticky left-0 z-[1] w-11 px-2 text-center bg-inherit',
                            selected && 'bg-brand-50 dark:bg-brand-900/20',
                          )}
                        >
                          <div className="flex justify-center">
                            <Checkbox
                              checked={selected}
                              aria-label={`Select row ${rowId}`}
                              onChange={() => toggleRow(rowId)}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                      {visibleColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          className={cn(
                            cellPad,
                            stickyClass(col.sticky),
                            col.sticky === 'left' && selectable ? 'left-11' : undefined,
                            selected && col.sticky && 'bg-brand-50 dark:bg-brand-900/20',
                            col.className,
                          )}
                        >
                          {col.cell
                            ? col.cell(row)
                            : col.accessor
                              ? String(row[col.accessor] ?? '')
                              : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
                {shouldVirtualize && virtual.offsetBottom > 0 ? (
                  <tr aria-hidden="true">
                    <td
                      colSpan={colSpanCount}
                      style={{ height: virtual.offsetBottom, padding: 0, border: 'none' }}
                    />
                  </tr>
                ) : null}
              </TableBody>
            </table>
          </div>
        </>
      )}

      {showPagination ? (
        <div className="flex flex-col gap-3 border-t border-border p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          {!isServerPaginated ? (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span>Rows per page</span>
              <Select
                value={String(pageSize)}
                containerClassName="w-auto"
                className="h-8 w-[4.5rem] py-0 text-xs"
                onChange={(e) => {
                  setInternalPageSize(Number(e.target.value) || defaultPageSize)
                  setInternalPage(1)
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div />
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rowTotal}
            onPageChange={(p) => {
              if (isServerPaginated) onPageChange?.(p)
              else setInternalPage(p)
            }}
          />
        </div>
      ) : null}
    </>
  )

  return <div className={shellClass}>{content}</div>
}
