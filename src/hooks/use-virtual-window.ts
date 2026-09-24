import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

export interface VirtualWindowOptions {
  /** Total row count */
  count: number
  /** Estimated row height in px */
  rowHeight: number
  /** Scroll container */
  scrollRef: RefObject<HTMLElement | null>
  /** Extra rows above/below viewport */
  overscan?: number
  /** Enable virtualization (false = render all) */
  enabled?: boolean
}

export interface VirtualWindow {
  startIndex: number
  endIndex: number
  offsetTop: number
  offsetBottom: number
  onScroll: () => void
}

/**
 * Lightweight scroll window for large lists/tables — no extra dependency.
 * When disabled or count is small, returns the full range.
 */
export function useVirtualWindow({
  count,
  rowHeight,
  scrollRef,
  overscan = 6,
  enabled = true,
}: VirtualWindowOptions): VirtualWindow {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
  }, [scrollRef])

  useEffect(() => {
    if (!enabled) return
    const el = scrollRef.current
    if (!el) return
    setViewportHeight(el.clientHeight || 480)
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height
      if (h) setViewportHeight(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [enabled, scrollRef, count])

  return useMemo(() => {
    if (!enabled || count === 0) {
      return {
        startIndex: 0,
        endIndex: count,
        offsetTop: 0,
        offsetBottom: 0,
        onScroll,
      }
    }
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
    const visible = Math.ceil(viewportHeight / rowHeight) + overscan * 2
    const endIndex = Math.min(count, startIndex + visible)
    return {
      startIndex,
      endIndex,
      offsetTop: startIndex * rowHeight,
      offsetBottom: Math.max(0, (count - endIndex) * rowHeight),
      onScroll,
    }
  }, [enabled, count, rowHeight, scrollTop, viewportHeight, overscan, onScroll])
}
