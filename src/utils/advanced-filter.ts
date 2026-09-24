import type {
  AdvancedFilterCondition,
  AdvancedFilterField,
  AdvancedFilterGroup,
  FilterOperator,
  FilterValueType,
} from '@/types/advanced-filter'

export function createConditionId() {
  return `cond-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyGroup(): AdvancedFilterGroup {
  return {
    logic: 'or',
    conditions: [
      {
        id: createConditionId(),
        fieldId: '',
        operator: 'equals',
        value: '',
      },
    ],
  }
}

export function isAdvancedFilterActive(group: AdvancedFilterGroup | null | undefined): boolean {
  if (!group?.conditions.length) return false
  return group.conditions.some((c) => c.fieldId && c.operator)
}

export function parseFilterNumericValue(raw: string): number {
  const cleaned = raw.replace(/[₹,\s]/g, '').trim()
  if (!cleaned) return NaN
  return Number(cleaned)
}

const TEXT_OPERATORS: FilterOperator[] = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'starts_with',
  'is_empty',
  'is_not_empty',
]

const NUMBER_OPERATORS: FilterOperator[] = [
  'equals',
  'not_equals',
  'less_than',
  'less_or_equal',
  'greater_than',
  'greater_or_equal',
  'is_empty',
  'is_not_empty',
]

const SELECT_OPERATORS: FilterOperator[] = ['equals', 'not_equals', 'is_empty', 'is_not_empty']

export function operatorsForValueType(valueType: FilterValueType): FilterOperator[] {
  if (valueType === 'select') return SELECT_OPERATORS
  if (valueType === 'number' || valueType === 'currency') return NUMBER_OPERATORS
  return TEXT_OPERATORS
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  starts_with: 'starts with',
  less_than: 'less than',
  less_or_equal: 'less than or equal',
  greater_than: 'greater than',
  greater_or_equal: 'greater than or equal',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase()
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFilterNumericValue(value)
  return NaN
}

function evaluateCondition(
  condition: AdvancedFilterCondition,
  field: AdvancedFilterField | undefined,
  rawValue: unknown,
): boolean {
  const { operator } = condition
  const valueType = field?.valueType ?? 'text'
  const compareRaw = condition.value

  if (operator === 'is_empty') {
    if (valueType === 'number' || valueType === 'currency') {
      const n = normalizeNumber(rawValue)
      return rawValue === null || rawValue === undefined || rawValue === '' || Number.isNaN(n)
    }
    return normalizeText(rawValue) === ''
  }

  if (operator === 'is_not_empty') {
    return !evaluateCondition({ ...condition, operator: 'is_empty' }, field, rawValue)
  }

  if (valueType === 'number' || valueType === 'currency') {
    const left = normalizeNumber(rawValue)
    const right = parseFilterNumericValue(compareRaw)
    if (Number.isNaN(left) || Number.isNaN(right)) return false
    switch (operator) {
      case 'equals':
        return left === right
      case 'not_equals':
        return left !== right
      case 'less_than':
        return left < right
      case 'less_or_equal':
        return left <= right
      case 'greater_than':
        return left > right
      case 'greater_or_equal':
        return left >= right
      default:
        return false
    }
  }

  const left = normalizeText(rawValue)
  const right = normalizeText(compareRaw)
  switch (operator) {
    case 'equals':
      return left === right
    case 'not_equals':
      return left !== right
    case 'contains':
      return left.includes(right)
    case 'not_contains':
      return !left.includes(right)
    case 'starts_with':
      return left.startsWith(right)
    default:
      return false
  }
}

export function evaluateAdvancedFilter<T>(
  row: T,
  group: AdvancedFilterGroup | null | undefined,
  getValue: (row: T, fieldId: string) => unknown,
  fields: AdvancedFilterField[],
): boolean {
  if (!group || !group.conditions.length) return true

  const fieldMap = new Map(fields.map((f) => [f.id, f]))
  const active = group.conditions.filter((c) => c.fieldId && c.operator)
  if (active.length === 0) return true

  const results = active.map((condition) => {
    const field = fieldMap.get(condition.fieldId)
    const raw = getValue(row, condition.fieldId)
    return evaluateCondition(condition, field, raw)
  })

  return group.logic === 'and' ? results.every(Boolean) : results.some(Boolean)
}

export function cloneFilterGroup(group: AdvancedFilterGroup): AdvancedFilterGroup {
  return {
    logic: group.logic,
    conditions: group.conditions.map((c) => ({ ...c })),
  }
}

export function sanitizeOperatorsForFields(
  group: AdvancedFilterGroup,
  fields: AdvancedFilterField[],
): AdvancedFilterGroup {
  const fieldMap = new Map(fields.map((f) => [f.id, f]))
  return {
    ...group,
    conditions: group.conditions.map((c) => {
      const field = fieldMap.get(c.fieldId)
      if (!field) return c
      const allowed = operatorsForValueType(field.valueType)
      const operator = allowed.includes(c.operator) ? c.operator : allowed[0]
      return { ...c, operator }
    }),
  }
}
