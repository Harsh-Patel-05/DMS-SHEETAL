import { addDays, differenceInCalendarDays, formatISO, isWithinInterval, parseISO, startOfDay } from 'date-fns'
import type { Customer, Distributor, Invoice, LedgerEntry, Purchase, Sale, Supplier } from '@/types'
import { filterConfirmedPurchases, filterConfirmedSales, isConfirmedDoc } from '@/utils/dashboard-metrics'

export type AgingBucketKey = '0-30' | '31-60' | '61-90' | '90+'

export function emptyAging(): Record<AgingBucketKey, number> {
  return { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
}

export function bucketForAge(days: number): AgingBucketKey {
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export function parseTermsDays(paymentTerms?: string): number {
  if (!paymentTerms) return 15
  const match = paymentTerms.match(/(\d+)/)
  return match ? Number(match[1]) : 15
}

function dueDateFromDoc(docDate: string, termsDays: number): string {
  return formatISO(addDays(parseISO(docDate), termsDays), { representation: 'date' })
}

function lastLedgerDate(partyId: string, partyType: string, ledger: LedgerEntry[]): string | null {
  let latest: string | null = null
  for (const row of ledger) {
    if (row.partyId !== partyId || row.partyType !== partyType) continue
    if (!latest || row.date > latest) latest = row.date
  }
  return latest
}

function receivableAnchorDate(
  partyId: string,
  partyType: 'customer' | 'distributor',
  sales: Sale[],
  ledger: LedgerEntry[],
): string {
  let oldestDue: string | null = null
  for (const s of filterConfirmedSales(sales)) {
    if (s.due <= 0) continue
    if (s.customerId !== partyId) continue
    if (!oldestDue || s.date < oldestDue) oldestDue = s.date
  }
  return oldestDue ?? lastLedgerDate(partyId, partyType, ledger) ?? formatISO(addDays(new Date(), -30), { representation: 'date' })
}

function payableAnchorDate(partyId: string, purchases: Purchase[], ledger: LedgerEntry[]): string {
  let oldestDue: string | null = null
  for (const p of filterConfirmedPurchases(purchases)) {
    if (p.due <= 0 || p.supplierId !== partyId) continue
    if (!oldestDue || p.date < oldestDue) oldestDue = p.date
  }
  return oldestDue ?? lastLedgerDate(partyId, 'supplier', ledger) ?? formatISO(addDays(new Date(), -30), { representation: 'date' })
}

export interface ReceivablePartyRow {
  id: string
  name: string
  partyType: 'customer' | 'distributor'
  balance: number
  anchorDate: string
  ageDays: number
  mobile?: string
  email?: string
}

export interface PayablePartyRow {
  id: string
  name: string
  balance: number
  anchorDate: string
  ageDays: number
  mobile?: string
  email?: string
}

export interface OutstandingDocumentRow {
  id: string
  docNo: string
  docType: 'invoice' | 'sale' | 'purchase'
  partyId: string
  partyName: string
  partyType: 'customer' | 'distributor' | 'supplier'
  date: string
  dueDate: string
  amountDue: number
  ageDays: number
  agingBucket: AgingBucketKey
  isOverdue: boolean
  isDueToday: boolean
  isDueThisWeek: boolean
  invoiceId?: string
  saleId?: string
  purchaseId?: string
  mobile?: string
  email?: string
}

export interface OutstandingSummary {
  total: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  aging: Record<AgingBucketKey, number>
}

export function buildReceivableRows(
  customers: Customer[],
  distributors: Distributor[],
  sales: Sale[],
  ledger: LedgerEntry[],
  refDate = new Date(),
): ReceivablePartyRow[] {
  const rows: ReceivablePartyRow[] = []
  for (const c of customers) {
    if (c.currentBalance <= 0) continue
    const anchorDate = receivableAnchorDate(c.id, 'customer', sales, ledger)
    rows.push({
      id: c.id,
      name: c.name,
      partyType: 'customer',
      balance: c.currentBalance,
      anchorDate,
      ageDays: differenceInCalendarDays(refDate, parseISO(anchorDate)),
      mobile: c.mobile,
      email: c.email,
    })
  }
  for (const d of distributors) {
    if (d.currentBalance <= 0) continue
    const anchorDate = receivableAnchorDate(d.id, 'distributor', sales, ledger)
    rows.push({
      id: d.id,
      name: d.companyName || d.name,
      partyType: 'distributor',
      balance: d.currentBalance,
      anchorDate,
      ageDays: differenceInCalendarDays(refDate, parseISO(anchorDate)),
      mobile: d.mobile,
      email: d.email,
    })
  }
  return rows.sort((a, b) => b.balance - a.balance)
}

export function buildPayableRows(
  suppliers: Supplier[],
  purchases: Purchase[],
  ledger: LedgerEntry[],
  refDate = new Date(),
): PayablePartyRow[] {
  return suppliers
    .filter((s) => s.currentBalance > 0)
    .map((s) => {
      const anchorDate = payableAnchorDate(s.id, purchases, ledger)
      return {
        id: s.id,
        name: s.name,
        balance: s.currentBalance,
        anchorDate,
        ageDays: differenceInCalendarDays(refDate, parseISO(anchorDate)),
        mobile: s.mobile,
        email: s.email,
      }
    })
    .sort((a, b) => b.balance - a.balance)
}

function classifyDue(dueDate: string, refDate: Date) {
  const today = startOfDay(refDate)
  const due = startOfDay(parseISO(dueDate))
  const weekEnd = addDays(today, 7)
  const isOverdue = due < today
  const isDueToday = due.getTime() === today.getTime()
  const isDueThisWeek =
    isDueToday ||
    isWithinInterval(due, { start: today, end: weekEnd })
  const ageDays = Math.max(0, differenceInCalendarDays(today, due))
  return { isOverdue, isDueToday, isDueThisWeek, ageDays }
}

export function buildReceivableDocuments(
  sales: Sale[],
  invoices: Invoice[],
  customers: Customer[],
  distributors: Distributor[],
  refDate = new Date(),
): OutstandingDocumentRow[] {
  const partyMap = new Map<string, { name: string; type: 'customer' | 'distributor'; terms: string; mobile?: string; email?: string }>()
  for (const c of customers) {
    partyMap.set(c.id, { name: c.name, type: 'customer', terms: c.paymentTerms, mobile: c.mobile, email: c.email })
  }
  for (const d of distributors) {
    partyMap.set(d.id, {
      name: d.companyName || d.name,
      type: 'distributor',
      terms: d.paymentTerms,
      mobile: d.mobile,
      email: d.email,
    })
  }

  const invoiceBySale = new Map(invoices.map((i) => [i.saleId, i]))
  const rows: OutstandingDocumentRow[] = []

  for (const sale of filterConfirmedSales(sales)) {
    if (sale.due <= 0) continue
    const party = partyMap.get(sale.customerId)
    const terms = parseTermsDays(party?.terms)
    const dueDate = dueDateFromDoc(sale.date, terms)
    const flags = classifyDue(dueDate, refDate)
    const inv = invoiceBySale.get(sale.id)
    // Age for aging buckets uses days since invoice/sale date (classic AR aging)
    const ageFromDoc = Math.max(0, differenceInCalendarDays(refDate, parseISO(sale.date)))
    rows.push({
      id: sale.id,
      docNo: sale.invoiceNo,
      docType: inv ? 'invoice' : 'sale',
      partyId: sale.customerId,
      partyName: party?.name ?? sale.customerName,
      partyType: party?.type ?? 'customer',
      date: sale.date,
      dueDate,
      amountDue: sale.due,
      ageDays: ageFromDoc,
      agingBucket: bucketForAge(ageFromDoc),
      isOverdue: flags.isOverdue,
      isDueToday: flags.isDueToday,
      isDueThisWeek: flags.isDueThisWeek,
      invoiceId: inv?.id,
      saleId: sale.id,
      mobile: party?.mobile,
      email: party?.email,
    })
  }

  return rows.sort((a, b) => b.amountDue - a.amountDue || a.dueDate.localeCompare(b.dueDate))
}

export function buildPayableDocuments(
  purchases: Purchase[],
  suppliers: Supplier[],
  refDate = new Date(),
): OutstandingDocumentRow[] {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]))
  const rows: OutstandingDocumentRow[] = []

  for (const purchase of filterConfirmedPurchases(purchases)) {
    if (purchase.due <= 0) continue
    const supplier = supplierMap.get(purchase.supplierId)
    const terms = parseTermsDays(supplier?.paymentTerms)
    const dueDate = dueDateFromDoc(purchase.date, terms)
    const flags = classifyDue(dueDate, refDate)
    const ageFromDoc = Math.max(0, differenceInCalendarDays(refDate, parseISO(purchase.date)))
    rows.push({
      id: purchase.id,
      docNo: purchase.purchaseNo,
      docType: 'purchase',
      partyId: purchase.supplierId,
      partyName: supplier?.name ?? purchase.supplierName,
      partyType: 'supplier',
      date: purchase.date,
      dueDate,
      amountDue: purchase.due,
      ageDays: ageFromDoc,
      agingBucket: bucketForAge(ageFromDoc),
      isOverdue: flags.isOverdue,
      isDueToday: flags.isDueToday,
      isDueThisWeek: flags.isDueThisWeek,
      purchaseId: purchase.id,
      mobile: supplier?.mobile,
      email: supplier?.email,
    })
  }

  return rows.sort((a, b) => b.amountDue - a.amountDue || a.dueDate.localeCompare(b.dueDate))
}

export function summarizeDocuments(
  docs: OutstandingDocumentRow[],
): OutstandingSummary {
  const aging = emptyAging()
  let total = 0
  let overdue = 0
  let dueToday = 0
  let dueThisWeek = 0

  for (const doc of docs) {
    total += doc.amountDue
    aging[doc.agingBucket] += doc.amountDue
    if (doc.isOverdue) overdue += doc.amountDue
    if (doc.isDueToday) dueToday += doc.amountDue
    if (doc.isDueThisWeek) dueThisWeek += doc.amountDue
  }

  return { total, overdue, dueToday, dueThisWeek, aging }
}

/** @deprecated Prefer summarizeDocuments for invoice-level accuracy */
export function summarizeOutstanding(
  rows: Array<{ balance: number; anchorDate: string; ageDays: number }>,
  salesOrPurchasesForOverdue: Array<{ date: string; due: number }>,
  refDate = new Date(),
): OutstandingSummary {
  const aging = emptyAging()
  let total = 0
  for (const row of rows) {
    total += row.balance
    aging[bucketForAge(row.ageDays)] += row.balance
  }

  const overdueFromDocs = salesOrPurchasesForOverdue
    .filter((d) => d.due > 0 && differenceInCalendarDays(refDate, parseISO(d.date)) > 30)
    .reduce((sum, d) => sum + d.due, 0)

  const overdue =
    overdueFromDocs > 0
      ? overdueFromDocs
      : rows.filter((r) => r.ageDays > 30).reduce((s, r) => s + r.balance, 0)

  const weekEnd = addDays(refDate, 7).toISOString().slice(0, 10)
  const todayStr = refDate.toISOString().slice(0, 10)
  const dueThisWeek = rows
    .filter((r) => r.anchorDate >= todayStr && r.anchorDate <= weekEnd)
    .reduce((s, r) => s + r.balance, 0)

  return { total, overdue, dueToday: 0, dueThisWeek, aging }
}

export function confirmedSalesWithDue(sales: Sale[]): Sale[] {
  return sales.filter((s) => isConfirmedDoc(s.status) && s.due > 0)
}

export function confirmedPurchasesWithDue(purchases: Purchase[]): Purchase[] {
  return purchases.filter((p) => isConfirmedDoc(p.status) && p.due > 0)
}
