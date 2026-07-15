import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import BrandMark from '../../BrandMark'
import { navItems } from '../../data/portfolio'
import type { Navigate, RoutePath } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

type GlobalNavProps = {
  path: RoutePath
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  navigate: Navigate
}

export default function GlobalNav({ path, menuOpen, setMenuOpen, navigate }: GlobalNavProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const triggerElement = triggerRef.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      ;(previousFocus ?? triggerElement)?.focus()
    }
  }, [menuOpen, setMenuOpen])

  const isActive = (itemPath: RoutePath) => path === itemPath || (itemPath === '/projects' && path.startsWith('/projects/'))

  return (
    <>
      <header className={`floating-nav ${path === '/' ? 'is-tunnel-nav' : ''}`}>
        <RouteLink className="brand" href="/" navigate={navigate} ariaLabel="KLzc home">
          <BrandMark variant="compact" title={null} aria-hidden="true" />
          <span>Cheng Zhang</span>
        </RouteLink>
        <nav className="desktop-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <RouteLink key={item.path} href={item.path} navigate={navigate} className={isActive(item.path) ? 'active' : ''}>
              {item.label}
            </RouteLink>
          ))}
          <RouteLink href="/#contact" navigate={navigate}>Contact</RouteLink>
        </nav>
        <button
          ref={triggerRef}
          className="mobile-menu-trigger"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            ref={dialogRef}
            id="mobile-navigation"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              ref={closeRef}
              className="mobile-menu-close"
              type="button"
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
            >
              <X size={22} />
            </button>
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.28 }}
            >
              <p>KLzc / Navigation</p>
              {navItems.map((item, index) => (
                <RouteLink key={item.path} href={item.path} navigate={navigate} className={isActive(item.path) ? 'active' : ''}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                  <em>{item.zh}</em>
                </RouteLink>
              ))}
              <RouteLink href="/#contact" navigate={navigate}>
                <span>{String(navItems.length + 1).padStart(2, '0')}</span>
                <strong>Contact</strong>
                <em>联系</em>
              </RouteLink>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
