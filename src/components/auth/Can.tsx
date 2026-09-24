import type { ReactNode } from 'react'
import type { PermissionModule } from '@/types'
import { usePermission } from '@/hooks/use-permission'
import type { PermissionAction } from '@/utils/permissions'

export interface CanProps {
  module: PermissionModule
  action?: PermissionAction
  children: ReactNode
  /** Rendered when permission is missing (optional) */
  fallback?: ReactNode
}

/** Conditionally render children based on role permissions. */
export function Can({ module, action = 'view', children, fallback = null }: CanProps) {
  const { can } = usePermission(module)
  if (!can(action)) return <>{fallback}</>
  return <>{children}</>
}
