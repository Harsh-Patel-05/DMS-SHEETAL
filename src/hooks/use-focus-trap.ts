import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus inside a container while active.
 * Restores focus to the previously focused element on cleanup.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return
    const node = containerRef.current
    if (!node) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const getFocusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
      )

    const focusables = getFocusable()
    const initial =
      focusables.find((el) => el.getAttribute('data-autofocus') === 'true') ??
      focusables[0] ??
      node
    initial.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = getFocusable()
      if (items.length === 0) {
        e.preventDefault()
        node.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (current === first || !node.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else if (current === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [active, containerRef])
}
