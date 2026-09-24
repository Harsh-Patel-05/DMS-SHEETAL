import { useId, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: FormFieldProps) {
  const autoId = useId()
  const fieldId = htmlFor ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: (children.props as { id?: string }).id ?? fieldId,
        'aria-invalid': error ? true : (children.props as { 'aria-invalid'?: boolean })['aria-invalid'],
        'aria-required': required || undefined,
        'aria-describedby':
          describedBy ??
          (children.props as { 'aria-describedby'?: string })['aria-describedby'],
      })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className="erp-label block">
        {label}
        {required ? (
          <>
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="erp-field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="erp-field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
