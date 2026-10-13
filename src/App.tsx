import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { normalizeRoute, routeTitle } from './app/routing'
import { restoreView } from './app/scroll'
import { useSmoothScroll } from './app/smoothScroll'
import ChapterHud from './components/layout/ChapterHud'
import GlobalNav from './components/layout/GlobalNav'
import IntroSequence from './components/layout/IntroSequence'
import RouteCurtain, { type CurtainCard } from './components/layout/RouteCurtain'
import SiteFooter from './components/layout/SiteFooter'
import AwardModal from './components/ui/AwardModal'
import CinematicPointer from './components/ui/CinematicPointer'
import PageBoundary from './components/ui/PageBoundary'
import RouteLink from './components/ui/RouteLink'
import { awards, chapterFor, projects } from './data/portfolio'
import type { Award, Navigate, RoutePath } from './types/portfolio'
import './styles/cinema.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const AtlasPage = lazy(() => import('./AtlasPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const RoboticsPage = lazy(() => import('./pages/RoboticsPage'))
const AwardsPage = lazy(() => import('./pages/AwardsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))

const descriptions: Record<string, string> = {
  '/': '张骋（KLzc）的个人网站。奥克兰大学计算机科学在读，记录约七年的 VEX 机器人经历、作品与成长足迹。',
  '/atlas': '与学习和机器人比赛有关的地点。',
  '/robotics': '约七年的 VEX 机器人记录。',
  '/awards': '参加机器人比赛时留下的部分证书。',
  '/projects': '做过的一些项目。',
  '/profile': '张骋，目前在奥克兰大学读计算机科学。',
}

function updateDocumentMetadata(path: RoutePath) {
  document.title = routeTitle(path)
  const routeKey = path.startsWith('/projects/') ? '/projects' : path
  const project = projects.find((item) => `/projects/${item.slug}` === path)
  const description = project ? `${project.zh}：${project.summaryZh}` : descriptions[routeKey] ?? descriptions['/']
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', document.title)
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description)
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', `${window.location.origin}${path}`)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', document.title)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = `${window.location.origin}${path}`
}

function curtainCardFor(path: RoutePath): CurtainCard {
  const project = projects.find((item) => `/projects/${item.slug}` === path)
  if (project) return { number: '04', title: project.zh, en: project.title }
  const chapter = chapterFor(path)
  if (chapter) return { number: chapter.number, title: chapter.title, en: chapter.en }
  if (path === '/') return { number: '00', title: '从成都到奥克兰', en: 'From Chengdu to Auckland' }
  return { number: '—', title: '未找到', en: 'Page not found' }
}

export default function App() {
  const reducedMotion = useReducedMotion()
  const [path, setPath] = useState<RoutePath>(() => normalizeRoute(window.location.pathname))
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedAward, setSelectedAward] = useState<Award | null>(null)
  const [curtain, setCurtain] = useState<{ card: CurtainCard; href: string; phase: 'cover' | 'reveal' } | null>(null)
  const mainContentRef = useRef<HTMLDivElement | null>(null)
  const hasNavigated = useRef(false)
  const pendingScroll = useRef<ReturnType<typeof restoreView> | null>(null)
  const scrollTop = useRef(0)
  const scrollPositions = useRef(new Map<string, number>())
  const historyKey = useRef('')
  const restorationTop = useRef(window.history.state?.scrollTop ?? 0)
  const currentPath = useRef(path)

  useSmoothScroll(!reducedMotion, menuOpen || selectedAward !== null || curtain !== null)

  useEffect(() => {
    historyKey.current = window.history.state?.scrollKey ?? crypto.randomUUID()
    window.history.replaceState({ ...window.history.state, scrollKey: historyKey.current }, '')
    const normalized = normalizeRoute(window.location.pathname)
    if (normalized !== '/404' && normalized !== window.location.pathname) {
      window.history.replaceState({}, '', `${normalized}${window.location.hash}`)
    }
    const onPopState = () => {
      scrollPositions.current.set(historyKey.current, scrollTop.current)
      historyKey.current = window.history.state?.scrollKey ?? crypto.randomUUID()
      window.history.replaceState({ ...window.history.state, scrollKey: historyKey.current }, '')
      restorationTop.current = scrollPositions.current.get(historyKey.current) ?? window.history.state?.scrollTop ?? 0
      setSelectedAward(null)
      setMenuOpen(false)
      setCurtain(null)
      const nextPath = normalizeRoute(window.location.pathname)
      currentPath.current = nextPath
      setPath(nextPath)
      hasNavigated.current = true
      pendingScroll.current?.()
      pendingScroll.current = restoreView(window.location.hash.slice(1), restorationTop.current, true)
    }
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    const rememberScroll = () => { scrollTop.current = window.scrollY }
    window.addEventListener('scroll', rememberScroll, { passive: true })
    window.addEventListener('popstate', onPopState)
    return () => {
      window.history.scrollRestoration = previousRestoration
      window.removeEventListener('scroll', rememberScroll)
      window.removeEventListener('popstate', onPopState)
      pendingScroll.current?.()
    }
  }, [])

  useEffect(() => {
    updateDocumentMetadata(path)
    pendingScroll.current?.()
    pendingScroll.current = restoreView(window.location.hash.slice(1), restorationTop.current, hasNavigated.current)
  }, [path])

  const commitNavigation = useCallback((href: string) => {
    const [pathname, hash] = href.split('#')
    const nextPath = normalizeRoute(pathname || '/')
    const nextUrl = `${nextPath}${hash ? `#${hash}` : ''}`
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      scrollPositions.current.set(historyKey.current, scrollTop.current)
      window.history.replaceState({ ...window.history.state, scrollTop: scrollTop.current }, '')
      historyKey.current = crypto.randomUUID()
      window.history.pushState({ scrollKey: historyKey.current }, '', nextUrl)
    }
    restorationTop.current = 0
    hasNavigated.current = true
    currentPath.current = nextPath
    setSelectedAward(null)
    setPath(nextPath)
    setMenuOpen(false)

    pendingScroll.current?.()
    pendingScroll.current = restoreView(hash ?? '', 0, true)
  }, [])

  const navigate: Navigate = useCallback((href) => {
    const nextPath = normalizeRoute(href.split('#')[0] || '/')
    if (reducedMotion || nextPath === currentPath.current) {
      commitNavigation(href)
      return
    }
    setCurtain((current) => current ?? { card: curtainCardFor(nextPath), href, phase: 'cover' })
  }, [commitNavigation, reducedMotion])

  const onCurtainCovered = useCallback(() => {
    if (!curtain) return
    commitNavigation(curtain.href)
    // Hold the title card long enough to read while the next chapter mounts.
    window.setTimeout(() => setCurtain((current) => current && { ...current, phase: 'reveal' }), 520)
  }, [commitNavigation, curtain])

  const finishNavigation = () => {
    pendingScroll.current?.()
    pendingScroll.current = restoreView(window.location.hash.slice(1), restorationTop.current, hasNavigated.current)
  }

  const routeKey = path === '/' ? 'home' : path.startsWith('/projects/') ? 'project-detail' : path.slice(1)
  const project = path.startsWith('/projects/') ? projects.find((item) => `/projects/${item.slug}` === path) : undefined
  const blocking = menuOpen || selectedAward !== null
  const showHud = path !== '/' && path !== '/atlas' && path !== '/404'

  return (
    <div className="site-shell" data-route={routeKey}>
      <a className="skip-link" href="#main-content">跳到正文 / Skip to content</a>
      <CinematicPointer />
      {path !== '/atlas' ? <GlobalNav path={path} menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} /> : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          ref={mainContentRef}
          id="main-content"
          data-route-path={path}
          tabIndex={-1}
          inert={blocking}
          key={path}
          className={`route-view route-view--${routeKey}`}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : curtain ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={finishNavigation}
        >
          <PageBoundary key={path}>
          <Suspense fallback={<div className="route-loading" data-route-pending role="status">正在载入章节 / Loading chapter</div>}>
            {path === '/' ? <HomePage navigate={navigate} /> : null}
            {path === '/profile' ? <ProfilePage navigate={navigate} /> : null}
            {path === '/atlas' ? <AtlasPage navigate={navigate} /> : null}
            {path === '/robotics' ? <RoboticsPage navigate={navigate} /> : null}
            {path === '/awards' ? <AwardsPage onOpenAward={setSelectedAward} selected={selectedAward} navigate={navigate} /> : null}
            {path === '/projects' ? <ProjectsPage navigate={navigate} /> : null}
            {project ? <ProjectDetailPage project={project} navigate={navigate} /> : null}
            {path === '/404' ? <section className="route-error">
              <p className="eyebrow">404 / Page not found</p>
              <h1>这一页还没有记录。</h1>
              <p>链接可能已更改，可以从首页或项目列表继续浏览。</p>
              <div>
                <RouteLink href="/" navigate={navigate} className="solid-action">返回首页 / Home</RouteLink>
                <RouteLink href="/projects" navigate={navigate} className="quiet-action">浏览项目 / Projects</RouteLink>
              </div>
            </section> : null}
          </Suspense>
          </PageBoundary>
          {path !== '/atlas' && path !== '/' ? <SiteFooter navigate={navigate} /> : null}
        </motion.main>
      </AnimatePresence>

      {showHud ? <div className="chapter-hud-shell" inert={blocking}><ChapterHud path={path} navigate={navigate} /></div> : null}

      <AnimatePresence>
        {selectedAward ? <AwardModal
          award={selectedAward}
          index={awards.indexOf(selectedAward)}
          count={awards.length}
          onClose={() => setSelectedAward(null)}
          onStep={(direction) => setSelectedAward((current) => awards[(awards.indexOf(current!) + direction + awards.length) % awards.length])}
        /> : null}
      </AnimatePresence>

      <div className="film-grain" aria-hidden="true" />
      {curtain ? <RouteCurtain card={curtain.card} phase={curtain.phase} onCovered={onCurtainCovered} onRevealed={() => setCurtain(null)} /> : null}
      <IntroSequence />
    </div>
  )
}
