import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { normalizeRoute, routeTitle } from './app/routing'
import AmbientBackdrop from './components/layout/AmbientBackdrop'
import GlobalNav from './components/layout/GlobalNav'
import SiteFooter from './components/layout/SiteFooter'
import StoryRail from './components/layout/StoryRail'
import AwardModal from './components/ui/AwardModal'
import { projects } from './data/portfolio'
import type { Award, Navigate, RoutePath } from './types/portfolio'
import './App.css'
import './styles/production.css'

const HomePage = lazy(() => import('./pages/HomePage'))
const AtlasPage = lazy(() => import('./AtlasPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const RoboticsPage = lazy(() => import('./pages/RoboticsPage'))
const AwardsPage = lazy(() => import('./pages/AwardsPage'))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))

const descriptions: Record<string, string> = {
  '/': '张骋的双语个人网站：从成都到奥克兰，记录约七年 VEX 机器人经历、计算机科学学习、软件项目与 AI 工具实践。',
  '/atlas': '从成都到奥克兰的成长坐标档案，用互动地图连接张骋的学校、机器人比赛与学习经历。',
  '/robotics': '张骋与 74000M 的约七年 VEX 机器人经历，包括搭建、测试、比赛与团队协作。',
  '/awards': '张骋在 VEX 机器人比赛期间留下的部分证书、奖项与赛事记录。',
  '/projects': '张骋的精选项目，涵盖互动网页、3D 叙事、机器人档案与数据地图。',
  '/profile': '关于张骋：奥克兰大学计算机科学本科生，关注算法、软件、机器人与 AI 工具。',
}

function updateDocumentMetadata(path: RoutePath) {
  document.title = routeTitle(path)
  const routeKey = path.startsWith('/projects/') ? '/projects' : path
  const description = descriptions[routeKey] ?? descriptions['/']
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

export default function App() {
  const reducedMotion = useReducedMotion()
  const [path, setPath] = useState<RoutePath>(() => normalizeRoute(window.location.pathname))
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedAward, setSelectedAward] = useState<Award | null>(null)
  const mainContentRef = useRef<HTMLDivElement | null>(null)
  const hasNavigated = useRef(false)

  useEffect(() => {
    const normalized = normalizeRoute(window.location.pathname)
    if (normalized !== window.location.pathname) {
      window.history.replaceState({}, '', `${normalized}${window.location.hash}`)
    }
    const onPopState = () => {
      setSelectedAward(null)
      setPath(normalizeRoute(window.location.pathname))
      hasNavigated.current = true
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    updateDocumentMetadata(path)
    if (hasNavigated.current) {
      window.requestAnimationFrame(() => mainContentRef.current?.focus({ preventScroll: true }))
    }
  }, [path])

  const navigate: Navigate = (href) => {
    const [pathname, hash] = href.split('#')
    const nextPath = normalizeRoute(pathname || '/')
    const nextUrl = `${nextPath}${hash ? `#${hash}` : ''}`
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.pushState({}, '', nextUrl)
    }
    hasNavigated.current = true
    setSelectedAward(null)
    setPath(nextPath)
    setMenuOpen(false)

    window.setTimeout(() => {
      if (hash) {
        const expectedHash = `#${hash}`
        let attempts = 0
        const revealAnchor = () => {
          if (window.location.hash !== expectedHash) return
          const target = document.getElementById(hash)
          if (target) {
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
            return
          }
          attempts += 1
          if (attempts < 30) window.setTimeout(revealAnchor, 60)
        }
        revealAnchor()
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    }, 0)
  }

  const routeKey = path === '/' ? 'home' : path.startsWith('/projects/') ? 'project-detail' : path.slice(1)
  const project = path.startsWith('/projects/') ? projects.find((item) => `/projects/${item.slug}` === path) : undefined

  return (
    <main className="site-shell" data-route={routeKey}>
      <a className="skip-link" href="#main-content">跳到正文 / Skip to content</a>
      <AmbientBackdrop path={path} />
      {path !== '/atlas' ? <GlobalNav path={path} menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} /> : null}
      {path !== '/' && path !== '/atlas' ? <StoryRail path={path} navigate={navigate} /> : null}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          ref={mainContentRef}
          id="main-content"
          tabIndex={-1}
          key={path}
          className={`route-view route-view--${routeKey}`}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="route-transition" aria-hidden="true" />
          <Suspense fallback={<div className="route-loading" role="status">正在载入章节 / Loading chapter</div>}>
            {path === '/' ? <HomePage navigate={navigate} /> : null}
            {path === '/profile' ? <ProfilePage navigate={navigate} /> : null}
            {path === '/atlas' ? <AtlasPage navigate={navigate} /> : null}
            {path === '/robotics' ? <RoboticsPage navigate={navigate} /> : null}
            {path === '/awards' ? <AwardsPage onOpenAward={setSelectedAward} navigate={navigate} /> : null}
            {path === '/projects' ? <ProjectsPage navigate={navigate} /> : null}
            {project ? <ProjectDetailPage project={project} navigate={navigate} /> : null}
          </Suspense>
          {path !== '/atlas' && path !== '/' ? <SiteFooter navigate={navigate} /> : null}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedAward ? <AwardModal award={selectedAward} onClose={() => setSelectedAward(null)} /> : null}
      </AnimatePresence>
    </main>
  )
}
