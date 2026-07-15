import type { MouseEvent, ReactNode } from 'react'
import type { Navigate } from '../../types/portfolio'

const prefetchedRoutes = new Set<string>()

function prefetchRoute(href: string) {
  const route = href.split('#')[0] || '/'
  if (prefetchedRoutes.has(route)) return
  prefetchedRoutes.add(route)
  if (route === '/') void import('../../pages/HomePage')
  else if (route === '/atlas') void import('../../AtlasPage')
  else if (route === '/robotics') void import('../../pages/RoboticsPage')
  else if (route === '/awards') void import('../../pages/AwardsPage')
  else if (route === '/projects') void import('../../pages/ProjectsPage')
  else if (route === '/profile') void import('../../pages/ProfilePage')
  else if (route.startsWith('/projects/')) void import('../../pages/ProjectDetailPage')
}

type RouteLinkProps = {
  href: string
  navigate: Navigate
  className?: string
  ariaLabel?: string
  children: ReactNode
}

export default function RouteLink({ href, navigate, className, ariaLabel, children }: RouteLinkProps) {
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
      onClick={onClick}
      onPointerEnter={() => prefetchRoute(href)}
      onFocus={() => prefetchRoute(href)}
      onTouchStart={() => prefetchRoute(href)}
    >
      {children}
    </a>
  )
}
