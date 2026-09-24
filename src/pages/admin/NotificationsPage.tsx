import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react'
import {
  ACTION_COLUMN_CLASS,
  ACTION_COLUMN_HEADER,
  ACTION_COLUMN_HEADER_CLASS,
  RowActions,
} from '@/components/shared/RowActions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { useDmsStore } from '@/store/dms-store'
import type {
  AppNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationSeverity,
} from '@/types'
import { cn } from '@/utils/cn'
import { formatDate } from '@/utils/format'
import {
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_PRIORITY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
  countByCategory,
  formatNotificationTime,
  normalizeNotification,
  unreadCount,
} from '@/utils/notifications'

const CATEGORIES: NotificationCategory[] = [
  'stock',
  'sales',
  'purchase',
  'payments',
  'invoices',
  'approvals',
  'system',
]

const SEVERITIES: NotificationSeverity[] = ['info', 'warning', 'critical', 'success']
const PRIORITIES: NotificationPriority[] = ['urgent', 'high', 'normal', 'low']

function severityVariant(severity: NotificationSeverity): 'default' | 'info' | 'warning' | 'danger' | 'success' {
  switch (severity) {
    case 'critical':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    case 'info':
      return 'info'
    default:
      return 'default'
  }
}

function priorityVariant(priority: NotificationPriority): 'default' | 'info' | 'warning' | 'danger' | 'success' {
  switch (priority) {
    case 'urgent':
      return 'danger'
    case 'high':
      return 'warning'
    case 'low':
      return 'default'
    default:
      return 'info'
  }
}

function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const cls = 'h-3.5 w-3.5'
  switch (severity) {
    case 'critical':
      return <ShieldAlert className={cn(cls, 'text-danger')} aria-hidden />
    case 'warning':
      return <AlertTriangle className={cn(cls, 'text-warning')} aria-hidden />
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-success')} aria-hidden />
    default:
      return <Info className={cn(cls, 'text-info')} aria-hidden />
  }
}

export default function NotificationsPage() {
  const raw = useDmsStore((s) => s.notifications)
  const markAllNotificationsRead = useDmsStore((s) => s.markAllNotificationsRead)
  const clearNotifications = useDmsStore((s) => s.clearNotifications)
  const markNotificationRead = useDmsStore((s) => s.markNotificationRead)
  const removeNotification = useDmsStore((s) => s.removeNotification)

  const notifications = useMemo(
    () =>
      raw
        .map((n) => normalizeNotification(n))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [raw],
  )

  const [category, setCategory] = useState<NotificationCategory | 'all'>('all')
  const [severity, setSeverity] = useState<NotificationSeverity | 'all'>('all')
  const [priority, setPriority] = useState<NotificationPriority | 'all'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  const unread = unreadCount(notifications)
  const byCategory = useMemo(() => countByCategory(notifications), [notifications])
  const criticalUnread = notifications.filter((n) => !n.read && n.severity === 'critical').length

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (category !== 'all' && n.category !== category) return false
      if (severity !== 'all' && n.severity !== severity) return false
      if (priority !== 'all' && n.priority !== priority) return false
      if (readFilter === 'unread' && n.read) return false
      if (readFilter === 'read' && !n.read) return false
      return true
    })
  }, [notifications, category, severity, priority, readFilter])

  return (
    <div>
      <PageHeader
        title="Notification Center"
        description="Stock, sales, purchase, payments, invoices, approvals, and system alerts"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead()}>
              Mark all read
            </Button>
            <Button variant="outline" size="sm" onClick={() => clearNotifications()}>
              Clear all
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unread" value={String(unread)} icon={Bell} />
        <StatCard label="Critical unread" value={String(criticalUnread)} icon={ShieldAlert} />
        <StatCard label="Stock alerts" value={String(byCategory.stock)} />
        <StatCard label="Approvals" value={String(byCategory.approvals)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={category === 'all' ? 'primary' : 'outline'}
          onClick={() => setCategory('all')}
        >
          All
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? 'primary' : 'outline'}
            onClick={() => setCategory(c)}
          >
            {NOTIFICATION_CATEGORY_LABELS[c]}
            {byCategory[c] > 0 ? (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-[10px] text-brand-700">
                {byCategory[c]}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <FormField label="Severity" className="w-full min-w-0 sm:min-w-[140px] sm:w-auto">
          <Select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as NotificationSeverity | 'all')}
          >
            <option value="all">All</option>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {NOTIFICATION_SEVERITY_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Priority" className="w-full min-w-0 sm:min-w-[140px] sm:w-auto">
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as NotificationPriority | 'all')}
          >
            <option value="all">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {NOTIFICATION_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" className="w-full min-w-0 sm:min-w-[140px] sm:w-auto">
          <Select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as 'all' | 'unread' | 'read')}
          >
            <option value="all">All</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </Select>
        </FormField>
      </div>

      <DataTable
        data={filtered}
        getRowId={(r) => r.id}
        emptyModule="notifications"
        columns={[
          {
            id: 'severity',
            header: 'Severity',
            cell: (r: AppNotification) => (
              <span className="inline-flex items-center gap-1.5">
                <SeverityIcon severity={r.severity} />
                <Badge variant={severityVariant(r.severity)}>
                  {NOTIFICATION_SEVERITY_LABELS[r.severity]}
                </Badge>
              </span>
            ),
          },
          {
            id: 'category',
            header: 'Category',
            cell: (r) => NOTIFICATION_CATEGORY_LABELS[r.category],
          },
          {
            id: 'priority',
            header: 'Priority',
            cell: (r) => (
              <Badge variant={priorityVariant(r.priority)}>
                {NOTIFICATION_PRIORITY_LABELS[r.priority]}
              </Badge>
            ),
          },
          {
            id: 'title',
            header: 'Notification',
            cell: (r) => (
              <div className={cn(!r.read && 'font-semibold')}>
                <p className="text-ink">{r.title}</p>
                <p className="text-xs text-ink-muted line-clamp-2">{r.message}</p>
              </div>
            ),
          },
          {
            id: 'related',
            header: 'Related record',
            cell: (r) =>
              r.related ? (
                r.related.href || r.link ? (
                  <Link
                    to={r.related.href ?? r.link!}
                    className="text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                    onClick={() => markNotificationRead(r.id)}
                  >
                    {r.related.label}
                  </Link>
                ) : (
                  <span className="text-sm">{r.related.label}</span>
                )
              ) : (
                '—'
              ),
          },
          {
            id: 'when',
            header: 'Timestamp',
            cell: (r) => (
              <div>
                <p className="tabular-nums text-sm">{formatNotificationTime(r.createdAt)}</p>
                <p className="text-[11px] text-ink-muted">{formatDate(r.createdAt, 'datetime')}</p>
              </div>
            ),
          },
          {
            id: 'read',
            header: 'Status',
            cell: (r) => (r.read ? 'Read' : <Badge variant="info">Unread</Badge>),
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
                onDelete={() => removeNotification(r.id)}
                deleteLabel="Dismiss"
                more={
                  !r.read
                    ? [
                        {
                          id: 'read',
                          label: 'Mark read',
                          onClick: () => markNotificationRead(r.id),
                        },
                      ]
                    : undefined
                }
              />
            ),
          },
        ]}
      />
    </div>
  )
}
