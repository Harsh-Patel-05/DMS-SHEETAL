import { useMemo } from 'react'
import { useDmsStore } from '@/store/dms-store'
import {
  canAccess,
  resolveModuleForPath,
  type PermissionAction,
} from '@/utils/permissions'
import type { PermissionModule } from '@/types'

/**
 * Hook for action-level RBAC in shared UI (buttons, empty-state CTAs, palettes).
 * Prefer this over reading roles in every page.
 */
export function usePermission(module?: PermissionModule | null) {
  const session = useDmsStore((s) => s.session)
  const roles = useDmsStore((s) => s.roles)

  return useMemo(() => {
    const check = (action: PermissionAction, mod: PermissionModule | null | undefined = module) =>
      canAccess(session, roles, mod, action)

    return {
      session,
      can: check,
      canView: (mod?: PermissionModule | null) => check('view', mod ?? module),
      canCreate: (mod?: PermissionModule | null) => check('create', mod ?? module),
      canEdit: (mod?: PermissionModule | null) => check('edit', mod ?? module),
      canDelete: (mod?: PermissionModule | null) => check('delete', mod ?? module),
      forPath: (pathname: string, action: PermissionAction = 'view') =>
        check(action, resolveModuleForPath(pathname)),
    }
  }, [session, roles, module])
}
