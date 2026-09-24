/** Decimal-safe money helpers (2 decimal places) */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateLineAmount(qty: number, rate: number, discount = 0): number {
  const gross = qty * rate
  const afterDiscount = gross - discount
  return roundMoney(Math.max(0, afterDiscount))
}

export function calculateDiscount(amount: number, discountPercent: number): number {
  return roundMoney((amount * discountPercent) / 100)
}

export function calculateGST(taxableAmount: number, gstRate: number, isInterState = false) {
  const tax = roundMoney((taxableAmount * gstRate) / 100)
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: tax, totalTax: tax }
  }
  const half = roundMoney(tax / 2)
  return { cgst: half, sgst: half, igst: 0, totalTax: roundMoney(half * 2) }
}

export interface InvoiceTotalsInput {
  lines: Array<{ qty: number; rate: number; discount?: number; gstRate: number }>
  otherCharges?: number
  roundOff?: number
  isInterState?: boolean
  paid?: number
}

export function calculateInvoiceTotal(input: InvoiceTotalsInput) {
  const subtotal = roundMoney(
    input.lines.reduce((sum, line) => sum + calculateLineAmount(line.qty, line.rate, line.discount ?? 0), 0),
  )
  const discount = roundMoney(input.lines.reduce((sum, line) => sum + (line.discount ?? 0), 0))

  let cgst = 0
  let sgst = 0
  let igst = 0

  for (const line of input.lines) {
    const taxable = calculateLineAmount(line.qty, line.rate, line.discount ?? 0)
    const tax = calculateGST(taxable, line.gstRate, input.isInterState)
    cgst = roundMoney(cgst + tax.cgst)
    sgst = roundMoney(sgst + tax.sgst)
    igst = roundMoney(igst + tax.igst)
  }

  const otherCharges = roundMoney(input.otherCharges ?? 0)
  const beforeRound = roundMoney(subtotal + cgst + sgst + igst + otherCharges)
  const roundOff = input.roundOff ?? roundMoney(Math.round(beforeRound) - beforeRound)
  const grandTotal = roundMoney(beforeRound + roundOff)
  const paid = roundMoney(input.paid ?? 0)
  const due = roundMoney(Math.max(0, grandTotal - paid))

  return {
    subtotal,
    discount,
    cgst,
    sgst,
    igst,
    otherCharges,
    roundOff,
    grandTotal,
    paid,
    due,
  }
}

export function calculateDueAmount(total: number, paid: number): number {
  return roundMoney(Math.max(0, total - paid))
}

export function calculateProfit(revenue: number, cogs: number, expenses = 0): {
  grossProfit: number
  netProfit: number
  margin: number
} {
  const grossProfit = roundMoney(revenue - cogs)
  const netProfit = roundMoney(grossProfit - expenses)
  const margin = revenue > 0 ? roundMoney((netProfit / revenue) * 100) : 0
  return { grossProfit, netProfit, margin }
}

export function calculateStockValue(qty: number, purchasePrice: number): number {
  return roundMoney(qty * purchasePrice)
}
