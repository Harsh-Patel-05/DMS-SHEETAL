/**
 * Reusable field & transaction validation for DMS.SHEETAL.
 * Use for forms, store guards, and inline error messages.
 */

export type ValidationResult = { ok: true } | { ok: false; message: string }

export function ok(): ValidationResult {
  return { ok: true }
}

export function fail(message: string): ValidationResult {
  return { ok: false, message }
}

export function firstError(...results: ValidationResult[]): ValidationResult {
  for (const r of results) {
    if (!r.ok) return r
  }
  return ok()
}

export function errorMessage(result: ValidationResult): string | undefined {
  return result.ok ? undefined : result.message
}

/** Indian mobile: optional +91 / 0 prefix, 10 digits starting 6–9. */
const MOBILE_RE = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/
/** Simple email. Empty allowed when optional. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/**
 * GSTIN: 15 chars — 2 digit state, 10 PAN, entity, Z, checksum.
 * @see https://en.wikipedia.org/wiki/GSTIN
 */
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
/** ISO date YYYY-MM-DD */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function requireNonEmpty(value: unknown, label = 'Value'): ValidationResult {
  const s = String(value ?? '').trim()
  if (!s) return fail(`${label} is required`)
  return ok()
}

export function validateQuantity(value: unknown, label = 'Quantity'): ValidationResult {
  const n = Number(value)
  if (!Number.isFinite(n)) return fail(`${label} must be a number`)
  if (n <= 0) return fail(`${label} must be greater than 0`)
  return ok()
}

export function validatePrice(value: unknown, label = 'Price'): ValidationResult {
  const n = Number(value)
  if (!Number.isFinite(n)) return fail(`${label} must be a number`)
  if (n < 0) return fail(`${label} cannot be negative`)
  return ok()
}

export function validateDiscount(value: unknown, label = 'Discount'): ValidationResult {
  const n = Number(value)
  if (!Number.isFinite(n)) return fail(`${label} must be a number`)
  if (n < 0) return fail(`${label} cannot be negative`)
  return ok()
}

/** GST rate percent — typically 0, 5, 12, 18, 28 (allow any 0–100). */
export function validateGstRate(value: unknown, label = 'GST rate'): ValidationResult {
  const n = Number(value)
  if (!Number.isFinite(n)) return fail(`${label} must be a number`)
  if (n < 0 || n > 100) return fail(`${label} must be between 0 and 100`)
  return ok()
}

export function validateMobile(
  value: unknown,
  options: { required?: boolean; label?: string } = {},
): ValidationResult {
  const label = options.label ?? 'Mobile'
  const raw = String(value ?? '').trim()
  if (!raw) {
    return options.required === false ? ok() : fail(`${label} is required`)
  }
  const compact = raw.replace(/[\s-]/g, '')
  if (!MOBILE_RE.test(compact) && !MOBILE_RE.test(raw)) {
    return fail(`${label} must be a valid 10-digit Indian number`)
  }
  return ok()
}

export function validateEmail(
  value: unknown,
  options: { required?: boolean; label?: string } = {},
): ValidationResult {
  const label = options.label ?? 'Email'
  const raw = String(value ?? '').trim()
  if (!raw) {
    return options.required ? fail(`${label} is required`) : ok()
  }
  if (!EMAIL_RE.test(raw)) return fail(`${label} is not valid`)
  return ok()
}

export function validateGstin(
  value: unknown,
  options: { required?: boolean; label?: string } = {},
): ValidationResult {
  const label = options.label ?? 'GSTIN'
  const raw = String(value ?? '').trim().toUpperCase()
  if (!raw) {
    return options.required ? fail(`${label} is required`) : ok()
  }
  if (raw.length !== 15 || !GSTIN_RE.test(raw)) {
    return fail(`${label} must be a valid 15-character GSTIN`)
  }
  return ok()
}

export function validateDate(
  value: unknown,
  options: { required?: boolean; label?: string; allowFuture?: boolean } = {},
): ValidationResult {
  const label = options.label ?? 'Date'
  const raw = String(value ?? '').trim()
  if (!raw) {
    return options.required === false ? ok() : fail(`${label} is required`)
  }
  if (!ISO_DATE_RE.test(raw)) return fail(`${label} must be YYYY-MM-DD`)
  const d = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(d.getTime())) return fail(`${label} is not a valid calendar date`)
  if (options.allowFuture === false) {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (d.getTime() > today.getTime()) return fail(`${label} cannot be in the future`)
  }
  return ok()
}

export function validateAmount(value: unknown, label = 'Amount'): ValidationResult {
  const n = Number(value)
  if (!Number.isFinite(n)) return fail(`${label} must be a number`)
  if (n <= 0) return fail(`${label} must be greater than 0`)
  return ok()
}

export function validateNonNegativeAmount(value: unknown, label = 'Amount'): ValidationResult {
  return validatePrice(value, label)
}

export interface LineItemLike {
  productId?: string
  productName?: string
  quantity: number
  rate: number
  discount?: number
  gstRate?: number
}

/** Validate a single invoice/PO line. */
export function validateLineItem(
  line: LineItemLike,
  index: number,
  options: { requireProduct?: boolean } = {},
): ValidationResult {
  const label = line.productName?.trim() || `Line ${index + 1}`
  if (options.requireProduct !== false && !String(line.productId ?? '').trim()) {
    return fail(`${label}: product is required`)
  }
  const qty = validateQuantity(line.quantity, `${label} quantity`)
  if (!qty.ok) return qty
  const rate = validatePrice(line.rate, `${label} rate`)
  if (!rate.ok) return rate
  const disc = validateDiscount(line.discount ?? 0, `${label} discount`)
  if (!disc.ok) return disc
  const discount = Number(line.discount) || 0
  const lineBase = Number(line.quantity) * Number(line.rate)
  if (discount > lineBase + 0.001) {
    return fail(`${label}: discount cannot exceed line amount`)
  }
  if (line.gstRate != null) {
    const gst = validateGstRate(line.gstRate, `${label} GST`)
    if (!gst.ok) return gst
  }
  return ok()
}

export function validateLineItems(lines: LineItemLike[]): ValidationResult {
  if (!lines.length) return fail('Add at least one product')
  for (let i = 0; i < lines.length; i++) {
    const r = validateLineItem(lines[i], i)
    if (!r.ok) return r
  }
  return ok()
}

export interface SaleInputLike {
  customerId?: string
  date?: string
  items: LineItemLike[]
  otherCharges?: number
  paid?: number
}

export function validateSaleInput(input: SaleInputLike): ValidationResult {
  return firstError(
    requireNonEmpty(input.customerId, 'Customer'),
    validateDate(input.date, { label: 'Invoice date' }),
    validateLineItems(input.items),
    validateNonNegativeAmount(input.otherCharges ?? 0, 'Other charges'),
    validateNonNegativeAmount(input.paid ?? 0, 'Paid amount'),
  )
}

export interface PurchaseInputLike {
  supplierId?: string
  date?: string
  items: LineItemLike[]
  otherCharges?: number
  roundOff?: number
  paid?: number
}

export function validatePurchaseInput(input: PurchaseInputLike): ValidationResult {
  return firstError(
    requireNonEmpty(input.supplierId, 'Supplier'),
    validateDate(input.date, { label: 'Bill date' }),
    validateLineItems(input.items),
    validateNonNegativeAmount(input.otherCharges ?? 0, 'Other charges'),
    validatePrice(input.roundOff ?? 0, 'Round off'),
    validateNonNegativeAmount(input.paid ?? 0, 'Paid amount'),
  )
}

export interface PaymentInputLike {
  partyId?: string
  date?: string
  amount: number
}

export function validatePaymentInput(input: PaymentInputLike): ValidationResult {
  return firstError(
    requireNonEmpty(input.partyId, 'Party'),
    validateDate(input.date, { label: 'Payment date' }),
    validateAmount(input.amount, 'Payment amount'),
  )
}

export interface PartyFieldsLike {
  name?: string
  mobile?: string
  email?: string
  gstNumber?: string
  creditLimit?: number
  openingBalance?: number
}

export function validatePartyFields(
  form: PartyFieldsLike,
  options: { requireMobile?: boolean; requireGstin?: boolean } = {},
): ValidationResult {
  return firstError(
    requireNonEmpty(form.name, 'Name'),
    validateMobile(form.mobile, { required: options.requireMobile !== false }),
    validateEmail(form.email, { required: false }),
    validateGstin(form.gstNumber, { required: options.requireGstin === true }),
    validateNonNegativeAmount(form.creditLimit ?? 0, 'Credit limit'),
    validatePrice(form.openingBalance ?? 0, 'Opening balance'),
  )
}

/** Normalize mobile to 10 digits when possible. */
export function normalizeMobile(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1)
  return digits
}

export function normalizeGstin(value: string): string {
  return value.trim().toUpperCase()
}
