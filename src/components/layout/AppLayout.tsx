import { lazy, Suspense, useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { MobileBottomBar } from '@/components/layout/MobileBottomBar'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { OfflineSyncBridge } from '@/components/layout/OfflineSyncBridge'
import { Sidebar } from '@/components/layout/Sidebar'
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts'
import { useSessionTimeout } from '@/hooks/use-session-timeout'

const CommandPalette = lazy(() =>
  import('@/components/layout/CommandPalette').then((m) => ({ default: m.CommandPalette })),
)
const ShortcutsHelpModal = lazy(() =>
  import('@/components/layout/ShortcutsHelpModal').then((m) => ({ default: m.ShortcutsHelpModal })),
)

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { warningModal } = useSessionTimeout()

  const toggleCommandPalette = useCallback(() => {
    setCommandOpen((v) => !v)
  }, [])

  const openShortcutHelp = useCallback(() => {
    setShortcutsOpen(true)
  }, [])

  useGlobalShortcuts({
    toggleCommandPalette,
    openShortcutHelp,
    helpOpen: shortcutsOpen,
    commandOpen,
  })

  return (
    <div className="flex min-h-screen bg-surface">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OfflineSyncBridge />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuToggle={() => setMobileOpen((v) => !v)}
          onOpenShortcuts={openShortcutHelp}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />
        <OfflineBanner />
        <main
          id="main-content"
          className="erp-page flex-1 pb-24 md:pb-6"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
      <MobileBottomBar />
      {commandOpen ? (
        <Suspense fallback={null}>
          <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
        </Suspense>
      ) : null}
      {shortcutsOpen ? (
        <Suspense fallback={null}>
          <ShortcutsHelpModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </Suspense>
      ) : null}
      {warningModal}
    </div>
  )
}
