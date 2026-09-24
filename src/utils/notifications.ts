import type {
  AppNotification,
  NotificationCategory,
  NotificationPriority,
  NotificationSeverity,
  NotificationType,
} from '@/types'

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  stock: 'Stock',
  sales: 'Sales',
  purchase: 'Purchase',
  payments: 'Payments',
  invoices: 'Invoices',
  approvals: 'Approvals',
  system: 'System',
}

export const NOTIFICATION_SEVERITY_LABELS: Record<NotificationSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
  success: 'Success',
}

export const NOTIFICATION_PRIORITY_LABELS: Record<NotificationPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

const TYPE_TO_CATEGORY: Record<NotificationType, NotificationCategory> = {
  low_stock: 'stock',
  stock_adjustment: 'stock',
  new_sale: 'sales',
  return_created: 'sales',
  new_purchase: 'purchase',
  payment_received: 'payments',
  payment_due: 'payments',
  approval: 'approvals',
  invoice: 'invoices',
  system: 'system',
}

const TYPE_TO_SEVERITY: Record<NotificationType, NotificationSeverity> = {
  low_stock: 'warning',
  stock_adjustment: 'info',
  new_sale: 'success',
  return_created: 'warning',
  new_purchase: 'success',
  payment_received: 'success',
  payment_due: 'warning',
  approval: 'info',
  invoice: 'info',
  system: 'info',
}

export function categoryFromType(type: NotificationType): NotificationCategory {
  return TYPE_TO_CATEGORY[type] ?? 'system'
}

export function severityFromType(type: NotificationType): NotificationSeverity {
  return TYPE_TO_SEVERITY[type] ?? 'info'
}

export function priorityFromSeverity(severity: NotificationSeverity): NotificationPriority {
  switch (severity) {
    case 'critical':
      return 'urgent'
    case 'warning':
      return 'high'
    case 'success':
      return 'normal'
    default:
      return 'normal'
  }
}

export function normalizeNotification(
  n: Partial<AppNotification> &
    Pick<AppNotification, 'id' | 'type' | 'title' | 'message' | 'read' | 'createdAt'>,
): AppNotification {
  const category = n.category ?? categoryFromType(n.type)
  const severity = n.severity ?? severityFromType(n.type)
  const priority = n.priority ?? priorityFromSeverity(severity)
  return {
    id: n.id,
    type: n.type,
    category,
    severity,
    priority,
    title: n.title,
    message: n.message,
    read: n.read,
    link: n.link ?? n.related?.href,
    related: n.related,
    createdAt: n.createdAt,
  }
}

export function unreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length
}

export function countByCategory(
  notifications: AppNotification[],
): Record<NotificationCategory, number> {
  const base: Record<NotificationCategory, number> = {
    stock: 0,
    sales: 0,
    purchase: 0,
    payments: 0,
    invoices: 0,
    approvals: 0,
    system: 0,
  }
  for (const n of notifications) {
    const cat = n.category ?? categoryFromType(n.type)
    base[cat] += 1
  }
  return base
}

export function formatNotificationTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const diffMs = Date.now() - d.getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
