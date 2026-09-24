import { useRouteError } from 'react-router-dom'
import { ErrorFallback } from '@/components/shared/ErrorFallback'

/**
 * React Router route-level error UI. Logs details; never shows stack traces.
 */
export function RouteErrorPage() {
  const error = useRouteError()
  if (error) {
    console.error('[DMS] Route error:', error)
  }
  return <ErrorFallback />
}
