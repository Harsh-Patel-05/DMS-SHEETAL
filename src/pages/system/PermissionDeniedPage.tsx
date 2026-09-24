import { Link, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/utils/cn'
import { MODULE_LABELS, type PermissionAction } from '@/utils/permissions'
import type { PermissionModule } from '@/types'

const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'view',
  create: 'create',
  edit: 'edit',
  delete: 'delete',
}

export default function PermissionDeniedPage() {
  const location = useLocation()
  const state = location.state as {
    from?: string
    module?: PermissionModule
    action?: PermissionAction
  } | null
  const moduleLabel = state?.module ? MODULE_LABELS[state.module] : null
  const actionLabel = state?.action ? ACTION_LABELS[state.action] : 'view'

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </div>
      <PageHeader
        title="Permission denied"
        description="You don't have permission to access this page."
        className="mt-4 items-center text-center [&_h1]:text-center [&_p]:mx-auto"
      />
      {moduleLabel ? (
        <p className="mt-2 text-sm text-ink-muted">
          Required access:{' '}
          <span className="font-medium text-ink">
            {moduleLabel} ({actionLabel})
          </span>
        </p>
      ) : null}
      {state?.from ? (
        <p className="mt-1 text-xs text-ink-subtle font-mono">{state.from}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link to="/dashboard" className={cn(buttonVariants({ variant: 'primary' }))}>
          Go to dashboard
        </Link>
        <Link to="/admin/permissions" className={cn(buttonVariants({ variant: 'outline' }))}>
          View permissions
        </Link>
      </div>
      <p className="mt-6 text-xs text-ink-muted">
        Contact your administrator if you believe this is a mistake.
      </p>
    </div>
  )
}
