import { useEffect } from 'react'
import { usePrefsStore } from '@/store/prefs-store'

function resolveDark(theme: 'light' | 'dark' | 'system'): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyThemeClass(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  const dark = resolveDark(theme)
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export function useThemeSync() {
  const theme = usePrefsStore((s) => s.theme)

  useEffect(() => {
    applyThemeClass(theme)

    if (theme !== 'system') return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeClass('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])
}
