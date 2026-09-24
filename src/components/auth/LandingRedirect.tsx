import { Navigate } from 'react-router-dom'
import { usePrefsStore } from '@/store/prefs-store'

/** Redirects `/` to the user's preferred landing page. */
export function LandingRedirect() {
  const landingPage = usePrefsStore((s) => s.landingPage)
  const target =
    typeof landingPage === 'string' && landingPage.startsWith('/') ? landingPage : '/dashboard'
  return <Navigate to={target} replace />
}
