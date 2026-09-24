import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import { buildGlobalActivityFeed } from '@/utils/activity-feed'
import { formatDate } from '@/utils/format'
import { formatNotificationTime } from '@/utils/notifications'
import type { Permission } from '@/types'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const users = useDmsStore((s) => s.users)
  const roles = useDmsStore((s) => s.roles)
  const auditLogs = useDmsStore((s) => s.auditLogs)
  const assignUserRole = useDmsStore((s) => s.assignUserRole)
  const setUserStatus = useDmsStore((s) => s.setUserStatus)
  const updateRolePermissions = useDmsStore((s) => s.updateRolePermissions)

  const user = users.find((u) => u.id === id)
  const role = roles.find((r) => r.id === user?.roleId)

  const [roleId, setRoleId] = useState(user?.roleId ?? '')

  const activity = useMemo(() => {
    if (!user) return []
    return buildGlobalActivityFeed({ auditLogs, users, limit: 80 })
      .filter((a) => a.userId === user.id || a.whoName === user.name)
      .slice(0, 12)
  }, [auditLogs, user, users])

  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader title="User not found" />
        <Button variant="outline" onClick={() => navigate('/admin/users')}>
          Back to users
        </Button>
      </div>
    )
  }

  const saveRole = () => {
    const result = assignUserRole(user.id, roleId || user.roleId)
    if (!result.ok) {
      toast({ title: result.message ?? 'Failed', variant: 'error' })
      return
    }
    toast({ title: 'Role assigned', variant: 'success' })
  }

  const toggleStatus = () => {
    const next = user.status === 'active' ? 'inactive' : 'active'
    const result = setUserStatus(user.id, next)
    if (!result.ok) {
      toast({ title: result.message ?? 'Failed', variant: 'error' })
      return
    }
    toast({ title: `Account ${next}`, variant: 'success' })
  }

  const togglePerm = (module: Permission['module'], key: keyof Permission) => {
    if (!role || key === 'module') return
    const next = role.permissions.map((p) =>
      p.module === module ? { ...p, [key]: !p[key] } : p,
    )
    updateRolePermissions(role.id, next)
    toast({ title: 'Permission updated', variant: 'success' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={`${user.username} · ${user.email}`}
        actions={
          <Link to="/admin/users" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
            <ArrowLeft className="h-4 w-4" />
            Users
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-md border border-border bg-surface-elevated p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Status</dt>
              <dd className="mt-1 flex items-center gap-2">
                <StatusBadge kind="party" status={user.status} />
                <Button size="sm" variant="outline" onClick={toggleStatus}>
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Role</dt>
              <dd className="mt-1 font-medium text-ink">{user.roleName}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Phone</dt>
              <dd className="mt-1 text-ink">{user.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Last activity</dt>
              <dd className="mt-1 tabular-nums text-ink">
                {user.lastLogin ? formatDate(user.lastLogin, 'datetime') : 'Never signed in'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Created</dt>
              <dd className="mt-1 tabular-nums text-ink-muted">{formatDate(user.createdAt, 'datetime')}</dd>
            </div>
          </dl>

          <div className="border-t border-border pt-4">
            <FormField label="Assign role">
              <Select value={roleId || user.roleId} onChange={(e) => setRoleId(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <Button className="mt-2" size="sm" onClick={saveRole}>
              Save role
            </Button>
          </div>
        </section>

        <section className="rounded-md border border-border bg-surface-elevated lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Shield className="h-4 w-4 text-brand-700" aria-hidden />
              Permission matrix — {role?.name ?? 'No role'}
            </h2>
            <Link to="/admin/permissions" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
              Full matrix
            </Link>
          </div>
          {!role ? (
            <p className="px-4 py-6 text-sm text-ink-muted">No role assigned</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2">View</th>
                    <th className="px-3 py-2">Create</th>
                    <th className="px-3 py-2">Edit</th>
                    <th className="px-3 py-2">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {role.permissions.map((p) => (
                    <tr key={p.module} className="border-t border-border">
                      <td className="px-3 py-2 font-medium capitalize">{p.module.replace(/_/g, ' ')}</td>
                      {(['view', 'create', 'edit', 'delete'] as const).map((k) => (
                        <td key={k} className="px-3 py-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={p[k] ? 'primary' : 'outline'}
                            onClick={() => togglePerm(p.module, k)}
                          >
                            {p[k] ? 'On' : 'Off'}
                          </Button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-md border border-border bg-surface-elevated">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Last activity</h2>
        </div>
        <ul className="divide-y divide-border">
          {activity.length === 0 ? (
            <li className="px-4 py-6 text-sm text-ink-muted">No audit activity for this user yet</li>
          ) : (
            activity.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.didWhat}</p>
                  <p className="text-ink-muted">
                    {item.module}
                    {item.recordLabel ? ` · ${item.recordLabel}` : ''}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-ink-muted" dateTime={item.at}>
                  {formatNotificationTime(item.at)}
                </time>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
