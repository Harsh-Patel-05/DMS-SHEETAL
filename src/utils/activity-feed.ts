import type { AuditLog, RoleName, User } from '@/types'

export interface GlobalActivityItem {
  id: string
  at: string
  /** Display actor — prefers role for feed readability */
  who: string
  whoName: string
  whoRole?: RoleName | string
  userId?: string
  /** e.g. "created Product" / "received payment" */
  didWhat: string
  /** Record label shown after the verb */
  recordLabel?: string
  recordHref?: string
  module: string
  /** Full human line: created Product "Voltas Cooler 55L" */
  summary: string
  description: string
  reference?: string
}

function resolveHref(
  module: string,
  action: string,
  reference?: string,
  description?: string,
): string | undefined {
  const ref = reference?.trim()
  const mod = module.toLowerCase()
  if (mod.includes('product')) {
    if (ref?.startsWith('prd_')) return `/master/products/${ref}`
    return '/master/products'
  }
  if (mod.includes('sale') || action.toLowerCase().includes('sale') || action.toLowerCase().includes('invoice')) {
    return '/transactions/sales'
  }
  if (mod.includes('purchase')) return '/transactions/purchases'
  if (mod.includes('payment')) return '/transactions/payments'
  if (mod.includes('customer')) {
    if (ref?.startsWith('cus_')) return `/parties/customers/${ref}`
    return '/parties/customers'
  }
  if (mod.includes('distributor')) {
    if (ref?.startsWith('dis_')) return `/parties/distributors/${ref}`
    return '/parties/distributors'
  }
  if (mod.includes('supplier')) return '/parties/suppliers'
  if (mod.includes('stock') || mod.includes('transfer') || mod.includes('adjust')) {
    if (action.toLowerCase().includes('transfer')) return '/inventory/transfer'
    return '/inventory/adjustment'
  }
  if (mod.includes('approval')) return '/admin/approvals'
  if (mod.includes('return')) {
    if (description?.toLowerCase().includes('purchase')) return '/transactions/purchase-returns'
    return '/transactions/sales-returns'
  }
  if (mod.includes('expense')) return '/transactions/expenses'
  if (mod.includes('invoice')) return '/transactions/invoices'
  return undefined
}

function extractQuoted(text: string): string | undefined {
  const m = text.match(/"([^"]+)"|'([^']+)'/)
  return m?.[1] ?? m?.[2]
}

function extractAmount(text: string): string | undefined {
  const m = text.match(/₹[\d,]+(?:\.\d+)?/)
  return m?.[0]
}

function extractNamedEntity(description: string): string | undefined {
  const created = description.match(/Created\s+(.+)$/i)
  if (created) return created[1].replace(/\s*\(.*$/, '').trim()
  const updated = description.match(/Updated(?:\s+selling price for)?\s+(.+)$/i)
  if (updated) return updated[1].trim()
  const deleted = description.match(/Deleted\s+(.+)$/i)
  if (deleted) return deleted[1].trim()
  return extractQuoted(description)
}

function shouldQuote(didWhat: string, recordLabel?: string): boolean {
  if (!recordLabel || recordLabel.startsWith('₹')) return false
  return (
    didWhat.startsWith('created ') ||
    didWhat.startsWith('updated ') ||
    didWhat.startsWith('deleted ') ||
    didWhat.startsWith('cancelled ') ||
    didWhat.startsWith('submitted ') ||
    didWhat.startsWith('approved ') ||
    didWhat.startsWith('rejected ') ||
    didWhat.startsWith('completed ') ||
    didWhat.startsWith('adjusted ')
  )
}

/** Map audit rows into Who / Did what / Record / When feed items */
export function buildGlobalActivityFeed(input: {
  auditLogs: AuditLog[]
  users?: User[]
  limit?: number
}): GlobalActivityItem[] {
  const { auditLogs, users = [], limit = 150 } = input
  const items: GlobalActivityItem[] = []

  for (const log of auditLogs) {
    const user = users.find((u) => u.id === log.userId)
    const whoName = user?.name ?? log.userName
    const whoRole = user?.roleName
    const who = whoRole ?? whoName

    const action = log.action
    const lower = action.toLowerCase()
    const desc = log.description
    const ref = log.reference

    let didWhat = action
    let recordLabel: string | undefined = ref

    if (lower.includes('product') && lower.includes('created')) {
      didWhat = 'created Product'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('product') && lower.includes('updated')) {
      didWhat = 'updated Product'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('product') && lower.includes('deleted')) {
      didWhat = 'deleted Product'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('sale') && (lower.includes('created') || lower.includes('confirm'))) {
      didWhat = 'created Invoice'
      recordLabel = ref ?? extractQuoted(desc)
    } else if (lower.includes('sale') && lower.includes('cancel')) {
      didWhat = 'cancelled Invoice'
      recordLabel = ref
    } else if (lower.includes('purchase') && (lower.includes('created') || lower.includes('confirm'))) {
      didWhat = 'created Purchase'
      recordLabel = ref ?? extractQuoted(desc)
    } else if (lower.includes('purchase') && lower.includes('cancel')) {
      didWhat = 'cancelled Purchase'
      recordLabel = ref
    } else if (lower.includes('payment') && lower.includes('received')) {
      didWhat = 'received payment'
      recordLabel = extractAmount(desc) ?? ref
    } else if (lower.includes('payment')) {
      didWhat = 'recorded payment'
      recordLabel = extractAmount(desc) ?? ref
    } else if (lower.includes('stock') && lower.includes('adjust')) {
      didWhat = 'adjusted Stock'
      recordLabel = ref ?? extractQuoted(desc)
    } else if (lower.includes('transfer') && lower.includes('complete')) {
      didWhat = 'completed Transfer'
      recordLabel = ref
    } else if (lower.includes('customer') && lower.includes('created')) {
      didWhat = 'created Customer'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('customer') && lower.includes('updated')) {
      didWhat = 'updated Customer'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('distributor') && lower.includes('created')) {
      didWhat = 'created Distributor'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('supplier') && lower.includes('created')) {
      didWhat = 'created Supplier'
      recordLabel = extractNamedEntity(desc) ?? ref
    } else if (lower.includes('approval') && lower.includes('submit')) {
      didWhat = 'submitted Approval'
      recordLabel = ref
    } else if (lower.includes('approval') && lower.includes('approved')) {
      didWhat = 'approved Request'
      recordLabel = ref
    } else if (lower.includes('approval') && lower.includes('reject')) {
      didWhat = 'rejected Request'
      recordLabel = ref
    } else if (lower.includes('return') && (desc.toLowerCase().includes('sales') || lower.includes('sales'))) {
      didWhat = 'created Sales Return'
      recordLabel = ref
    } else if (lower.includes('return') && desc.toLowerCase().includes('purchase')) {
      didWhat = 'created Purchase Return'
      recordLabel = ref
    } else if (lower.includes('return')) {
      didWhat = 'created Return'
      recordLabel = ref
    } else if (lower === 'login') {
      didWhat = 'signed in'
      recordLabel = undefined
    } else if (lower === 'logout') {
      didWhat = 'signed out'
      recordLabel = undefined
    } else if (lower.includes('settings')) {
      didWhat = 'updated Settings'
      recordLabel = undefined
    } else {
      didWhat = action.replace(/\s+/g, ' ').trim()
      recordLabel = ref ?? extractAmount(desc) ?? extractQuoted(desc)
    }

    const summary =
      recordLabel && shouldQuote(didWhat, recordLabel)
        ? `${didWhat} "${recordLabel}"`
        : recordLabel
          ? `${didWhat} ${recordLabel}`
          : didWhat

    items.push({
      id: log.id,
      at: log.date,
      who,
      whoName,
      whoRole,
      userId: log.userId,
      didWhat,
      recordLabel,
      recordHref: resolveHref(log.module, log.action, log.reference, log.description),
      module: log.module,
      summary,
      description: desc,
      reference: ref,
    })
  }

  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}

export function activityModules(items: GlobalActivityItem[]): string[] {
  return [...new Set(items.map((i) => i.module))].sort()
}

export function activityActors(items: GlobalActivityItem[]): string[] {
  return [...new Set(items.map((i) => i.who))].sort()
}
