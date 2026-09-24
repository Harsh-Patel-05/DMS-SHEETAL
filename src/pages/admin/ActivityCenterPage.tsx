import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  FileText,
  Package,
  ShoppingCart,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { PageHeader } from '@/components/ui/page-header'
import { Select } from '@/components/ui/select'
import { StatCard } from '@/components/ui/stat-card'
import { useDmsStore } from '@/store/dms-store'
import { cn } from '@/utils/cn'
import {
  activityActors,
  activityModules,
  buildGlobalActivityFeed,
  type GlobalActivityItem,
} from '@/utils/activity-feed'
import { formatDate } from '@/utils/format'
import { formatNotificationTime } from '@/utils/notifications'

function moduleIcon(module: string) {
  const m = module.toLowerCase()
  if (m.includes('sale') || m.includes('invoice')) return ShoppingCart
  if (m.includes('purchase')) return Truck
  if (m.includes('payment')) return Wallet
  if (m.includes('product') || m.includes('stock')) return Package
  if (m.includes('customer') || m.includes('user') || m.includes('auth')) return UserRound
  return FileText
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function ActivityRow({ item }: { item: GlobalActivityItem }) {
  const Icon = moduleIcon(item.module)
  return (
    <li className="relative flex gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface/80">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
        title={item.whoName}
      >
        {initials(item.whoName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div>
            <p className="font-semibold text-ink">{item.who}</p>
            {item.whoRole && item.who !== item.whoName ? (
              <p className="text-xs text-ink-muted">{item.whoName}</p>
            ) : null}
          </div>
          <time className="shrink-0 text-xs tabular-nums text-ink-muted" dateTime={item.at}>
            {formatNotificationTime(item.at)}
          </time>
        </div>
        <p className="mt-1 text-sm text-ink">
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
            {item.recordHref && item.recordLabel && !item.recordLabel.startsWith('₹') ? (
              <>
                {item.didWhat}{' '}
                <Link
                  to={item.recordHref}
                  className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  &ldquo;{item.recordLabel}&rdquo;
                </Link>
              </>
            ) : item.recordHref && item.recordLabel ? (
              <>
                {item.didWhat}{' '}
                <Link
                  to={item.recordHref}
                  className="font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  {item.recordLabel}
                </Link>
              </>
            ) : (
              item.summary
            )}
          </span>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
          <span>{item.module}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(item.at, 'datetime')}</span>
          {item.reference ? (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono">{item.reference}</span>
            </>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export default function ActivityCenterPage() {
  const auditLogs = useDmsStore((s) => s.auditLogs)
  const users = useDmsStore((s) => s.users)

  const feed = useMemo(
    () => buildGlobalActivityFeed({ auditLogs, users, limit: 200 }),
    [auditLogs, users],
  )

  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [actorFilter, setActorFilter] = useState<string>('all')

  const modules = useMemo(() => activityModules(feed), [feed])
  const actors = useMemo(() => activityActors(feed), [feed])

  const filtered = useMemo(() => {
    return feed.filter((item) => {
      if (moduleFilter !== 'all' && item.module !== moduleFilter) return false
      if (actorFilter !== 'all' && item.who !== actorFilter) return false
      return true
    })
  }, [feed, moduleFilter, actorFilter])

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return feed.filter((i) => i.at.slice(0, 10) === today).length
  }, [feed])

  return (
    <div>
      <PageHeader
        title="Recent Activity"
        description="Who did what, on which record, and when — across the whole DMS"
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total events" value={String(feed.length)} icon={Activity} />
        <StatCard label="Today" value={String(todayCount)} />
        <StatCard label="Showing" value={String(filtered.length)} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <FormField label="Module" className="w-full min-w-0 sm:min-w-[160px] sm:w-auto">
          <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
            <option value="all">All modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Who" className="w-full min-w-0 sm:min-w-[180px] sm:w-auto">
          <Select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="all">Everyone</option>
            {actors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </FormField>
        {(moduleFilter !== 'all' || actorFilter !== 'all') && (
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setModuleFilter('all')
                setActorFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <section className={cn('erp-card overflow-hidden')}>
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Activity feed</h2>
          <p className="text-xs text-ink-muted">
            Example: Admin created Product · Sales Executive created Invoice · Accountant received
            payment
          </p>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-muted">No activity yet</p>
        ) : (
          <ol className="divide-y-0">
            {filtered.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
