import { useMemo, useRef } from 'react'
import {
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import type { ExportJob, ExportModuleId } from '@/types'
import { todayISO } from '@/utils/cn'
import {
  EXPORT_MODULES,
  EXPORT_MODULE_LABELS,
  buildExportPayload,
  downloadExportContent,
  exportSimulationDelayMs,
  serializeCsv,
} from '@/utils/export-center'
import { formatDate } from '@/utils/format'

export default function ExportCenterPage() {
  const exportJobs = useDmsStore((s) => s.exportJobs)
  const queueExportJob = useDmsStore((s) => s.queueExportJob)
  const completeExportJob = useDmsStore((s) => s.completeExportJob)
  const failExportJob = useDmsStore((s) => s.failExportJob)
  const removeExportJob = useDmsStore((s) => s.removeExportJob)
  const addAudit = useDmsStore((s) => s.addAudit)
  const pushNotification = useDmsStore((s) => s.pushNotification)
  const { toast } = useToast()
  const timers = useRef<Record<string, number>>({})

  const stats = useMemo(() => {
    const preparing = exportJobs.filter((j) => j.status === 'preparing').length
    const completed = exportJobs.filter((j) => j.status === 'completed').length
    const failed = exportJobs.filter((j) => j.status === 'failed').length
    return { preparing, completed, failed, total: exportJobs.length }
  }, [exportJobs])

  const runSimulatedExport = (moduleId: ExportModuleId) => {
    const label = EXPORT_MODULE_LABELS[moduleId]
    const pendingName = `${moduleId}-export-${todayISO()}.csv`
    const job = queueExportJob(moduleId, label, pendingName)

    toast({
      title: 'Export preparing',
      description: `Generating ${label} CSV…`,
      variant: 'info',
    })

    const delay = exportSimulationDelayMs()
    window.clearTimeout(timers.current[job.id])
    timers.current[job.id] = window.setTimeout(() => {
      try {
        const state = useDmsStore.getState()
        const payload = buildExportPayload(moduleId, {
          products: state.products,
          customers: state.customers,
          suppliers: state.suppliers,
          distributors: state.distributors,
          sales: state.sales,
          purchases: state.purchases,
          invoices: state.invoices,
          payments: state.payments,
          expenses: state.expenses,
          categories: state.categories,
          brands: state.brands,
          units: state.units,
          gstRates: state.gstRates,
        })
        if (payload.rows.length === 0) {
          failExportJob(job.id, `No ${label.toLowerCase()} rows available to export.`)
          toast({
            title: 'Export failed',
            description: `No ${label.toLowerCase()} data found.`,
            variant: 'error',
          })
          return
        }
        const csvContent = serializeCsv(payload.headers, payload.rows)
        completeExportJob(job.id, {
          fileName: payload.fileName,
          csvContent,
          rowCount: payload.rows.length,
        })
        downloadExportContent(payload.fileName, csvContent)
        addAudit(
          'Export',
          'Export Completed',
          `Exported ${payload.rows.length} ${label.toLowerCase()} row(s)`,
          payload.fileName,
        )
        pushNotification({
          type: 'system',
          category: 'system',
          severity: 'success',
          title: 'Export completed',
          message: `${payload.fileName} · ${payload.rows.length} row(s)`,
          link: '/admin/export',
          related: { type: 'export', label: payload.fileName, href: '/admin/export' },
        })
        toast({
          title: 'Export completed',
          description: `${payload.fileName} (${payload.rows.length} rows)`,
          variant: 'success',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Export generation failed'
        failExportJob(job.id, message)
        toast({ title: 'Export failed', description: message, variant: 'error' })
      }
    }, delay)
  }

  const handleDownload = (job: ExportJob) => {
    if (!job.csvContent || job.status !== 'completed') {
      toast({ title: 'File not ready', description: 'Only completed exports can be downloaded.', variant: 'warning' })
      return
    }
    downloadExportContent(job.fileName, job.csvContent)
    toast({ title: 'Download started', description: job.fileName, variant: 'success' })
  }

  const handleRetry = (job: ExportJob) => {
    removeExportJob(job.id)
    runSimulatedExport(job.moduleId)
  }

  const sortedJobs = useMemo(
    () => [...exportJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [exportJobs],
  )

  return (
    <div>
      <PageHeader
        title="Export Center"
        description="Generate CSV exports by module. Frontend mode simulates preparation, then downloads the file."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recent Exports" value={String(stats.total)} icon={FileDown} />
        <StatCard label="Preparing" value={String(stats.preparing)} icon={Loader2} />
        <StatCard label="Completed" value={String(stats.completed)} icon={Download} />
        <StatCard label="Failed" value={String(stats.failed)} icon={XCircle} />
      </div>

      <section className="erp-card mb-6 p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink">Start export</h2>
        <p className="mb-4 text-xs text-ink-muted">
          Choose a module. Status moves Preparing → Completed (or Failed), then the file is available to download again.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {EXPORT_MODULES.map((mod) => {
            const busy = exportJobs.some((j) => j.moduleId === mod.id && j.status === 'preparing')
            return (
              <div
                key={mod.id}
                className="flex flex-col justify-between rounded-md border border-border bg-surface px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{mod.label}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{mod.description}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                  disabled={busy}
                  onClick={() => runSimulatedExport(mod.id)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Preparing…
                    </>
                  ) : (
                    <>
                      <FileDown className="h-3.5 w-3.5" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Recent exports</h2>
        <DataTable
          data={sortedJobs}
          getRowId={(r) => r.id}
          emptyModule="exports"
          columns={[
            {
              id: 'file',
              header: 'File',
              cell: (r) => (
                <div>
                  <p className="font-medium text-ink">{r.fileName}</p>
                  {r.rowCount != null ? (
                    <p className="text-xs text-ink-muted">{r.rowCount} row(s)</p>
                  ) : r.errorMessage ? (
                    <p className="text-xs text-danger">{r.errorMessage}</p>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'module',
              header: 'Module',
              cell: (r) => r.moduleLabel,
            },
            {
              id: 'date',
              header: 'Date',
              cell: (r) => formatDate(r.createdAt, 'datetime'),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (r) => <StatusBadge kind="export" status={r.status} />,
            },
            {
              id: 'actions',
              header: ACTION_COLUMN_HEADER,
              headerClassName: ACTION_COLUMN_HEADER_CLASS,
              className: ACTION_COLUMN_CLASS,
              hideable: false,
              sticky: 'right',
              cell: (r) => (
                <RowActions
                  onDelete={
                    r.status !== 'preparing'
                      ? () => {
                          removeExportJob(r.id)
                          toast({ title: 'Export removed', variant: 'info' })
                        }
                      : undefined
                  }
                  more={[
                    {
                      id: 'download',
                      label: 'Download',
                      icon: <Download className="h-3.5 w-3.5" />,
                      disabled: r.status !== 'completed' || !r.csvContent,
                      onClick: () => handleDownload(r),
                    },
                    ...(r.status === 'failed'
                      ? [
                          {
                            id: 'retry',
                            label: 'Retry',
                            icon: <RefreshCw className="h-3.5 w-3.5" />,
                            onClick: () => handleRetry(r),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  )
}
