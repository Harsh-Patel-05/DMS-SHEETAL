import { Link } from 'react-router-dom'
import { Can } from '@/components/auth/Can'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useDmsStore } from '@/store/dms-store'

export default function RolesPage() {
  const roles = useDmsStore((s) => s.roles)

  return (
    <div>
      <PageHeader
        title="Roles"
        description="System roles and default access levels. Edit module access under Permissions."
        actions={
          <Can module="users" action="edit">
            <Link to="/admin/permissions">
              <Button type="button" variant="outline" size="sm">
                Manage permissions
              </Button>
            </Link>
          </Can>
        }
      />
      <DataTable
        data={roles}
        getRowId={(r) => r.id}
        emptyTitle="No roles configured"
        emptyDescription="Roles define what each user can view and edit."
        columns={[
          { id: 'name', header: 'Role', accessor: 'name' },
          { id: 'desc', header: 'Description', accessor: 'description' },
          { id: 'perms', header: 'Permissions', cell: (r) => r.permissions.filter((p) => p.view).length },
          { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="party" status={r.status} /> },
        ]}
      />
    </div>
  )
}
