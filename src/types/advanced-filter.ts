export type FilterLogic = 'and' | 'or'

export type FilterValueType = 'text' | 'number' | 'currency' | 'select'

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'less_than'
  | 'less_or_equal'
  | 'greater_than'
  | 'greater_or_equal'
  | 'is_empty'
  | 'is_not_empty'

export interface AdvancedFilterField {
  id: string
  label: string
  valueType: FilterValueType
  options?: Array<{ label: string; value: string }>
}

export interface AdvancedFilterCondition {
  id: string
  fieldId: string
  operator: FilterOperator
  value: string
}

export interface AdvancedFilterGroup {
  logic: FilterLogic
  conditions: AdvancedFilterCondition[]
}

export interface SavedAdvancedFilter {
  id: string
  name: string
  contextId: string
  group: AdvancedFilterGroup
  /** Built-in example filter — not removable */
  isPreset?: boolean
}
