import { navItems, projects } from '../data/portfolio'
import type { RoutePath, StaticRoute } from '../types/portfolio'

const staticRoutes = new Set(navItems.map((item) => item.path))

export function normalizeRoute(pathname: string): RoutePath {
  const path = pathname !== '/' ? pathname.replace(/\/+$/, '') : pathname
  if (staticRoutes.has(path as StaticRoute)) return path as StaticRoute
  if (path.startsWith('/projects/') && projects.some((project) => `/projects/${project.slug}` === path)) {
    return path as RoutePath
  }
  return '/'
}

export function routeTitle(path: RoutePath) {
  const project = projects.find((item) => `/projects/${item.slug}` === path)
  const page = navItems.find((item) => item.path === path)
  return `${project?.title ?? page?.label ?? 'Home'} / KLzc — Cheng Zhang`
}

export function isStoryChapterActive(href: string, path: RoutePath) {
  if (href === '/projects') return path.startsWith('/projects')
  return href === path
}
