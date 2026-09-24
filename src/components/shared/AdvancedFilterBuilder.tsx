import { ListFilter, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type {
  AdvancedFilterField,
  AdvancedFilterGroup,
  SavedAdvancedFilter,
} from '@/types/advanced-filter'
import {
  cloneFilterGroup,
  createConditionId,
  createEmptyGroup,
  isAdvancedFilterActive,
  OPERATOR_LABELS,
  operatorsForValueType,
  sanitizeOperatorsForFields,
} from '@/utils/advanced-filter'
import { useSavedFiltersStore } from '@/store/saved-filters-store'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { cn } from '@/utils/cn'

export interface AdvancedFilterBuilderProps {
  open: boolean
  onClose: () => void
  contextId: string
  fields: AdvancedFilterField[]
  value: AdvancedFilterGroup | null
  onApply: (group: AdvancedFilterGroup | null) => void
}

export function AdvancedFilterBuilder({
  open,
  onClose,
  contextId,
  fields,
  value,
  onApply,
}: AdvancedFilterBuilderProps) {
  const listForContext = useSavedFiltersStore((s) => s.listForContext)
  const saveUserFilter = useSavedFiltersStore((s) => s.saveUserFilter)
  const deleteUserFilter = useSavedFiltersStore((s) => s.deleteUserFilter)

  const savedFilters = useMemo(() => listForContext(contextId), [listForContext, contextId])

  const [draft, setDraft] = useState<AdvancedFilterGroup>(() => createEmptyGroup())
  const [selectedSavedId, setSelectedSavedId] = useState('')
  const [saveName, setSaveName] = useState('')

  useEffect(() => {
    if (!open) return
    const initial = value && isAdvancedFilterActive(value) ? cloneFilterGroup(value) : createEmptyGroup()
    if (!initial.conditions[0]?.fieldId && fields[0]) {
      initial.conditions[0] = {
        ...initial.conditions[0],
        fieldId: fields[0].id,
        operator: operatorsForValueType(fields[0].valueType)[0],
      }
    }
    setDraft(sanitizeOperatorsForFields(initial, fields))
    setSelectedSavedId('')
    setSaveName('')
  }, [open, value, fields])

  const fieldMap = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields])

  const updateCondition = (id: string, patch: Partial<AdvancedFilterGroup['conditions'][0]>) => {
    setDraft((prev) =>
      sanitizeOperatorsForFields(
        {
          ...prev,
          conditions: prev.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        },
        fields,
      ),
    )
  }

  const onFieldChange = (id: string, fieldId: string) => {
    const field = fieldMap.get(fieldId)
    const operator = field ? operatorsForValueType(field.valueType)[0] : 'equals'
    updateCondition(id, { fieldId, operator, value: '' })
  }

  const addCondition = () => {
    const defaultField = fields[0]
    setDraft((prev) =>
      sanitizeOperatorsForFields(
        {
          ...prev,
          conditions: [
            ...prev.conditions,
            {
              id: createConditionId(),
              fieldId: defaultField?.id ?? '',
              operator: defaultField ? operatorsForValueType(defaultField.valueType)[0] : 'equals',
              value: '',
            },
          ],
        },
        fields,
      ),
    )
  }

  const removeCondition = (id: string) => {
    setDraft((prev) => {
      const next = prev.conditions.filter((c) => c.id !== id)
      return {
        ...prev,
        conditions: next.length
          ? next
          : [
              {
                id: createConditionId(),
                fieldId: fields[0]?.id ?? '',
                operator: fields[0] ? operatorsForValueType(fields[0].valueType)[0] : 'equals',
                value: '',
              },
            ],
      }
    })
  }

  const loadSaved = (filter: SavedAdvancedFilter) => {
    setDraft(sanitizeOperatorsForFields(cloneFilterGroup(filter.group), fields))
    setSelectedSavedId(filter.id)
  }

  const handleApply = () => {
    const sanitized = sanitizeOperatorsForFields(draft, fields)
    onApply(isAdvancedFilterActive(sanitized) ? sanitized : null)
    onClose()
  }

  const handleClear = () => {
    onApply(null)
    onClose()
  }

  const handleSave = () => {
    if (!saveName.trim()) return
    const sanitized = sanitizeOperatorsForFields(draft, fields)
    if (!isAdvancedFilterActive(sanitized)) return
    const saved = saveUserFilter(contextId, saveName, sanitized)
    setSelectedSavedId(saved.id)
    setSaveName('')
  }

  const logicLabel = draft.logic === 'and' ? 'AND' : 'OR'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advanced filter builder"
      description="Combine conditions with AND or OR. Saved filters are stored on this device."
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Saved filters">
            <Select
              value={selectedSavedId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedSavedId(id)
                const match = savedFilters.find((f) => f.id === id)
                if (match) loadSaved(match)
              }}
            >
              <option value="">Choose a saved filter…</option>
              {savedFilters.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.isPreset ? `${f.name} (example)` : f.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Match rules">
            <Select
              value={draft.logic}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, logic: e.target.value as AdvancedFilterGroup['logic'] }))
              }
            >
              <option value="and">All conditions (AND)</option>
              <option value="or">Any condition (OR)</option>
            </Select>
          </FormField>
        </div>

        <div className="space-y-2 rounded-md border border-border bg-surface-elevated/40 p-3">
          {draft.conditions.map((condition, index) => {
            const field = fieldMap.get(condition.fieldId) ?? fields[0]
            const operators = field ? operatorsForValueType(field.valueType) : ['equals' as const]
            const showValue =
              condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty'

            return (
              <div key={condition.id}>
                {index > 0 ? (
                  <p
                    className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400"
                    aria-hidden
                  >
                    {logicLabel}
                  </p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                  <FormField label={index === 0 ? 'Field' : ' '} className="min-w-0">
                    <Select
                      value={condition.fieldId}
                      onChange={(e) => onFieldChange(condition.id, e.target.value)}
                    >
                      {fields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={index === 0 ? 'Operator' : ' '} className="min-w-0">
                    <Select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(condition.id, {
                          operator: e.target.value as typeof condition.operator,
                        })
                      }
                    >
                      {operators.map((op) => (
                        <option key={op} value={op}>
                          {OPERATOR_LABELS[op]}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={index === 0 ? 'Value' : ' '} className="min-w-0">
                    {showValue ? (
                      field?.valueType === 'select' && field.options?.length ? (
                        <Select
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        >
                          <option value="">Select…</option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          value={condition.value}
                          placeholder={
                            field?.valueType === 'currency'
                              ? 'e.g. ₹50,000'
                              : field?.valueType === 'number'
                                ? 'e.g. 10'
                                : 'Value'
                          }
                          onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                        />
                      )
                    ) : (
                      <Input value="—" disabled className="text-ink-muted" />
                    )}
                  </FormField>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn('h-9 w-9 shrink-0 p-0', index === 0 && 'sm:mb-0')}
                    aria-label="Remove condition"
                    onClick={() => removeCondition(condition.id)}
                    disabled={draft.conditions.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-ink-muted" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addCondition}>
          <Plus className="h-4 w-4" />
          Add condition
        </Button>

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <FormField label="Save filter as" className="min-w-0 flex-1">
              <Input
                value={saveName}
                placeholder="My custom filter"
                onChange={(e) => setSaveName(e.target.value)}
              />
            </FormField>
            <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={!saveName.trim()}>
              Save
            </Button>
            {selectedSavedId && !selectedSavedId.startsWith('preset_') ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger"
                onClick={() => {
                  deleteUserFilter(selectedSavedId)
                  setSelectedSavedId('')
                }}
              >
                Delete saved
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Clear & close
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleApply}>
              Apply filter
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export interface AdvancedFilterTriggerProps {
  active: boolean
  onClick: () => void
  className?: string
}

export function AdvancedFilterTrigger({ active, onClick, className }: AdvancedFilterTriggerProps) {
  return (
    <Button type="button" variant="outline" size="sm" className={cn('gap-1.5', className)} onClick={onClick}>
      <ListFilter className="h-4 w-4" />
      <span className="hidden sm:inline">Filter builder</span>
      <span className="sm:hidden">Builder</span>
      {active ? (
        <span className="rounded bg-brand-600 px-1.5 text-[10px] font-semibold text-white">On</span>
      ) : null}
    </Button>
  )
}
