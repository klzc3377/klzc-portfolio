import { normalizeRoute } from './routing'

/** Restore after lazy content has mounted, not after an arbitrary delay. */
export function restoreView(hash: string, top: number, focus: boolean) {
  let stopped = false
  let scheduled = 0
  const observer = new MutationObserver(schedule)
  const timeout = window.setTimeout(stop, 15000)

  function stop() {
    stopped = true
    observer.disconnect()
    window.clearTimeout(timeout)
    window.cancelAnimationFrame(scheduled)
  }

  function schedule() {
    window.cancelAnimationFrame(scheduled)
    scheduled = window.requestAnimationFrame(restore)
  }

  function restore() {
    if (stopped) return
    const main = document.getElementById('main-content')
    if (!main || main.dataset.routePath !== normalizeRoute(window.location.pathname) || main.querySelector('[data-route-pending]')) return
    const anchor = hash ? document.getElementById(hash) : null
    if (hash && !anchor) return
    // An in-flight inertial scroll would otherwise overwrite the restored position.
    window.__lenis?.stop()
    if (anchor?.dataset.scrollEnd === 'true') {
      // Contact is in a sticky scene. Use the full section's end position.
      const section = anchor.parentElement!
      const sticky = section.querySelector<HTMLElement>('.mechanical-memory__sticky')
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top + section.offsetHeight - (sticky?.offsetHeight ?? window.innerHeight), behavior: 'instant' })
    } else if (anchor) {
      anchor.scrollIntoView({ behavior: 'instant', block: 'start' })
    } else {
      window.scrollTo({ top, behavior: 'instant' })
    }
    window.__lenis?.start()
    if (focus) main.focus({ preventScroll: true })
    stop()
  }

  observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true })
  schedule()
  return stop
}
