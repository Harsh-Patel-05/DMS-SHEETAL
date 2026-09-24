export interface CreditSnapshot {
  creditLimit: number
  currentOutstanding: number
  availableCredit: number
  currentInvoice: number
  projectedOutstanding: number
  exceeded: boolean
}

export function buildCreditSnapshot(input: {
  creditLimit: number
  currentOutstanding: number
  /** Amount that will add to receivable (typically invoice due) */
  currentSaleDue: number
  /** Full invoice total for display */
  currentInvoice: number
}): CreditSnapshot {
  const availableCredit = Math.max(0, input.creditLimit - input.currentOutstanding)
  const projectedOutstanding = input.currentOutstanding + Math.max(0, input.currentSaleDue)
  return {
    creditLimit: input.creditLimit,
    currentOutstanding: input.currentOutstanding,
    availableCredit,
    currentInvoice: input.currentInvoice,
    projectedOutstanding,
    exceeded: projectedOutstanding > input.creditLimit + 0.001,
  }
}
