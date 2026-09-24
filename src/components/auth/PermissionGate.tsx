import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDmsStore } from '@/store/dms-store'
import {
  canAccess,
  resolveModuleForPath,
  type PermissionAction,
} from '@/utils/permissions'

/** Infer required action from path segments (view by default). */
function resolveActionForPath(pathname: string): PermissionAction {
  const path = pathname.split('?')[0] || '/'
  if (/\/new\/?$/.test(path) || /\/new\//.test(path)) return 'create'
  if (/\/edit\/?$/.test(path) || /\/edit\//.test(path)) return 'edit'
  return 'view'
}

/** Blocks outlet when the signed-in role lacks the required access for the route module. */
export function PermissionGate() {
  const location = useLocation()
  const session = useDmsStore((s) => s.session)
  const roles = useDmsStore((s) => s.roles)

  const module = resolveModuleForPath(location.pathname)
  const action = resolveActionForPath(location.pathname)
  if (!canAccess(session, roles, module, action)) {
    return (
      <Navigate
        to="/forbidden"
        replace
        state={{ from: location.pathname, module, action }}
      />
    )
  }

  return <Outlet />
}
