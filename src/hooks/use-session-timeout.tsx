import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { useDmsStore } from '@/store/dms-store'

const DEFAULT_TIMEOUT_MIN = 30
const WARNING_SECONDS = 120

function timeoutMs(minutes: number) {
  return Math.max(1, minutes) * 60 * 1000
}

/**
 * Frontend-only session idle timeout with warning modal.
 * Tracks activity via pointer/keyboard/scroll and store lastActivityAt.
 */
export function useSessionTimeout() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const session = useDmsStore((s) => s.session)
  const settings = useDmsStore((s) => s.settings)
  const touchSessionActivity = useDmsStore((s) => s.touchSessionActivity)
  const logout = useDmsStore((s) => s.logout)

  const timeoutMinutes = settings.sessionTimeoutMinutes ?? DEFAULT_TIMEOUT_MIN
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [warningOpen, setWarningOpen] = useState(false)
  const expiredRef = useRef(false)

  const expire = useCallback(() => {
    if (expiredRef.current) return
    expiredRef.current = true
    setWarningOpen(false)
    logout()
    toast({
      title: 'Session expired',
      description: 'You were signed out due to inactivity.',
      variant: 'warning',
    })
    navigate('/login', { replace: true, state: { reason: 'timeout' } })
  }, [logout, navigate, toast])

  const staySignedIn = useCallback(() => {
    touchSessionActivity()
    setWarningOpen(false)
    setSecondsLeft(null)
  }, [touchSessionActivity])

  useEffect(() => {
    if (!session) {
      expiredRef.current = false
      setWarningOpen(false)
      setSecondsLeft(null)
      return
    }

    const onActivity = () => {
      if (warningOpen) return
      const last = session.lastActivityAt ? Date.parse(session.lastActivityAt) : 0
      if (Date.now() - last < 15_000) return
      touchSessionActivity()
    }

    const opts: AddEventListenerOptions = { passive: true }
    window.addEventListener('pointerdown', onActivity, opts)
    window.addEventListener('keydown', onActivity, opts)
    window.addEventListener('scroll', onActivity, opts)
    window.addEventListener('touchstart', onActivity, opts)

    const tick = window.setInterval(() => {
      const last = session.lastActivityAt ? Date.parse(session.lastActivityAt) : Date.now()
      const elapsed = Date.now() - last
      const limit = timeoutMs(timeoutMinutes)
      const remaining = limit - elapsed

      if (remaining <= 0) {
        expire()
        return
      }

      if (remaining <= WARNING_SECONDS * 1000) {
        setWarningOpen(true)
        setSecondsLeft(Math.ceil(remaining / 1000))
      } else {
        setWarningOpen(false)
        setSecondsLeft(null)
      }
    }, 1000)

    return () => {
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('scroll', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.clearInterval(tick)
    }
  }, [session, session?.lastActivityAt, timeoutMinutes, touchSessionActivity, expire, warningOpen])

  const mm = secondsLeft != null ? Math.floor(secondsLeft / 60) : 0
  const ss = secondsLeft != null ? secondsLeft % 60 : 0

  const warningModal = (
    <Modal
      open={warningOpen}
      onClose={staySignedIn}
      title="Session about to expire"
      size="sm"
    >
      <p className="text-sm text-ink-muted">
        Your session will end in{' '}
        <span className="font-semibold tabular-nums text-ink">
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>{' '}
        due to inactivity.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={staySignedIn}>Stay signed in</Button>
        <Button
          variant="outline"
          onClick={() => {
            setWarningOpen(false)
            logout()
            navigate('/login', { replace: true })
          }}
        >
          Sign out now
        </Button>
      </div>
    </Modal>
  )

  return {
    secondsLeft,
    warningOpen,
    warningModal,
    timeoutMinutes,
  }
}
