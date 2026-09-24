import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '@/types'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  RowActions,
} from '@/components/shared/RowActions'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { usePermission } from '@/hooks/use-permission'
import { useDmsStore } from '@/store/dms-store'
import { formatDate } from '@/utils/format'

export default function UsersPage() {
  const users = useDmsStore((s) => s.users)
  const roles = useDmsStore((s) => s.roles)
  const upsertUser = useDmsStore((s) => s.upsertUser)
  const deleteUser = useDmsStore((s) => s.deleteUser)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { canDelete } = usePermission('users')
  const [open, setOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<User>>({ status: 'active', password: 'changeme123' })

  const save = () => {
    const role = roles.find((r) => r.id === form.roleId) ?? roles[0]
    if (!form.name || !form.username || !form.email || !role) {
      toast({ title: 'Fill required fields', variant: 'error' })
      return
    }
    upsertUser({
      ...(form.id ? { id: form.id } : {}),
      name: form.name,
      email: form.email,
      username: form.username,
      password: form.password ?? 'changeme123',
      roleId: role.id,
      roleName: role.name,
      phone: form.phone,
      status: form.status ?? 'active',
    })
    toast({ title: 'User saved', variant: 'success' })
    setOpen(false)
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Accounts, roles, and access status"
        actions={
          <Can module="users" action="create">
            <Button
              size="sm"
              className="gap-1"
              onClick={() => {
                setForm({ status: 'active', password: 'changeme123', roleId: roles[0]?.id })
                setOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add user
            </Button>
          </Can>
        }
      />
      <DataTable
        data={users}
        getRowId={(r) => r.id}
        emptyModule="users"
        emptyOnPrimaryClick={() => {
          setForm({ status: 'active', password: 'changeme123', roleId: roles[0]?.id })
          setOpen(true)
        }}
        columns={[
          {
            id: 'name',
            header: 'Name',
            cell: (r) => (
              <Link to={`/admin/users/${r.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                {r.name}
              </Link>
            ),
          },
          { id: 'user', header: 'Username', accessor: 'username' },
          { id: 'role', header: 'Role', accessor: 'roleName' },
          { id: 'status', header: 'Status', cell: (r) => <StatusBadge kind="party" status={r.status} /> },
          {
            id: 'last',
            header: 'Last activity',
            cell: (r) => (
              <span className="text-xs tabular-nums text-ink-muted">
                {r.lastLogin ? formatDate(r.lastLogin, 'datetime') : 'Never'}
              </span>
            ),
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
                onView={() => navigate(`/admin/users/${r.id}`)}
                onDelete={canDelete() ? () => setDeleteId(r.id) : undefined}
              />
            ),
          },
        ]}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'Edit user' : 'New user'}
      >
        <div className="space-y-3">
          <FormField label="Name" required>
            <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email" required>
            <Input value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Username" required>
            <Input value={form.username ?? ''} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </FormField>
          <FormField label="Password" required={!form.id} hint={form.id ? 'Leave blank to keep current' : undefined}>
            <Input
              type="password"
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </FormField>
          <FormField label="Role" required>
            <Select value={form.roleId ?? roles[0]?.id} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              Save user
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Delete user?"
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteUser(deleteId)
          setDeleteId(null)
        }}
      />
    </div>
  )
}
