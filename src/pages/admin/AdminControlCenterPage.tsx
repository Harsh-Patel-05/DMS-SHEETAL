import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Bell,
  Database,
  KeyRound,
  Shield,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import { buildGlobalActivityFeed } from '@/utils/activity-feed'
import { formatDate } from '@/utils/format'
import { formatNotificationTime } from '@/utils/notifications'

export default function AdminControlCenterPage() {
  const users = useDmsStore((s) => s.users)
  const roles = useDmsStore((s) => s.roles)
  const notifications = useDmsStore((s) => s.notifications)
  const auditLogs = useDmsStore((s) => s.auditLogs)
  const products = useDmsStore((s) => s.products)
  const customers = useDmsStore((s) => s.customers)
  const sales = useDmsStore((s) => s.sales)
  const purchases = useDmsStore((s) => s.purchases)
  const invoices = useDmsStore((s) => s.invoices)
  const payments = useDmsStore((s) => s.payments)
  const ledger = useDmsStore((s) => s.ledger)
  const approvals = useDmsStore((s) => s.approvals)
  const settings = useDmsStore((s) => s.settings)

  const activeUsers = users.filter((u) => u.status === 'active')
  const unread = notifications.filter((n) => !n.read)
  const pendingApprovals = approvals.filter((a) => a.status === 'pending_approval')

  const permissionCount = useMemo(
    () => roles.reduce((sum, r) => sum + r.permissions.filter((p) => p.view || p.create || p.edit || p.delete).length, 0),
    [roles],
  )

  const recentActivity = useMemo(
    () => buildGlobalActivityFeed({ auditLogs, users, limit: 8 }),
    [auditLogs, users],
  )
  const recentNotifications = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [notifications],
  )

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => (b.lastLogin ?? b.updatedAt).localeCompare(a.lastLogin ?? a.updatedAt))
        .slice(0, 6),
    [users],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        description={`${settings.businessName} — users, roles, activity, and data health`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/demo" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              <Sparkles className="h-4 w-4" />
              Demo Mode
            </Link>
            <Link to="/admin/users" className={cn(buttonVariants({ size: 'sm' }))}>
              Manage users
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={users.length} icon={Users} />
        <StatCard label="Active users" value={activeUsers.length} icon={UserCheck} />
        <StatCard label="Roles" value={roles.length} icon={Shield} />
        <StatCard label="Permission grants" value={permissionCount} icon={KeyRound} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unread notifications" value={unread.length} icon={Bell} />
        <StatCard label="Pending approvals" value={pendingApprovals.length} icon={Activity} />
        <StatCard label="Audit events" value={auditLogs.length} icon={Activity} />
        <StatCard
          label="Data records"
          value={products.length + customers.length + sales.length + purchases.length + invoices.length + payments.length + ledger.length}
          icon={Database}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-surface-elevated lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
            <Link to="/admin/activity" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <li className="px-4 py-6 text-sm text-ink-muted">No recent activity</li>
            ) : (
              recentActivity.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.who}</p>
                    <p className="text-ink-muted">
                      {item.didWhat}
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
        </div>

        <div className="rounded-md border border-border bg-surface-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">System notifications</h2>
            <Link to="/admin/notifications" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
              Center
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recentNotifications.map((n) => (
              <li key={n.id} className="px-4 py-3 text-sm">
                <p className={`font-medium ${n.read ? 'text-ink-muted' : 'text-ink'}`}>{n.title}</p>
                <p className="line-clamp-2 text-xs text-ink-muted">{n.message}</p>
                <p className="mt-1 text-[11px] text-ink-subtle">{formatNotificationTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-surface-elevated">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Users &amp; last activity</h2>
            <Link to="/admin/users" className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300">
              All users
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <Link to={`/admin/users/${u.id}`} className="font-medium text-brand-700 hover:underline dark:text-brand-300">
                        {u.name}
                      </Link>
                      <p className="text-xs text-ink-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-2 text-ink-muted">{u.roleName}</td>
                    <td className="px-4 py-2">
                      <StatusBadge kind="party" status={u.status} />
                    </td>
                    <td className="px-4 py-2 text-xs tabular-nums text-ink-muted">
                      {u.lastLogin ? formatDate(u.lastLogin, 'datetime') : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-md border border-border bg-surface-elevated p-4">
          <h2 className="text-sm font-semibold text-ink">Data statistics</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {[
              ['Products', products.length],
              ['Customers', customers.length],
              ['Sales', sales.length],
              ['Purchases', purchases.length],
              ['Invoices', invoices.length],
              ['Payments', payments.length],
              ['Ledger entries', ledger.length],
              ['Roles', roles.length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-md bg-surface px-3 py-2">
                <dt className="text-xs text-ink-muted">{label}</dt>
                <dd className="font-display text-lg font-semibold tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/admin/roles" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Roles
            </Link>
            <Link to="/admin/permissions" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Permission matrix
            </Link>
            <Link to="/admin/audit-logs" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Audit logs
            </Link>
            <Link to="/admin/settings" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
              Settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
