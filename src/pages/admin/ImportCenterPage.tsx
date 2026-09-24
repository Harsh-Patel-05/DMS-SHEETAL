import { useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import {
  IMPORT_ENTITY_LABELS,
  downloadImportTemplate,
  headersForEntity,
  validateImportFile,
  type ImportEntity,
  type ImportValidationResult,
} from '@/utils/import-center'

const ENTITIES: ImportEntity[] = ['products', 'customers', 'suppliers', 'distributors']

const STEPS = [
  'Download Template',
  'Upload File',
  'Validate',
  'Preview',
  'Show Errors',
  'Import',
] as const

export default function ImportCenterPage() {
  const products = useDmsStore((s) => s.products)
  const customers = useDmsStore((s) => s.customers)
  const suppliers = useDmsStore((s) => s.suppliers)
  const distributors = useDmsStore((s) => s.distributors)
  const categories = useDmsStore((s) => s.categories)
  const brands = useDmsStore((s) => s.brands)
  const units = useDmsStore((s) => s.units)
  const gstRates = useDmsStore((s) => s.gstRates)
  const upsertProduct = useDmsStore((s) => s.upsertProduct)
  const upsertCustomer = useDmsStore((s) => s.upsertCustomer)
  const upsertSupplier = useDmsStore((s) => s.upsertSupplier)
  const upsertDistributor = useDmsStore((s) => s.upsertDistributor)
  const addAudit = useDmsStore((s) => s.addAudit)
  const pushNotification = useDmsStore((s) => s.pushNotification)
  const { toast } = useToast()

  const [entity, setEntity] = useState<ImportEntity>('products')
  const [fileName, setFileName] = useState<string | null>(null)
  const [result, setResult] = useState<ImportValidationResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const lookups = useMemo(
    () => ({
      products,
      customers,
      suppliers,
      distributors,
      categories,
      brands,
      units,
      gstRates,
    }),
    [products, customers, suppliers, distributors, categories, brands, units, gstRates],
  )

  const activeStep = useMemo(() => {
    if (importedCount > 0) return 5
    if (!fileName) return 0
    if (!result) return 1
    if (result.invalidRows > 0 && result.validRows === 0) return 4
    if (result.totalRows > 0) return 3
    return 2
  }, [fileName, result, importedCount])

  const resetFile = () => {
    setFileName(null)
    setResult(null)
    setImportedCount(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const onEntityChange = (next: ImportEntity) => {
    setEntity(next)
    resetFile()
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    setImportedCount(0)
    setFileName(file.name)
    const text = await file.text()
    const validated = validateImportFile(entity, text, lookups)
    setResult(validated)
    toast({
      title: 'Validation complete',
      description: `${validated.validRows} valid · ${validated.invalidRows} invalid · ${validated.duplicateRows} duplicate`,
      variant: validated.invalidRows ? 'warning' : 'success',
    })
  }

  const runImport = () => {
    if (!result || result.validRows === 0) {
      toast({ title: 'Nothing to import', description: 'Fix errors or upload a valid file.', variant: 'error' })
      return
    }
    setImporting(true)
    let count = 0
    try {
      for (const row of result.rows) {
        if (!row.valid || !row.data) continue
        if (entity === 'products') {
          upsertProduct(row.data as Parameters<typeof upsertProduct>[0])
        } else if (entity === 'customers') {
          upsertCustomer(row.data as Parameters<typeof upsertCustomer>[0])
        } else if (entity === 'suppliers') {
          upsertSupplier(row.data as Parameters<typeof upsertSupplier>[0])
        } else {
          upsertDistributor(row.data as Parameters<typeof upsertDistributor>[0])
        }
        count += 1
      }
      addAudit(
        'Import',
        'Import Completed',
        `Imported ${count} ${IMPORT_ENTITY_LABELS[entity].toLowerCase()} from ${fileName ?? 'CSV'}`,
        fileName ?? undefined,
      )
      pushNotification({
        type: 'system',
        category: 'system',
        severity: 'success',
        title: 'Import completed',
        message: `${count} ${IMPORT_ENTITY_LABELS[entity].toLowerCase()} imported successfully.`,
        link: '/admin/import',
        related: { type: 'import', label: IMPORT_ENTITY_LABELS[entity], href: '/admin/import' },
      })
      setImportedCount(count)
      toast({
        title: 'Import successful',
        description: `${count} row(s) imported. ${result.invalidRows} skipped due to errors.`,
        variant: 'success',
      })
    } finally {
      setImporting(false)
    }
  }

  const validPreview = result?.rows.filter((r) => r.valid).slice(0, 50) ?? []
  const errorRows = result?.errors ?? []

  return (
    <div>
      <PageHeader
        title="Import Center"
        description="Download a template, upload CSV, validate, preview, then import"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium',
              index <= activeStep
                ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                : 'border-border bg-surface text-ink-muted',
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/10 text-[10px] dark:bg-white/10">
              {index + 1}
            </span>
            {label}
            {index < STEPS.length - 1 ? <span className="ml-1 text-ink-muted">↓</span> : null}
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {ENTITIES.map((e) => (
          <Button
            key={e}
            type="button"
            size="sm"
            variant={entity === e ? 'primary' : 'outline'}
            onClick={() => onEntityChange(e)}
          >
            {IMPORT_ENTITY_LABELS[e]}
          </Button>
        ))}
      </div>

      <section className="erp-card mb-4 space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">
              Import {IMPORT_ENTITY_LABELS[entity]}
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Columns: {headersForEntity(entity).join(', ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                downloadImportTemplate(entity)
                toast({ title: 'Template downloaded', variant: 'success' })
              }}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload File
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        {fileName ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-ink-muted" />
            <span className="font-medium text-ink">{fileName}</span>
            <Button type="button" size="sm" variant="ghost" onClick={resetFile}>
              Clear
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            No file uploaded yet. Download the template, fill rows, then upload a CSV.
          </p>
        )}
      </section>

      {result ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Rows" value={String(result.totalRows)} icon={FileSpreadsheet} />
            <StatCard label="Valid Rows" value={String(result.validRows)} icon={CheckCircle2} />
            <StatCard label="Invalid Rows" value={String(result.invalidRows)} icon={AlertTriangle} />
            <StatCard label="Duplicate Rows" value={String(result.duplicateRows)} icon={Copy} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={importing || result.validRows === 0}
              onClick={runImport}
            >
              {importing ? 'Importing…' : `Import ${result.validRows} valid row(s)`}
            </Button>
            {importedCount > 0 ? (
              <p className="flex items-center text-sm font-medium text-success">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Imported {importedCount} row(s)
              </p>
            ) : null}
          </div>

          <Tabs defaultValue={result.invalidRows > 0 ? 'errors' : 'preview'}>
            <TabsList>
              <TabsTrigger value="preview">Preview ({result.validRows})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({result.errors.length})</TabsTrigger>
              <TabsTrigger value="all">All rows ({result.totalRows})</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              {validPreview.length === 0 ? (
                <p className="rounded-md border border-border px-4 py-8 text-center text-sm text-ink-muted">
                  No valid rows to preview. Fix errors and re-upload.
                </p>
              ) : (
                <DataTable
                  data={validPreview}
                  getRowId={(r) => String(r.rowNumber)}
                  columns={[
                    { id: 'row', header: 'Row', cell: (r) => r.rowNumber },
                    ...headersForEntity(entity)
                      .slice(0, 8)
                      .map((h) => ({
                        id: h,
                        header: h,
                        cell: (r: (typeof validPreview)[0]) => r.raw[h] || '—',
                      })),
                  ]}
                />
              )}
            </TabsContent>

            <TabsContent value="errors" className="mt-3">
              {errorRows.length === 0 ? (
                <p className="rounded-md border border-success-border bg-success-bg px-4 py-8 text-center text-sm text-success">
                  No errors — ready to import.
                </p>
              ) : (
                <DataTable
                  data={errorRows}
                  getRowId={(r) => `${r.row}-${r.field}-${r.code}-${r.message}`}
                  emptyTitle="No errors"
                  columns={[
                    { id: 'row', header: 'Row', cell: (r) => (r.row === 0 ? 'Header' : r.row) },
                    { id: 'field', header: 'Field', accessor: 'field' },
                    {
                      id: 'value',
                      header: 'Value',
                      cell: (r) => (
                        <span className="font-mono text-xs">{r.value || '—'}</span>
                      ),
                    },
                    { id: 'message', header: 'Error', accessor: 'message' },
                    {
                      id: 'code',
                      header: 'Type',
                      cell: (r) => (
                        <span className="capitalize text-xs text-ink-muted">
                          {r.code.replace(/_/g, ' ')}
                        </span>
                      ),
                    },
                  ]}
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-3">
              <DataTable
                data={result.rows}
                getRowId={(r) => String(r.rowNumber)}
                columns={[
                  { id: 'row', header: 'Row', cell: (r) => r.rowNumber },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (r) =>
                      r.valid ? (
                        <span className="text-success">Valid</span>
                      ) : r.duplicate ? (
                        <span className="text-warning">Duplicate</span>
                      ) : (
                        <span className="text-danger">Invalid</span>
                      ),
                  },
                  {
                    id: 'errors',
                    header: 'Issues',
                    cell: (r) =>
                      r.errors.length
                        ? r.errors.map((e) => e.message).join('; ')
                        : '—',
                  },
                  {
                    id: 'key',
                    header: 'Key',
                    cell: (r) => r.raw.sku || r.raw.mobile || r.raw.name || '—',
                  },
                ]}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}
