import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import BrandMark from '../../BrandMark'
import { navItems, storyChapters } from '../../data/portfolio'
import type { Navigate, RoutePath } from '../../types/portfolio'
import RouteLink from '../ui/RouteLink'

type GlobalNavProps = {
  path: RoutePath
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  navigate: Navigate
}

const menuImages: Record<string, string> = {
  '/': '/assets/cinematic-tunnel-environment.webp',
  ...Object.fromEntries(storyChapters.map((chapter) => [chapter.href, chapter.image])),
}

const aucklandClock = new Intl.DateTimeFormat('en-NZ', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Pacific/Auckland' })

function useAucklandTime() {
  const [time, setTime] = useState(() => aucklandClock.format(new Date()))
  useEffect(() => {
    const timer = window.setInterval(() => setTime(aucklandClock.format(new Date())), 15000)
    return () => window.clearInterval(timer)
  }, [])
  return time
}

function useHideOnScroll(disabled: boolean) {
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      if (Math.abs(y - last) < 6) return
      setHidden(!disabled && y > last && y > 160)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [disabled])
  return { hidden: hidden && !disabled, scrolled }
}

export default function GlobalNav({ path, menuOpen, setMenuOpen, navigate }: GlobalNavProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [preview, setPreview] = useState<string>(path)
  const time = useAucklandTime()
  const { hidden, scrolled } = useHideOnScroll(menuOpen)
  const isHome = path === '/'

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
  const openMenu = () => {
    setPreview(path.startsWith('/projects') ? '/projects' : path)
    setMenuOpen(true)
  }

  return (
    <>
      <header
        className={`cine-nav${isHome ? ' cine-nav--home' : ''}${scrolled ? ' is-scrolled' : ''}${hidden ? ' is-hidden' : ''}`}
        inert={menuOpen}
      >
        <RouteLink className="cine-nav__brand" href="/" navigate={navigate} ariaLabel="返回首页 / KLzc home">
          <BrandMark variant="compact" title={null} aria-hidden="true" />
          <span><strong>Cheng Zhang</strong><em>KLzc · Auckland</em></span>
        </RouteLink>
        <nav className="cine-nav__links" aria-label="主导航 / Main navigation">
          {navItems.slice(1).map((item, index) => (
            <RouteLink key={item.path} href={item.path} navigate={navigate} ariaCurrent={isActive(item.path) ? 'page' : undefined} className={isActive(item.path) ? 'is-active' : ''}>
              <small>{String(index + 1).padStart(2, '0')}</small>
              <span>{item.zh}</span>
            </RouteLink>
          ))}
        </nav>
        <button
          ref={triggerRef}
          className="cine-nav__trigger"
          type="button"
          aria-label={menuOpen ? '关闭导航 / Close navigation' : '打开导航 / Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={openMenu}
        >
          <span>菜单<small>Menu</small></span>
          <i aria-hidden="true" />
        </button>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            ref={dialogRef}
            id="site-menu"
            className="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="网站导航 / Navigation"
            initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
            exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <div className="site-menu__preview" aria-hidden="true">
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={preview}
                  src={menuImages[preview] ?? menuImages['/']}
                  alt=""
                  initial={{ opacity: 0, scale: 1.12 }}
                  animate={{ opacity: 1, scale: 1.02 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </AnimatePresence>
              <span className="site-menu__preview-label">{navItems.find((item) => item.path === preview)?.label ?? 'Home'}</span>
            </div>

            <div className="site-menu__head">
              <span>KLZC / 章节索引 · Index</span>
              <button ref={closeRef} className="site-menu__close" type="button" aria-label="关闭导航 / Close navigation" onClick={() => setMenuOpen(false)}>
                <span>关闭<small>Close</small></span>
                <i aria-hidden="true" />
              </button>
            </div>

            <nav className="site-menu__list" aria-label="章节 / Chapters">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  className="site-menu__item"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.22 + index * 0.055, ease: [0.16, 1, 0.3, 1] }}
                >
                  <RouteLink
                    href={item.path}
                    navigate={navigate}
                    ariaCurrent={isActive(item.path) ? 'page' : undefined}
                    className={isActive(item.path) ? 'is-active' : ''}
                    onHover={() => setPreview(item.path)}
                  >
                    <span>{String(index).padStart(2, '0')}</span>
                    <strong>{item.zh}</strong>
                    <em>{item.label}</em>
                  </RouteLink>
                </motion.div>
              ))}
            </nav>

            <motion.div className="site-menu__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}>
              <a href="mailto:masterzc624@gmail.com"><small>联系 / Contact</small>masterzc624@gmail.com</a>
              <span><small>奥克兰 / Auckland</small>{time} NZT</span>
              <span><small>现在 / Now</small>UoA Computer Science</span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
