import Lenis from 'lenis'
import { useEffect } from 'react'

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

export function useSmoothScroll(enabled: boolean, locked: boolean) {
  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (!enabled || !finePointer) return
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.92,
      touchMultiplier: 1,
      syncTouch: false,
      // Modals, menus and the atlas map own their wheel gestures.
      prevent: (node) => Boolean(node.closest?.('[data-lenis-prevent], .maplibregl-map, [role="dialog"]')),
    })
    window.__lenis = lenis
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      if (window.__lenis === lenis) delete window.__lenis
    }
  }, [enabled])

  useEffect(() => {
    const lenis = window.__lenis
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [locked, enabled])
}

/** Scroll that cooperates with the inertial scroller when it is active. */
export function scrollToTop(top: number, smooth: boolean) {
  const lenis = window.__lenis
  if (lenis) {
    lenis.scrollTo(top, smooth ? { duration: 1.6 } : { immediate: true, force: true })
    return
  }
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
}
