import type { MouseEvent, ReactNode } from 'react'
import type { Navigate } from '../../types/portfolio'

const prefetchedRoutes = new Set<string>()

function prefetchRoute(href: string) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (connection?.saveData || connection?.effectiveType?.includes('2g')) return
  const route = href.split('#')[0] || '/'
  if (prefetchedRoutes.has(route)) return
  prefetchedRoutes.add(route)
  const request = route === '/' ? import('../../pages/HomePage')
    : route === '/atlas' ? import('../../AtlasPage')
    : route === '/robotics' ? import('../../pages/RoboticsPage')
    : route === '/awards' ? import('../../pages/AwardsPage')
    : route === '/projects' ? import('../../pages/ProjectsPage')
    : route === '/profile' ? import('../../pages/ProfilePage')
    : route.startsWith('/projects/') ? import('../../pages/ProjectDetailPage') : null
  void request?.catch(() => prefetchedRoutes.delete(route))
}

type RouteLinkProps = {
  href: string
  navigate: Navigate
  className?: string
  ariaLabel?: string
  ariaCurrent?: 'page' | 'step'
  /** Label shown inside the custom cursor while hovering. */
  cursor?: string
  onHover?: () => void
  children: ReactNode
}

export default function RouteLink({ href, navigate, className, ariaLabel, ariaCurrent, cursor, onHover, children }: RouteLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    navigate(href)
  }

  return (
    <a
      href={href}
      className={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      data-cursor={cursor}
      onClick={onClick}
      onPointerEnter={() => { prefetchRoute(href); onHover?.() }}
      onFocus={() => { prefetchRoute(href); onHover?.() }}
      onTouchStart={() => prefetchRoute(href)}
    >
      {children}
    </a>
  )
}
