import { AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Can } from '@/components/auth/Can'
import { Button } from '@/components/ui/button'
import { usePrefsStore } from '@/store/prefs-store'
import type { InventoryAlert } from '@/utils/inventory-metrics'
import { cn } from '@/utils/cn'

export interface InventoryStockAlertsProps {
  alerts: InventoryAlert[]
  className?: string
}

export function InventoryStockAlerts({ alerts, className }: InventoryStockAlertsProps) {
  const dismissed = usePrefsStore((s) => s.dismissedStockAlerts)
  const dismissStockAlert = usePrefsStore((s) => s.dismissStockAlert)

  const visible = alerts.filter((a) => !dismissed.includes(a.dismissKey))
  if (visible.length === 0) return null

  return (
    <div className={cn('space-y-2', className)}>
      {visible.map((alert) => (
        <div
          key={alert.dismissKey}
          className="flex flex-col gap-3 rounded-md border border-warning-border bg-warning-bg px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <div className="flex min-w-0 items-start gap-2.5 text-sm text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <span>{alert.message}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            <Can module="stock" action="view">
              <Link to={alert.viewPath}>
                <Button type="button" size="sm" variant="outline">
                  View products
                </Button>
              </Link>
            </Can>
            <Can module="purchase" action="create">
              <Link to={alert.purchasePath}>
                <Button type="button" size="sm">
                  Create purchase
                </Button>
              </Link>
            </Can>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-ink-muted"
              onClick={() => dismissStockAlert(alert.dismissKey)}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
