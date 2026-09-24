import type { RoleName } from '@/types'

/** `null` = unlimited */
export type DiscountLimitMap = Partial<Record<RoleName, number | null>>

export const DEFAULT_DISCOUNT_LIMITS: DiscountLimitMap = {
  'Sales Executive': 5,
  Manager: 15,
  Accountant: 10,
  'Stock Manager': 0,
  Viewer: 0,
  Admin: null,
  'Super Admin': null,
}

export function getMaxDiscountPercent(
  roleName: RoleName | string | undefined,
  limits?: DiscountLimitMap | null,
): number | null {
  const map = { ...DEFAULT_DISCOUNT_LIMITS, ...(limits ?? {}) }
  if (!roleName) return map['Sales Executive'] ?? 5
  const value = map[roleName as RoleName]
  if (value === undefined) {
    // Unknown roles default to sales executive cap
    return 5
  }
  return value
}

/** Effective invoice discount % from absolute line discounts */
export function calcEffectiveDiscountPercent(discountAmount: number, subtotalAfterDiscount: number): number {
  const gross = subtotalAfterDiscount + discountAmount
  if (gross <= 0) return 0
  return (discountAmount / gross) * 100
}

export function lineDiscountPercent(quantity: number, rate: number, discount: number): number {
  const gross = quantity * rate
  if (gross <= 0) return 0
  return (discount / gross) * 100
}

export interface DiscountControlResult {
  maxPercent: number | null
  effectivePercent: number
  discountAmount: number
  unlimited: boolean
  exceeds: boolean
  /** User-facing label for max, e.g. "5%" or "Unlimited" */
  maxLabel: string
}

export function evaluateDiscountControl(input: {
  roleName?: RoleName | string
  limits?: DiscountLimitMap | null
  discountAmount: number
  subtotalAfterDiscount: number
}): DiscountControlResult {
  const maxPercent = getMaxDiscountPercent(input.roleName, input.limits)
  const effectivePercent = calcEffectiveDiscountPercent(
    input.discountAmount,
    input.subtotalAfterDiscount,
  )
  const unlimited = maxPercent === null
  const exceeds = !unlimited && effectivePercent > (maxPercent ?? 0) + 0.001
  return {
    maxPercent,
    effectivePercent,
    discountAmount: input.discountAmount,
    unlimited,
    exceeds,
    maxLabel: unlimited ? 'Unlimited' : `${maxPercent}%`,
  }
}
