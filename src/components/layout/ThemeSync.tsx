import { useThemeSync } from '@/hooks/use-theme-sync'

/** Applies light/dark class on `document.documentElement` from prefs. */
export function ThemeSync() {
  useThemeSync()
  return null
}
