import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useDmsStore } from '@/store/dms-store'

export function ProtectedRoute() {
  const session = useDmsStore((s) => s.session)
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
