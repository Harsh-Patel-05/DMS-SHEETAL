import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { useDmsStore } from '@/store/dms-store'
import { formatDate } from '@/utils/format'

export default function AuditLogsPage() {
  const auditLogs = useDmsStore((s) => s.auditLogs)

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable trail of create, update, and delete actions across the ERP." />
      <DataTable
        data={auditLogs}
        getRowId={(r) => r.id}
        emptyTitle="No audit logs yet"
        emptyDescription="User actions across modules will appear here as the system is used."
        columns={[
          { id: 'when', header: 'When', cell: (r) => formatDate(r.date, 'datetime') },
          { id: 'user', header: 'User', accessor: 'userName' },
          { id: 'module', header: 'Module', accessor: 'module' },
          { id: 'action', header: 'Action', accessor: 'action' },
          { id: 'desc', header: 'Description', accessor: 'description' },
        ]}
      />
    </div>
  )
}
